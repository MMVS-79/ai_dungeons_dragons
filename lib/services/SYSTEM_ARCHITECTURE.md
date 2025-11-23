# System Architecture Overview

This document provides a comprehensive overview of the AI Dungeons & Dragons game system architecture, accurately reflecting the current implementation as of November 2024.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Concepts](#core-concepts)
- [Request Flow](#request-flow)
- [Service Layer Details](#service-layer-details)
- [Game Flow Examples](#game-flow-examples)
- [Database Schema](#database-schema)
- [Integration Points](#integration-points)

---

## Architecture Overview

The system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│  (Next.js React Components)                                     │
│  ├─ page.tsx (Campaign Interface)                               │
│  ├─ CharacterPanel, EventPanel, ChatPanel, ItemPanel            │
│  └─ DicePanel (visual dice rolling)                             │
│                                                                 │
│  Responsibilities:                                              │
│  • User interaction and UI state management                     │
│  • Fetch game state on load (GET /api/game/state)               │
│  • Send player actions (POST /api/game/action)                  │
│  • Real-time UI updates (health bars, inventory, combat)        │
└─────────────────────────────────────────────────────────────────┘
                                ↕ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                         API ROUTES                              │
│  (Next.js App Router)                                           │
│  ├─ /api/game/state (GET)  - Load game state (read-only)        │
│  └─ /api/game/action (POST) - Process player actions            │
│                                                                 │
│  Responsibilities:                                              │
│  • HTTP request handling and validation                         │
│  • GameService instantiation with API keys                      │
│  • Combat snapshot recovery on server restart                   │
│  • Response formatting                                          │
└─────────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────────┐
│                      GAME SERVICE LAYER                         │
│  (lib/services/game.service.ts)                                 │
│                                                                 │
│  Central orchestration engine - coordinates all game logic      │
│                                                                 │
│  Key Responsibilities:                                          │
│  • Player action routing and validation                         │
│  • Phase management (exploration → investigation → combat)      │
│  • Event generation and progression                             │
│  • Combat state management via snapshots                        │
│  • Boss fight triggers at event 48+                             │
│  • Victory/defeat detection and campaign completion             │
└─────────────────────────────────────────────────────────────────┘
            ↕              ↕               ↕              ↕
    ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
    │    LLM     │  │  Backend   │  │  Utils   │  │ Combat   │
    │  Service   │  │  Service   │  │ (Dice,   │  │ Snapshot │
    │            │  │            │  │  Stats)  │  │ (Memory) │
    └────────────┘  └────────────┘  └──────────┘  └──────────┘
          ↕               ↕
    ┌────────────┐  ┌────────────┐
    │   Gemini   │  │   MySQL    │
    │    API     │  │  Database  │
    └────────────┘  └────────────┘
```

---

## Core Concepts

### 1. Investigation Prompt System

**Philosophy**: Force player engagement with meaningful choices rather than accept/reject mechanics.

**Flow**:
```
Continue → Event Generated → Investigation Prompt
                                    ↓
                        "You find a mystical fountain..."
                                    ↓
                         [Investigate] [Decline]
                                    ↓
            Investigate = Apply event effects
            Decline = Skip and generate new event
```

**Event Types Supporting Investigation**:
- `Environmental` - Stat modifications (health, attack, defense)
- `Item_Drop` - Consumable items (potions, scrolls, buffs)

**Event Types Without Investigation**:
- `Descriptive` - Pure narrative, no choices
- `Combat` - Automatic engagement

### 2. Combat Snapshot System

**Problem Solved**: Preserve combat state during server restarts and ensure accurate inventory management.

**How It Works**:
```typescript
// Combat Start - Create Snapshot
{
  campaignId: number,
  enemy: Enemy,
  enemyCurrentHp: number,
  characterSnapshot: {
    currentHealth: number,
    maxHealth: number,
    baseAttack: number,
    baseDefense: number
  },
  equipment: Equipment,
  inventorySnapshot: Item[],        // Copy of inventory at combat start
  originalInventoryIds: number[],   // For tracking item usage
  temporaryBuffs: { attack: 0, defense: 0 },
  combatLog: string[],
  startedAt: Date
}
```

**Key Features**:
- Stored in global memory (`global.combatSnapshots`)
- Temporary buffs only persist during combat
- Item usage tracked by comparing snapshots
- Committed to database only after combat ends
- Recreated from database on server restart if incomplete combat detected

### 3. Event Progression System

**Campaign Structure**: 48 events → Boss fight → Victory or defeat

**Event Counter Logic**:
```
Events 1-47:  Normal event generation (LLM decides type)
Events 48+:   Forced boss encounters (difficulty ≥ 1000)
Victory:      Defeat boss → Campaign state = "completed"
Defeat:       HP ≤ 0 → Campaign state = "game_over"
```

**Descriptive Event Limiter**:
- Tracks consecutive descriptive events
- Resets after combat encounters
- Prevents boring narrative-only gameplay

### 4. Loot Formula System

**Rarity/Difficulty Scaling**:
```typescript
// Item drops during exploration
itemRarity = (eventNumber × 1) + (diceRoll × 2)

// Enemy difficulty in combat
enemyDifficulty = (eventNumber × 2) + ((diceRoll - 10) × 1)

// Combat rewards
rewardRarity = (enemyDifficulty × 0.5) + (diceRoll × 1)
```

**Examples**:
- Event 1, Roll 10: Item rarity ~21, Enemy difficulty ~2
- Event 25, Roll 15: Item rarity ~55, Enemy difficulty ~55
- Event 48, Roll 20: Item rarity ~88, Enemy difficulty ~106

**Boss Encounters**:
- Difficulty threshold: 1000+
- Guaranteed legendary rewards
- Only appear at events 48+

---

## Request Flow

### Initial Page Load

```
1. User navigates to /campaigns/[id]
        ↓
2. Frontend: useEffect(() => loadGameState())
        ↓
3. GET /api/game/state?campaignId=123
        ↓
4. API Route:
   - Check for combat snapshot in memory
   - If snapshot exists → reset to fresh state
   - If no snapshot but DB shows incomplete combat → recreate snapshot
        ↓
5. gameService.getGameState(campaignId)
   - Load campaign, character, equipment, inventory
   - Load recent events (up to 1000 for full history)
   - Determine currentPhase (exploration/investigation/combat/game_over/victory)
        ↓
6. Return GameState to frontend
        ↓
7. Frontend renders UI based on currentPhase
```

### Player Action Flow

```
1. User clicks button (Continue, Investigate, Attack, Use Item, etc.)
        ↓
2. Frontend: Send action to backend
   POST /api/game/action
   Body: {
     campaignId: 123,
     actionType: "continue",
     actionData: { itemId?: number }
   }
        ↓
3. API Route:
   - Validate campaign not ended
   - Check for lost investigation prompt (auto-decline on refresh)
        ↓
4. gameService.processPlayerAction(action)
   - Load current game state
   - Validate action against current phase
   - Route to appropriate handler:
     
     Phase: exploration
       → handleContinue() - Generate next event
     
     Phase: investigation_prompt
       → handleInvestigate() - Apply event effects
       → handleDecline() - Skip and generate new event
     
     Phase: combat
       → handleCombatAction("attack") - Process attack
       → handleCombatAction("flee") - Attempt escape
       → handleUseItemInCombat() - Use item
        ↓
5. Event Processing:
   - Call LLM for event type/description/stats
   - Roll dice for modifiers
   - Update character/enemy in database or snapshot
   - Save event to logs table
        ↓
6. Return GameServiceResponse
   {
     success: true,
     gameState: UpdatedGameState,
     message: "Narrative text...",
     choices: ["Continue Forward"] or ["Investigate", "Decline"] or ["Attack", "Flee", "Use Item"]
   }
        ↓
7. Frontend updates UI with new state
```

---

## Service Layer Details

### Game Service (`game.service.ts`)

**Core Methods**:

#### `processPlayerAction(action: PlayerAction)`
Main entry point - routes all player actions to appropriate handlers.

#### Event Generation
- `handleContinue()` - Generate next event (events 1-47) or boss fight (48+)
- Uses LLM to determine event type based on game context
- Creates investigation prompt for Environmental/Item_Drop events
- Directly processes Descriptive events
- Starts combat for Combat events

#### Investigation Phase
- `handleInvestigate()` - Apply event effects (Environmental or Item_Drop)
  - For Environmental: Request stat boost from LLM, apply with dice modifier
  - For Item_Drop: Get item by rarity, add to inventory
- `handleDecline()` - Skip current event, generate new one

#### Combat Phase
- `handleCombatAction(action, "attack")` - Process attack round
  - Player attacks using effective stats (base + equipment + buffs)
  - Enemy counterattacks if alive
  - Check for combat end (victory or defeat)
  
- `handleCombatAction(action, "flee")` - Attempt to escape
  - 50% success rate
  - Return to exploration or continue combat

- `handleUseItemInCombat()` - Use consumable item
  - Apply health restoration or stat buffs
  - Remove item from snapshot (NOT database yet)
  - Buffs are temporary (combat only)

#### Combat Resolution
- `resolveCombatEnd()` - Victory rewards or defeat handling
  - Victory: Roll for loot (items + equipment), transition to exploration
  - Defeat: Set campaign state to "game_over"

- `commitCombatSnapshot()` - Write snapshot changes to database
  - Update character HP
  - Remove used items from inventory (compare snapshot to original)
  - Clear combat snapshot from memory

#### Boss Fight Logic
- `checkForBossFight()` - Trigger boss at event 48+
- `startBossCombat()` - Create boss encounter
- Boss victory = Campaign completion

#### Helper Methods
- `getGameState()` - Load complete game state
  - Uses snapshot data during combat (NOT database)
  - Returns database data during exploration
  
- `buildLLMContext()` - Prepare context for LLM calls
  - Recent 5 events
  - Character stats (with equipment bonuses)
  - Current event number

- `validateAction()` - Ensure action is valid for current phase

### LLM Service (`llm.service.ts`)

**Purpose**: Handle all AI content generation using Google Gemini API

**Configuration**:
```typescript
model: "gemini-flash-lite-latest"
temperature: 0.9  // High creativity
topK: 40
topP: 0.95
maxOutputTokens: 1024
```

**Methods**:

#### `generateEventType(context: LLMContext): EventTypeString`
Decides which event type should occur next based on:
- Current event number
- Character health status
- Recent event history (avoid repetition)
- Statistical probabilities (30% Descriptive, 25% Environmental, 30% Combat, 15% Item_Drop)

**Returns**: One of `"Descriptive"`, `"Environmental"`, `"Combat"`, `"Item_Drop"`

#### `generateDescription(eventType: string, context: LLMContext): string`
Creates atmospheric narrative for events:
- **Descriptive**: World-building, dungeon atmosphere (2-3 sentences)
- **Environmental**: Description of interactive feature (fountain, shrine, altar)
- **Combat**: Enemy appearance and tension building
- **Item_Drop**: Item discovery location and appearance

**Returns**: Narrative text string

#### `requestStatBoost(context: LLMContext): { statType, baseValue }`
For Environmental events, determines stat modification:
- Analyzes character health percentage
- Chooses stat to modify (health, attack, defense)
- Returns base value (-5 to +15 for health, -3 to +4 for attack/defense)
- LLM output validated and clamped to ranges
- Falls back to intelligent defaults if LLM fails

**Example Output**:
```json
{
  "statType": "health",
  "baseValue": 12
}
```

**Smart Defaults**:
- HP < 50% → Prioritize health boost
- HP > 70% → Random attack/defense boost
- 20% chance of negative effect (curse/hazard)

### Backend Service (`backend.service.ts`)

**Purpose**: Database abstraction layer - all SQL operations

**Categories**:

#### Character Operations
- `getCharacter(characterId)` - Get by ID
- `getCharacterByCampaign(campaignId)` - Get by campaign
- `getCharacterWithFullData(campaignId)` - Load character + equipment + inventory
- `updateCharacter(characterId, updates)` - Update stats/equipment

#### Equipment Management
- `getWeapon/Armour/Shield(id)` - Get specific equipment
- `equipWeapon/Armour/Shield(characterId, itemId)` - Equip item
- `unequipWeapon/Armour/Shield(characterId)` - Remove equipment

#### Rarity-Based Item Selection
- `getItemByRarity(targetRarity, variance)` - Find item near rarity ±5
- `getWeaponByRarity(targetRarity, variance)` - Combat rewards
- `getArmourByRarity(targetRarity, variance)` - Combat rewards  
- `getShieldByRarity(targetRarity, variance)` - Combat rewards

Uses formula: `ORDER BY ABS(rarity - target) ASC, RAND()` for closest match with randomness

#### Enemy Operations
- `getEnemy(enemyId)` - Get by ID
- `getEnemyByDifficulty(targetDifficulty, variance, excludeBosses)` - Find enemy near difficulty ±3
- `getBossEnemy()` - Random boss (difficulty ≥ 1000)

#### Inventory Management
- `getInventory(characterId)` - Get all items
- `addItemToInventory(characterId, itemId)` - Add item
- `removeItemFromInventory(characterId, itemId)` - Remove ONE instance

**Important**: Removes only ONE item even if duplicates exist (supports stacking)

#### Campaign Operations
- `getCampaign(campaignId)` - Get campaign info
- `updateCampaign(campaignId, { state })` - Update state (active/game_over/completed)

#### Event Logging
- `saveEvent(campaignId, message, eventType, eventData)` - Log event to database
  - Auto-generates sequential event_number
  - Stores JSON eventData (combat info, item IDs, stat changes)
  
- `getRecentEvents(campaignId, limit)` - Fetch recent events
  - Default limit: 10 (now uses 1000 in game service for full history)
  - Orders by event_number DESC (newest first)

**Database Field Mapping**:
```
Database (snake_case)  →  TypeScript (camelCase)
current_health         →  currentHealth
max_health             →  maxHealth
stat_modified          →  statModified
stat_value             →  statValue
sprite_path            →  spritePath
```

### Utility Services

#### Dice Roll (`diceRoll.ts`)
```typescript
Dice_Roll.roll(): number  // Returns 1-20

Dice_Roll.classifyRoll(value): RollClassification
// Returns: "critical_failure" (1-4)
//          "regular" (5-15)
//          "critical_success" (16-20)
```

#### Stat Calculator (`statCalc.ts`)
```typescript
Stat_Calc.applyRoll(rollValue, statType, initValue): number

// Critical Failure (1-4):   finalValue = 0
// Regular (5-15):           finalValue = initValue × (1 + (rollValue - 10) / 10)
// Critical Success (16-20): finalValue = initValue × 2

// Examples:
applyRoll(3, "HEALTH", 10)  → 0    (critical failure)
applyRoll(10, "ATTACK", 5)  → 5    (average roll, 1x multiplier)
applyRoll(14, "DEFENSE", 10) → 14  (good roll, 1.4x multiplier)
applyRoll(18, "HEALTH", 15) → 30   (critical success, 2x multiplier)
```

#### Event Type (`eventType.ts`)
Tracks consecutive descriptive events to prevent boring gameplay:
```typescript
EventType.getDescriptiveCount(): number
EventType.incrementDescriptiveCount(): void
EventType.resetDescriptiveCount(): void  // After combat
```

#### Combat Snapshot (`combatSnapshot.ts`)
In-memory storage for active combat:
```typescript
createCombatSnapshot(snapshot): void
getCombatSnapshot(campaignId): CombatSnapshot | null
updateEnemyHp(campaignId, newHp): void
updateCharacterHp(campaignId, newHp): void
applyTemporaryBuff(campaignId, statType, value): void
removeItemFromSnapshot(campaignId, itemId): void
getEffectiveAttack(snapshot): number  // base + weapon + buff
getEffectiveDefense(snapshot): number  // base + shield + buff
clearCombatSnapshot(campaignId): void
```

#### Investigation Prompt (`investigationPrompt.ts`)
Temporary storage for pending investigation prompts:
```typescript
setInvestigationPrompt(campaignId, eventType, message): void
getInvestigationPrompt(campaignId): { eventType, message } | null
clearInvestigationPrompt(campaignId): void
```

#### Loot Formulas (`lootFormulas.ts`)
```typescript
calculateItemRarity(eventNumber, diceRoll): number
calculateEnemyDifficulty(eventNumber, diceRoll): number
calculateCombatRewardRarity(enemyDifficulty, diceRoll): number
getRarityRange(targetRarity, variance): { min, max }
getDifficultyRange(targetDifficulty, variance): { min, max }

// Balance configuration
BALANCE_CONFIG = {
  ITEM_EVENT_NUMBER_WEIGHT: 1,
  ITEM_DICE_ROLL_WEIGHT: 2,
  ENEMY_EVENT_NUMBER_WEIGHT: 2,
  ENEMY_DICE_ROLL_WEIGHT: 1,
  REWARD_DIFFICULTY_WEIGHT: 0.5,
  REWARD_DICE_ROLL_WEIGHT: 1,
  BOSS_DIFFICULTY_THRESHOLD: 1000,
  MAX_EVENT_NUMBER: 50,
  BOSS_FORCED_EVENT_START: 48
}
```

---

## Game Flow Examples

### Example 1: Complete Event Flow (Environmental)

```
1. User clicks "Continue Forward"
        ↓
2. POST /api/game/action { actionType: "continue" }
        ↓
3. GameService.handleContinue()
   - Event number: 15
   - Roll dice: 12
        ↓
4. LLMService.generateEventType()
   → Returns: "Environmental"
        ↓
5. LLMService.generateDescription("Environmental")
   → Returns: "You discover a mystical fountain glowing with ancient power..."
        ↓
6. Create investigation prompt:
   setInvestigationPrompt(campaignId, "Environmental", description)
        ↓
7. Return to frontend:
   {
     currentPhase: "investigation_prompt",
     message: "You discover a mystical fountain...",
     choices: ["Investigate", "Decline"]
   }
        ↓
8. User clicks "Investigate"
        ↓
9. POST /api/game/action { actionType: "investigate" }
        ↓
10. GameService.handleInvestigate()
    - Retrieve investigation prompt
    - Call LLMService.requestStatBoost()
      → Returns: { statType: "health", baseValue: 10 }
    - Roll dice: 16 (critical success!)
    - Apply modifier: Stat_Calc.applyRoll(16, "HEALTH", 10)
      → finalValue = 10 × 2 = 20 HP
    - Update character: currentHealth += 20
    - Save event to database
        ↓
11. Return to frontend:
    {
      currentPhase: "exploration",
      message: "The fountain's waters restore 20 HP! (Critical Success)",
      choices: ["Continue Forward"]
    }
```

### Example 2: Complete Combat Flow

```
1. User clicks "Continue Forward" (Event 25)
        ↓
2. GameService.handleContinue()
   - LLM decides: "Combat"
   - Calculate difficulty: (25 × 2) + (12 - 10) × 1 = 52
   - Backend.getEnemyByDifficulty(52, 3)
     → Returns: Orc Warrior (difficulty 55, HP 50, ATK 18, DEF 5)
        ↓
3. Start combat:
   - Load character + equipment + inventory
   - Create combat snapshot in memory
   - Save combat encounter event to database
        ↓
4. Return to frontend:
   {
     currentPhase: "combat",
     enemy: { name: "Orc Warrior", hp: 50, ... },
     message: "An Orc Warrior emerges from the shadows!",
     choices: ["Attack", "Flee", "Use Item"]
   }
        ↓
5. User clicks "Attack"
        ↓
6. GameService.handleCombatAction("attack")
   - Get snapshot from memory
   - Calculate player attack:
     base(15) + weapon(8) + buff(0) = 23
   - Calculate enemy defense: 5
   - Damage to enemy: max(23 - 5, 1) = 18
   - Update enemy HP: 50 - 18 = 32
        ↓
7. Enemy counterattack:
   - Enemy attack: 18
   - Player defense: base(10) + shield(6) + buff(0) = 16
   - Damage to player: max(18 - 16, 1) = 2
   - Update player HP: 85 - 2 = 83
        ↓
8. Update snapshot in memory (NOT database)
        ↓
9. Return to frontend:
   {
     currentPhase: "combat",
     enemy: { hp: 32, maxHp: 50, ... },
     combatState: { enemyCurrentHp: 32, ... },
     message: "You strike for 18 damage! The Orc hits back for 2 damage.",
     choices: ["Attack", "Flee", "Use Item"]
   }
        ↓
   [Combat continues...]
        ↓
10. After several rounds, enemy HP reaches 0
        ↓
11. GameService.resolveCombatEnd("victory")
    - Roll for rewards: 18 (critical success!)
    - Calculate reward rarity: (55 × 0.5) + (18 × 1) = 45.5
    - Backend.getWeaponByRarity(45) → Returns: Flamebrand Sword (+13 ATK)
    - Also get bonus item from critical success
    - Add items to inventory (database)
        ↓
12. Commit combat snapshot:
    - Update character HP in database: 83
    - Remove used items (if any)
    - Clear snapshot from memory
        ↓
13. Save combat conclusion event to database
        ↓
14. Return to frontend:
    {
      currentPhase: "exploration",
      message: "Victory! You found: Flamebrand Sword (+13 ATK), Health Potion",
      choices: ["Continue Forward"]
    }
```

### Example 3: Boss Fight and Victory

```
1. Event 48 reached
        ↓
2. GameService.handleContinue()
   - checkForBossFight() → TRUE
   - Backend.getBossEnemy()
     → Returns: Ancient Dragon (difficulty 1003, HP 250, ATK 34, DEF 16)
        ↓
3. Start boss combat
   - Create snapshot
   - Save encounter event
        ↓
4. [Long combat sequence...]
        ↓
5. Dragon HP reaches 0
        ↓
6. GameService.resolveCombatEnd("victory")
   - Detect boss victory
   - Award legendary loot (rarity 500+)
   - Update campaign state: "completed"
   - Commit snapshot
        ↓
7. Return to frontend:
   {
     currentPhase: "victory",
     message: "The Ancient Dragon falls! You have saved the realm!",
     choices: []
   }
        ↓
8. Frontend displays victory modal
```

### Example 4: Page Refresh During Combat

```
1. Player in combat, server restarts
        ↓
2. User refreshes page
        ↓
3. GET /api/game/state?campaignId=123
        ↓
4. API Route checks for snapshot:
   - getCombatSnapshot(123) → null (memory cleared)
        ↓
5. API Route checks database:
   - getRecentEvents(123, 10)
   - Last event: { eventType: "Combat", eventData: { phase: "encounter", enemyId: 45 } }
        ↓
6. Recreate combat snapshot:
   - Load character + equipment + inventory
   - Load enemy from database (ID 45)
   - Create fresh snapshot in memory
        ↓
7. GameService.getGameState()
   - Detects snapshot exists
   - Returns combat phase with snapshot data
        ↓
8. Frontend renders combat UI
   - Enemy displayed correctly
   - Inventory from snapshot (showing pre-combat state)
   - Temporary buffs reset (expected behavior)
```

---

## Database Schema

### Key Tables

#### `campaigns`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
account_id INT
name VARCHAR(255)
description TEXT
state VARCHAR(50) DEFAULT 'active'  -- 'active', 'game_over', 'completed'
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `characters`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
race_id INT
class_id INT
campaign_id INT UNIQUE
name VARCHAR(100)
current_health INT
max_health INT
attack INT
defense INT
sprite_path VARCHAR(255)
armour_id INT NULL
weapon_id INT NULL
shield_id INT NULL
```

#### `logs` (Event History)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
campaign_id INT
message TEXT NOT NULL
event_number INT NOT NULL
event_type VARCHAR(50)  -- 'Descriptive', 'Environmental', 'Combat', 'Item_Drop'
event_data JSON
created_at TIMESTAMP
UNIQUE (campaign_id, event_number)
```

**Example event_data**:
```json
// Combat encounter
{
  "phase": "encounter",
  "enemyId": 45,
  "enemyName": "Orc Warrior"
}

// Combat conclusion
{
  "phase": "victory",
  "enemyId": 45,
  "lootReceived": [67, 23]  // Item/equipment IDs
}

// Environmental event
{
  "statType": "health",
  "baseValue": 10,
  "finalValue": 20,
  "diceRoll": 16
}
```

#### `items`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(255) UNIQUE
rarity INT
stat_modified VARCHAR(50)  -- 'health', 'attack', 'defense'
stat_value INT  -- Can be negative for curses
description TEXT
sprite_path VARCHAR(255)
INDEX idx_rarity (rarity)
```

#### `weapons`, `armours`, `shields`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100)
rarity INT
attack/health/defense INT  -- Depending on type
description TEXT
sprite_path VARCHAR(255)
INDEX idx_rarity (rarity)
```

#### `enemies`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100)
difficulty INT
health INT
attack INT
defense INT
sprite_path VARCHAR(255)
INDEX idx_difficulty (difficulty)
```

**Difficulty Ranges**:
- 0-30: Low (Rats, Zombies, Goblins)
- 31-70: Mid (Orcs, Dark Wizards, Centaurs)
- 71-110: High (Trolls, Vampires, Minotaurs)
- 1000+: Bosses (Griffin, Dragon)

#### `character_items` (Inventory)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
character_id INT
item_id INT
created_at TIMESTAMP
FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
```

**Note**: Supports item stacking - multiple rows with same character_id + item_id

---

## Integration Points

### Frontend ↔ API Routes

**Contract**:

```typescript
// GET /api/game/state?campaignId={id}
Response: GameState

// POST /api/game/action
Request: {
  campaignId: number,
  actionType: "continue" | "investigate" | "decline" | "attack" | "flee" | "use_item_combat",
  actionData?: {
    itemId?: number  // For use_item_combat
  }
}

Response: GameServiceResponse {
  success: boolean,
  gameState: GameState,
  message: string,
  choices?: string[],
  error?: string
}
```

### API Routes ↔ Game Service

**Contract**:
```typescript
const gameService = new GameService(process.env.GEMINI_API_KEY);
const response = await gameService.processPlayerAction(action);
```

### Game Service ↔ LLM Service

**Contract**:
```typescript
const eventType = await llmService.generateEventType(context);
const description = await llmService.generateDescription(eventType, context);
const statBoost = await llmService.requestStatBoost(context);
```

### Game Service ↔ Backend Service

**Contract**:
```typescript
// Character
const { character, equipment, inventory } = 
  await BackendService.getCharacterWithFullData(campaignId);
await BackendService.updateCharacter(charId, { currentHealth: 100 });

// Items/Equipment
const item = await BackendService.getItemByRarity(targetRarity, 5);
await BackendService.addItemToInventory(charId, itemId);

// Enemies
const enemy = await BackendService.getEnemyByDifficulty(difficulty, 3);

// Events
await BackendService.saveEvent(campaignId, message, eventType, eventData);
const events = await BackendService.getRecentEvents(campaignId, 1000);

// Campaign
await BackendService.updateCampaign(campaignId, { state: "completed" });
```

---

## Summary

### Key Design Principles

1. **Forced Engagement**: Players must engage with events through investigation prompts (no simple accept/reject)

2. **Combat Snapshot System**: Preserve combat state across server restarts, track temporary buffs and item usage

3. **Progressive Difficulty**: Loot and enemies scale with event progression using mathematical formulas

4. **Two-Phase Logging**: Combat creates two logs (encounter + conclusion) for accurate history

5. **LLM Integration**: Separate calls for event type, description, and stat modifications (not monolithic)

6. **Boss Fight Trigger**: Automatic boss encounters starting at event 48

7. **Temporary vs Permanent**: Items give temporary combat buffs, environmental events give permanent stat changes

8. **Inventory Management**: Items can stack, but each use removes only ONE instance

9. **Phase-Based Validation**: Actions are validated against current game phase to prevent invalid states

10. **Database Abstraction**: Backend service provides clean camelCase interface to snake_case database

### Current Status

**Fully Implemented**:
- Complete event generation system
- Investigation prompt mechanics
- Combat system with snapshots
- Item and equipment management
- Boss fight triggers
- Victory/defeat conditions
- LLM integration for all narrative content
- Loot formula scaling
- Database persistence

**Active Routes**:
- `/api/game/state` (GET) - Load game state
- `/api/game/action` (POST) - Process all player actions

---

**Last Updated**: November 2024
**Version**: 2.0 (Complete Rewrite)

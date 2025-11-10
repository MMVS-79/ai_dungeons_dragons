# System Architecture Overview

This document provides a comprehensive overview of the AI Dungeons & Dragons game system architecture, from frontend to backend services.

## Table of Contents

- [Architecture Layers](#architecture-layers)
- [Request Flow](#request-flow)
- [Service Responsibilities](#service-responsibilities)
- [Two-Phase Event System](#two-phase-event-system)
- [Data Flow Examples](#data-flow-examples)
- [Integration Points](#integration-points)

---

## Architecture Layers

The system is organized into distinct layers, each with specific responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│  (app/campaigns/[id]/page.tsx)                              │
│  - React UI components                                       │
│  - User interaction handling (mock generateLLMResponse)      │
│  - State management (character, enemy, chat history)         │
│  - Direct rendering (NO API calls - uses mock data)          │
└─────────────────────────────────────────────────────────────┘
                         
                         (Future: Direct API calls)
                         
┌─────────────────────────────────────────────────────────────┐
│                        API ENDPOINT                          │
│  (app/api/game/action/route.ts)                             │
│  - HTTP request handling (POST)                              │
│  - Route parameter validation                                │
│  - GameService instantiation                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GAME SERVICE LAYER                        │
│  (lib/services/game.service.ts)                             │
│  - Central orchestration                                     │
│  - Phase management (exploration/combat/event_choice)        │
│  - Two-phase event coordination                              │
│  - Stat application and validation                           │
└─────┬────────────────┬──────────────────┬──────────────────┘
      │                │                  │
      ▼                ▼                  ▼
┌──────────┐  ┌─────────────────┐  ┌─────────────┐
│   LLM    │  │  Backend        │  │  Event      │
│ Service  │  │  Service        │  │  Type       │
└──────────┘  └─────────────────┘  └─────────────┘
      │                │                  │
      ▼                ▼                  ▼
┌──────────┐  ┌─────────────────┐  ┌─────────────┐
│  Gemini  │  │   Database      │  │  Dice Roll  │
│   API    │  │   (MySQL)       │  │  Stat Calc  │
└──────────┘  └─────────────────┘  └─────────────┘
```

---

## Request Flow

### Complete Request Cycle

```
1. USER ACTION
   │
   ├─→ User clicks button in UI (Continue, Search, Accept, etc.)
   │
   └─→ Frontend: handleChatAction(choice: string)
        │
        ├─→ Plays dice roll animation
        │
        └─→ Calls: generateLLMResponse(choice, diceRoll, gameState)
             │
             └─→ **CURRENT**: Uses local mock data (no API call)
                 **FUTURE**: Will call POST /api/game/action directly

2. API ENDPOINT (Ready but not connected to frontend yet)
   │
   ├─→ Parses request body
   │
   ├─→ Instantiates GameService (with Gemini API key)
   │
   └─→ Calls: gameService.processPlayerAction(playerAction)

4. GAME SERVICE (Orchestration)
   │
   ├─→ Validates game state
   │
   ├─→ Routes action to appropriate handler:
   │   • exploration → handleExplorationAction()
   │   • combat → handleCombatAction()
   │   • event_choice → handleEventChoice()
   │
   └─→ Returns: GameServiceResponse

5. RESPONSE FLOW (When API integration is enabled)
   │
   ├─→ GameService → API Endpoint → Frontend
   │
   └─→ Frontend updates UI state
        │
        ├─→ Updates character stats
        ├─→ Adds chat message
        ├─→ Updates choices/buttons
        └─→ Handles phase transitions
```

---

## Service Responsibilities

### Frontend Layer (`app/campaigns/[id]/page.tsx`)

**Purpose**: User interface and interaction

**Responsibilities**:

- Display game state (character stats, enemy, chat history)
- Handle user input (button clicks, item selection)
- Manage local UI state (dice animation, loading states)
- **CURRENT**: Use mock LLM response generator locally
- **FUTURE**: Call /api/game/action directly

**Key Functions**:

- `handleChatAction(choice)` - Process user button clicks
- `generateLLMResponse(choice, diceRoll, gameState)` - Mock data generator
- `handleItemUse(item)` - Process item usage
- `handleEquipItem(item, slot)` - Process equipment
- State updates for character, enemy, messages, choices

**Implementation Note**:
Frontend currently uses local mock data for development. API integration will be added in future sprint.

**Does NOT**:

- Directly call backend services
- Generate game events
- Make LLM calls
- Access database

---

### API Endpoint (`app/api/game/action/route.ts`)

**Purpose**: HTTP interface to game system

**Responsibilities**:

- Handle POST requests for player actions
- Handle GET requests for game state validation
- Instantiate GameService with environment config
- Return JSON responses

**Endpoints**:

**POST /api/game/action**

```typescript
Request:
{
  campaignId: number,
  actionType: ActionType,  // "continue" | "search" | "attack" | "use_item" | "pickup_item" | "reject_item" | "equip_item" | "accept_event" | "reject_event"
  actionData?: {
    itemId?: number,
    targetId?: number,
    diceRoll?: number
  }
}

Response:
GameServiceResponse {
  success: boolean,
  gameState: GameState,
  message: string,
  choices?: string[],
  combatResult?: CombatResult,
  error?: string
}
```

**Note**: Frontend currently uses mock data and does not call this endpoint.

---

### Game Service (`lib/services/game.service.ts`)

**Purpose**: Central game orchestration and business logic

**Responsibilities**:

- Coordinate all game actions
- Manage game phases (exploration, combat, event_choice)
- Implement two-phase event system
- Orchestrate LLM, Backend, and Event Type services
- Apply stat changes and combat resolution
- Validate game state

**Key Methods**:

**`processPlayerAction(action: PlayerAction)`**

- Main entry point for all player actions
- Routes to appropriate phase handler

**Phase Handlers**:

- `handleExplorationAction()` - Generates event type, sets pending event
- `handleCombatAction()` - **EMPTY STUB** - Awaiting team discussion on combat system design
- `handleEventChoice()` - Handles Accept/Reject for events (delegates to EventType.trigger())
- `handleUseItem()` - Item usage logic (healing, effects)
- `handleEquipItem()` - Equipment changes via BackendService
- `handleItemChoice()` - Pick up or reject dropped items

**Event Processing**:

- Two-phase system: Event type preview → User choice → Full event execution
- EventType service handles all event logic internally after acceptance
- GameService only orchestrates the preview phase

**Combat** (Implementation Status):

- `handleCombatAction()` - Pending team discussion (instant vs turn-based)
- Combat rewards delegated to BackendService.processCombatRewards()
- See architectural note in game.service.ts for detailed flow

**Orchestration Pattern**:

```typescript
GameService coordinates:
├─→ LLMService.generateEventType()           ✅ Implemented
├─→ LLMService.generateDescription()         ✅ Implemented
├─→ LLMService.requestStatBoost()            ✅ Implemented
├─→ EventType.trigger()                      ⏳ External file (not in scope)
├─→ Dice_Roll.roll()                         ⏳ External file (not in scope)
├─→ Stat_Calc.applyRoll()                    ⏳ External file (not in scope)
├─→ BackendService.saveEvent()               📝 Stub (step comments exist)
├─→ BackendService.updateCharacter()         📝 Stub (step comments exist)
├─→ BackendService.equipItem()               📝 Steps only (needs implementation)
└─→ BackendService.processCombatRewards()    ✅ Fully implemented with LLM
```

**Legend**:

- ✅ Fully implemented
- 📝 Stub with TODO/step comments
- ⏳ External dependency (coming from other PR)
- ⚠️ Partial implementation

---

### LLM Service (`lib/services/llm.service.ts`)

**Purpose**: Interface to Gemini API for AI-generated content

**Responsibilities**:

- Generate event types based on context
- Generate event descriptions
- Request stat modifications
- Request item drops
- Call Gemini API with structured prompts and schemas

**Multi-Call Architecture**:

**Call 1: Generate Event Type**

```typescript
generateEventType(context: LLMGameContext): Promise<EventTypeString>
// Returns: "Descriptive" | "Environmental" | "Combat" | "Item_Drop"
```

**Call 2: Generate Description**

```typescript
generateDescription(eventType: EventTypeString, context: LLMGameContext): Promise<string>
// Returns: Narrative text for the event
```

**Call 3: Request Stat Boost**

```typescript
requestStatBoost(context: LLMGameContext, eventType: EventTypeString): Promise<StatBoostResponse>
// Returns: { statType: "health"|"attack"|"defense", baseValue: number }
```

**Call 4: Request Item Drop** ✅ **FULLY IMPLEMENTED**

```typescript
RequestItemDrop(context?: LLMGameContext): Promise<{ 
  itemType: string,        // "weapon" | "armor" | "shield" | "potion"
  itemName: string, 
  itemStats: Record<string, number> 
}>
// Implementation: Full LLM integration with contextual prompts
// Schema: Enforces valid itemType enum and required fields
// Used for: Item_Drop events and critical success combat rewards
// Error handling: Falls back to health potion on failure
```

**Call 5: Request Bonus Stat** ✅ **FULLY IMPLEMENTED**

```typescript
bonusStatRequest(context?: LLMGameContext): Promise<{ 
  statType: "health" | "attack" | "defense", 
  value: number    // Clamped to 2-10
}>
// Implementation: Full LLM integration with contextual prompts
// Schema: Enforces valid statType enum and value range
// Used for: Critical success combat rewards (dice rolls 16-20)
// Error handling: Falls back to health:5 on failure
```

**Context Building**:

- Character stats (HP, attack, defense)
- Recent events (for continuity)
- Enemy state (if in combat)
- Trigger information (combat result, player action)

---

### Backend Service (`lib/services/backend.service.ts`)

**Purpose**: Database abstraction layer

**Responsibilities**:

- CRUD operations for all entities
- Database query execution
- Data mapping (snake_case ↔ camelCase)
- Pending event state management (currently in-memory)
- Current enemy state management (currently in-memory)
- Combat rewards processing with LLM integration

**Implementation Status Overview**:

- ✅ **Fully Implemented**: `processCombatRewards()` with full LLM integration
- ⚠️ **Routing Logic Implemented**: `addItemToInventory()` routes items to correct tables (needs SQL)
- 🔄 **In-Memory Implemented**: `setPendingEvent()`, `getPendingEvent()`, `setCurrentEnemy()`, `getCurrentEnemy()`
- 📝 **Stubs with Step Comments**: Most CRUD functions have detailed implementation instructions
- 📝 **Steps Only**: `equipItem()` has step-by-step comments but no code

**Entity Operations**:

**Characters** (📝 Stubs):

- `getCharacter(id)` - Fetch character by ID
- `updateCharacter(id, updates)` - Update stats/equipment
- `getCharacterByCampaign(campaignId)` - Get campaign character
- `createCharacter(data)` - Create new character with base stats

**Enemies** (📝 Stubs / 🔄 In-Memory):

- `getEnemy(id)` - 📝 Stub with steps
- `getRandomEnemy(difficulty?)` - 📝 Stub with steps
- `getCurrentEnemy(campaignId)` - 🔄 In-memory implementation (Map-based)
- `setCurrentEnemy(campaignId, enemyId)` - 🔄 In-memory implementation

**Campaigns** (📝 Stubs):

- `getCampaign(id)` - Fetch campaign
- `updateCampaign(id, updates)` - Update campaign state

**Events/Logs** (📝 Stubs):

- `saveEvent(campaignId, message, eventType, eventData)` - Save event to logs
- `getRecentEvents(campaignId, limit)` - Fetch event history
- `getNextEventNumber(campaignId)` - Get sequential event number

**Items/Inventory**:

- `getItem(id)` - 📝 Stub with steps
- `getInventory(characterId)` - 📝 Stub with steps
- `addItemToInventory(characterId, item)` - ⚠️ **ROUTING LOGIC IMPLEMENTED** (needs SQL queries)
  - **Item Routing** (switch-case by itemType):
    - `weapon` → inserts into `weapons` table, updates character.weapon_id
    - `armor` → inserts into `armours` table, updates character.armour_id
    - `shield` → inserts into `shields` table, updates character.shield_id
    - `potion` → inserts into `items` table, adds to `character_items` join table
  - Currently logs placeholder messages, ready for database implementation
- `removeItemFromInventory(characterId, itemId)` - 📝 Stub with steps
- `equipItem(characterId, itemId, slot)` - 📝 **STEPS ONLY** (needs full implementation)
  - Has detailed step-by-step comments for stat replacement logic

**Combat Rewards** ✅:

- `processCombatRewards(campaignId, characterId, rollClassification, context)` - ✅ **FULLY IMPLEMENTED**
  - **Roll Classification**:
    - `critical_failure` (1-4): No rewards
    - `regular` (5-15): Calls LLMService.requestStatBoost(), logs event
    - `critical_success` (16-20): Calls LLMService.RequestItemDrop() + bonusStatRequest(), adds item to inventory, logs event
  - **Implementation Status**:
    - ✅ LLM reward generation (requestStatBoost, RequestItemDrop, bonusStatRequest)
    - ✅ Event logging to database
    - ✅ Item inventory routing (via addItemToInventory)
    - ⏳ Character stat updates (pending getCharacter implementation)

**Pending Events** (🔄 In-Memory / 📝 Stub):

- `setPendingEvent(campaignId, eventType)` - 🔄 In-memory implementation (Map-based)
- `getPendingEvent(campaignId)` - 🔄 In-memory implementation
- `clearPendingEvent(campaignId)` - 📝 Stub (to be replaced with database storage)

**Database Field Mapping**:

```typescript
Database (snake_case)    →    TypeScript (camelCase)
─────────────────────────────────────────────────────
current_health           →    currentHealth
max_health               →    maxHealth
sprite_path              →    spritePath
race_id                  →    raceId
campaign_id              →    campaignId
weapon_id                →    weaponId
event_number             →    eventNumber
event_type               →    eventType
```

---

### Event Type Service (`lib/services/Event_type.ts`)

**Purpose**: Event type handling and descriptive counter management

**Responsibilities**:

- Track descriptive event count
- Trigger event type logic
- Coordinate event-specific flows

**Event Types**:

**Descriptive**:

- Pure narrative (no mechanical effects)
- Increments counter
- Counter prevents consecutive boring events

**Environmental**:

- Stat modifications from environment
- Calls LLMService.requestStatBoost()

**Combat**:

- Spawns enemy encounter
- Triggers combat phase
- Post-combat rewards delegated to BackendService.processCombatRewards()

**Item_Drop**:

- Items found or lost
- Calls LLMService.RequestItemDrop()

**Descriptive Counter Logic**:

```typescript
EventType.trigger("Descriptive") → Increments counter
EventType.getDescriptiveCount() → Returns count
EventType.resetDescriptiveCount() → Resets to 0 (after boss fights)

GameService checks:
if (eventType === "Descriptive" && getDescriptiveCount() > 1) {
  // Regenerate event - too many consecutive descriptive events
}
```

---

### Utility Services

#### Dice Roll (`lib/services/dice_roll.ts`)

**Purpose**: D20 dice rolling and classification

**Methods**:

- `roll()` - Returns random 1-20
- `classifyRoll(value)` - Classifies as critical_failure/regular/critical_success

**Three-Tier System**:

```
1-4:   Critical Failure
5-15:  Regular
16-20: Critical Success
```

#### Stat Calc (`lib/services/Stat_calc.ts`)

**Purpose**: Apply dice roll modifiers to stat values

**Method**:

- `applyRoll(rollValue, statType, initValue)` - Returns modified stat value

**Formula**:

```typescript
Critical Failure (1-4):   finalValue = 0
Regular (5-15):          finalValue = initValue * (1 + (rollValue - 10) / 10)
Critical Success (16-20): finalValue = initValue * 2
```

**Example**:

```
LLM says: +10 health
Roll: 18 (Critical Success)
Result: 10 * 2 = +20 health 🎉
```

---

## Two-Phase Event System

### Overview

Events are processed in two distinct phases to allow user acceptance/rejection before effects are applied.

### Phase 1: Event Type Generation

```
1. User clicks action button (Continue, Search, etc.)
   │
2. GameService.handleExplorationAction()
   │
   ├─→ LLMService.generateEventType(context)
   │   └─→ Returns: EventTypeString ("Combat", "Environmental", etc.)
   │
   ├─→ Check Descriptive counter (reject if >1)
   │
   ├─→ BackendService.setPendingEvent(campaignId, eventType)
   │
   └─→ Return: { currentPhase: "event_choice", choices: ["Accept", "Reject"] }

3. Frontend shows event preview with Accept/Reject buttons
```

### Phase 2: Event Processing (on Accept)

```
1. User clicks "Accept"
   │
2. GameService.handleEventChoice(action: "accept_event")
   │
   ├─→ Fetch pending event type
   │
   ├─→ EventType.trigger(eventType)
   │
   ├─→ LLMService.generateDescription(eventType, context)
   │
   ├─→ Process event based on type:
   │   │
   │   ├─→ Environmental:
   │   │   ├─→ LLMService.requestStatBoost()
   │   │   ├─→ Dice_Roll.roll()
   │   │   ├─→ Stat_Calc.applyRoll(rollValue, statType, baseValue)
   │   │   └─→ Apply to character
   │   │
   │   ├─→ Combat:
   │   │   ├─→ BackendService.getRandomEnemy()
   │   │   ├─→ BackendService.setCurrentEnemy()
   │   │   └─→ Transition to combat phase
   │   │
   │   ├─→ Item_Drop:
   │   │   ├─→ LLMService.RequestItemDrop()
   │   │   ├─→ Create item in database
   │   │   └─→ Add to inventory
   │   │
   │   └─→ Descriptive:
   │       └─→ No mechanical effects
   │
   ├─→ BackendService.saveEvent(message, eventType, eventData)
   │
   ├─→ BackendService.clearPendingEvent()
   │
   └─→ Return updated game state
```

### Phase 2: Rejection Flow

```
1. User clicks "Reject"
   │
2. GameService.handleEventChoice(action: "reject_event")
   │
   ├─→ BackendService.clearPendingEvent()
   │
   ├─→ Immediately call handleExplorationAction()
   │   └─→ Generates new event type
   │
   └─→ Return new event preview
```

---

## Data Flow Examples

### Example 1: Environmental Event (Complete Flow)

```
┌────────────────────────────────────────────────────────────────┐
│ USER: Clicks "Continue" button                                 │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND: handleChatAction("Continue")                         │
│ - Dice animation                                               │
│ - diceRoll = 14                                                │
│ - **CURRENT**: Calls generateLLMResponse() with mock data      │
│ - **FUTURE**: Will call POST /api/game/action                  │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼ (Future API Integration)
┌────────────────────────────────────────────────────────────────┐
│ API: POST /api/game/action                                     │
│ Body: { campaignId: 1, actionType: "continue",                │
│        actionData: { diceRoll: 14 } }                          │
│ - Creates GameService                                          │
│ - Calls processPlayerAction()                                  │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ GAME SERVICE: handleExplorationAction()                        │
│ Phase 1: Generate Event Type                                   │
│ ├─→ LLM: generateEventType()                                   │
│ │   └─→ Returns: "Environmental"                               │
│ ├─→ Backend: setPendingEvent(1, "Environmental")               │
│ └─→ Returns: { phase: "event_choice", choices: ["Accept"...] }│
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND: Displays "An environmental event is about to occur.."│
│ Shows: [Accept] [Reject] buttons                               │
└────────────────────────────────────────────────────────────────┘

               │ User clicks [Accept]
               ▼

┌────────────────────────────────────────────────────────────────┐
│ FRONTEND: Calls mock or future API                             │
│ **FUTURE**: POST /api/game/action                              │
│ Body: { campaignId: 1, actionType: "accept_event" }           │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ GAME SERVICE: handleEventChoice("accept_event")                │
│ Phase 2: Process Event                                         │
│ ├─→ Backend: getPendingEvent() → "Environmental"               │
│ ├─→ EventType.trigger("Environmental")                         │
│ ├─→ LLM: generateDescription("Environmental", context)         │
│ │   └─→ "A magical mist envelops you, boosting your vitality!"│
│ ├─→ LLM: requestStatBoost(context, "Environmental")            │
│ │   └─→ { statType: "health", baseValue: 10 }                 │
│ ├─→ Dice_Roll.roll() → 14                                      │
│ ├─→ Stat_Calc.applyRoll(14, "VIT", 10)                        │
│ │   └─→ 10 * (1 + (14-10)/10) = 10 * 1.4 = 14 health 🎲      │
│ ├─→ Backend: updateCharacter({ currentHealth: +14 })           │
│ ├─→ Backend: saveEvent(message, "Environmental", {health:14}) │
│ └─→ Backend: clearPendingEvent()                               │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND: Updates UI                                           │
│ - Character health: 50 → 64                                    │
│ - New chat message: "A magical mist... (+14 HP) 🎲"           │
│ - Choices: [Continue] [Search] [Use Item]                     │
└────────────────────────────────────────────────────────────────┘
```

### Example 2: Combat Event

```
┌────────────────────────────────────────────────────────────────┐
│ Phase 1: Combat Event Generated                                │
│ LLM returns: "Combat"                                          │
└──────────────┬─────────────────────────────────────────────────┘
               │ User Accepts
               ▼
┌────────────────────────────────────────────────────────────────┐
│ GAME SERVICE: Process Combat Event                             │
│ ├─→ LLM: generateDescription("Combat", context)                │
│ │   └─→ "A goblin leaps from the shadows!"                     │
│ ├─→ Backend: getRandomEnemy() → Goblin (HP:30, ATK:8, DEF:3) │
│ ├─→ Backend: setCurrentEnemy(campaignId, goblinId)             │
│ ├─→ Phase transition: "combat"                                 │
│ └─→ Returns: { phase: "combat", enemy: Goblin, choices: ... } │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND: Combat UI                                            │
│ Shows enemy sprite, HP bar, combat choices                     │
│ Choices: [Attack] [Use Item]                                   │
│ NOTE: Combat system design pending team discussion             │
└────────────────────────────────────────────────────────────────┘

               │ User clicks [Attack]
               ▼

┌────────────────────────────────────────────────────────────────┐
│ GAME SERVICE: handleCombatAction("attack")                     │
│ ├─→ Dice_Roll.roll() → 18 (CRITICAL! ✨)                      │
│ ├─→ Character damage: 10 * 2 = 20 (crit multiplier)           │
│ ├─→ Enemy damage: 8 (goblin attacks back)                      │
│ ├─→ Update: Character HP -8, Enemy HP -20                      │
│ ├─→ LLM: generateEvent(combatContext) → flavor text            │
│ │   └─→ "Your blade strikes true! Critical hit!"               │
│ └─→ Enemy HP: 30 → 10                                          │
└──────────────┬─────────────────────────────────────────────────┘
               │ Combat continues...
               │ Another attack defeats goblin
               ▼
┌────────────────────────────────────────────────────────────────┐
│ GAME SERVICE: Enemy defeated                                   │
│ ├─→ Backend: setCurrentEnemy(campaignId, null)                 │
│ ├─→ EventType.resetDescriptiveCount() (if boss)                │
│ ├─→ handlePostCombatRewards()                                  │
│ │   ├─→ Roll for rewards: 19 (Critical Success!)               │
│ │   ├─→ LLM: RequestItemDrop() → Rare Sword                    │
│ │   └─→ LLM: bonusStatRequest() → +5 Attack                    │
│ └─→ Phase transition: "exploration"                            │
└────────────────────────────────────────────────────────────────┘
```

### Example 3: Event Rejection Flow

```
┌────────────────────────────────────────────────────────────────┐
│ Phase 1: User sees "A descriptive event is about to occur..."  │
│ [Accept] [Reject]                                              │
└────────────────────────────────────────────────────────────────┘

               │ User clicks [Reject]
               ▼

┌────────────────────────────────────────────────────────────────┐
│ GAME SERVICE: handleEventChoice("reject_event")                │
│ ├─→ Backend: clearPendingEvent(campaignId)                     │
│ ├─→ Immediately call: handleExplorationAction()                │
│ │   ├─→ LLM: generateEventType() → "Environmental"             │
│ │   └─→ Backend: setPendingEvent(1, "Environmental")           │
│ └─→ Returns new event preview                                  │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND: New event preview displayed                          │
│ "An environmental event is about to occur..."                  │
│ [Accept] [Reject]                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Frontend ↔ API Endpoint (Future Integration)

**Interface**: HTTP POST

**Current Status**: Frontend uses local mock data. API integration planned for future sprint.

**Future Contract**:

```typescript
POST /api/game/action
Request Body:
{
  campaignId: number,
  actionType: ActionType,  // "continue" | "search" | "attack" | "use_item" | ...
  actionData?: {
    itemId?: number,
    targetId?: number,
    diceRoll?: number
  }
}

Response:
GameServiceResponse {
  success: boolean,
  gameState: GameState,
  message: string,
  choices?: string[],
  combatResult?: CombatResult,
  error?: string
}
```

**Responsibilities**:

- Frontend: Build request payload, handle response, update UI
- API Endpoint: HTTP server, JSON parsing, error handling, GameService instantiation

---

### API Endpoint ↔ Game Service

**Interface**: Direct TypeScript class instantiation

**Contract**:

```typescript
const gameService = new GameService(apiKey);
const response = await gameService.processPlayerAction(playerAction);
```

**Responsibilities**:

- API Endpoint: Service instantiation, error handling
- Game Service: All game logic, orchestration

---

### Game Service ↔ LLM Service

**Interface**: Direct TypeScript class method calls

**Contract**:

```typescript
// Event type generation
const eventType = await llmService.generateEventType(context);

// Description generation
const description = await llmService.generateDescription(eventType, context);

// Stat boost request
const statBoost = await llmService.requestStatBoost(context, eventType);
```

**Responsibilities**:

- Game Service: Build LLMGameContext, handle responses
- LLM Service: API calls, prompt engineering, schema validation

---

### Game Service ↔ Backend Service

**Interface**: Direct TypeScript function calls (exported functions)

**Contract**:

```typescript
// Character operations
const character = await BackendService.getCharacter(id);
await BackendService.updateCharacter(id, { currentHealth: 100 });

// Event operations
await BackendService.setPendingEvent(campaignId, "Combat");
const eventType = await BackendService.getPendingEvent(campaignId);
await BackendService.clearPendingEvent(campaignId);

// Event logging
await BackendService.saveEvent(campaignId, message, eventType, eventData);
```

**Responsibilities**:

- Game Service: Orchestrate when to call, what data to pass
- Backend Service: Database operations, data mapping

---

### Game Service ↔ Event Type Service

**Interface**: Direct TypeScript class static methods

**Contract**:

```typescript
// Trigger event type (increments descriptive counter)
await EventType.trigger(eventType);

// Check counter
const count = EventType.getDescriptiveCount();

// Reset counter (after boss fight)
EventType.resetDescriptiveCount();
```

**Responsibilities**:

- Game Service: Call at appropriate times, check counter before accepting descriptive events
- Event Type: Track counter, trigger type-specific logic

---

### Game Service ↔ Utility Services

**Interface**: Direct TypeScript class static methods

**Contract**:

```typescript
// Roll dice
const rollValue = Dice_Roll.roll(); // 1-20
const tier = Dice_Roll.classifyRoll(rollValue); // "critical_success"

// Apply roll to stat
const finalValue = Stat_Calc.applyRoll(rollValue, "VIT", 10); // 20
```

**Responsibilities**:

- Game Service: Call when processing environmental events or combat
- Utilities: Pure calculation logic

---

## Summary

### Key Design Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Type Safety**: TypeScript interfaces enforce contracts between layers
3. **Orchestration Pattern**: Game Service coordinates, doesn't duplicate logic
4. **Two-Phase Events**: User approval before effects for better UX
5. **Multi-Call LLM**: Separate calls for type, description, effects (not monolithic)
6. **Database Abstraction**: Backend Service provides clean interface to database
7. **Stateless API**: Each request is self-contained with campaign ID

### Data Flow Summary

**Current (Mock Data)**:

```
User Action → Frontend (generateLLMResponse) → UI Update
```

**Future (With API Integration)**:

```
User Action → Frontend → API Endpoint → Game Service
                                            ↓
                             ┌──────────────┼──────────────┐
                             ↓              ↓              ↓
                        LLM Service   Backend Service  Event Type
                             ↓              ↓              ↓
                        Gemini API    MySQL DB      Dice/Stat Calc
                             ↓              ↓              ↓
                             └──────────────┴──────────────┘
                                            ↓
              Game Service Response → API Endpoint → Frontend → UI Update
```

### Phase Management

The system operates in three distinct phases:

1. **Exploration**: Player navigates dungeon, triggers events
2. **Event Choice**: Player accepts or rejects proposed event
3. **Combat**: Player fights enemy until victory or defeat

Each phase has its own action handlers and available choices, ensuring clean state management and preventing invalid actions
---

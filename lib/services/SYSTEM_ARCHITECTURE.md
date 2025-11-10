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
│  - User interaction handling                                 │
│  - State management (character, enemy, chat history)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API HELPER LAYER                         │
│  (app/campaigns/[id]/api-helper.ts)                         │
│  - Data transformation (Frontend ↔ Backend)                  │
│  - Choice mapping to ActionType                              │
│  - Response formatting for UI                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        API ENDPOINT                          │
│  (app/api/game/action/route.ts)                             │
│  - HTTP request handling (POST/GET)                          │
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
        └─→ Calls: callGameAPI(choice, campaignId, diceRoll)

2. API HELPER
   │
   ├─→ Maps choice to ActionType
   │   • "Continue" → "continue"
   │   • "Accept" → "accept_event"
   │   • "Reject" → "reject_event"
   │
   ├─→ Builds request payload
   │
   └─→ Fetches: POST /api/game/action
        │
        └─→ Body: { action, campaignId, diceRoll }

3. API ENDPOINT
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

5. RESPONSE FLOW
   │
   ├─→ GameService → API Endpoint → API Helper
   │
   ├─→ API Helper transforms response for frontend
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
- Call API Helper for game actions

**Key Functions**:
- `handleChatAction(choice)` - Process user button clicks
- `handleItemAction()` - Process item usage/equipping
- State updates for character, enemy, messages, choices

**Does NOT**:
- Directly call backend services
- Generate game events
- Make LLM calls
- Access database

---

### API Helper Layer (`app/campaigns/[id]/api-helper.ts`)

**Purpose**: Translation layer between frontend and backend

**Responsibilities**:
- Map frontend choices to backend ActionTypes
- Transform GameServiceResponse to frontend format
- Handle API request/response formatting
- Provide type-safe interface for frontend

**Key Functions**:
- `callGameAPI(choice, campaignId, diceRoll)` - Main API call
- `mapChoiceToActionType(choice)` - Choice mapping
- `transformResponse(backendResponse)` - Response transformation

**Data Transformations**:
```typescript
Frontend → Backend:
- "Continue" → ActionType: "continue"
- "Accept" → ActionType: "accept_event"

Backend → Frontend:
- GameServiceResponse → { message, choices, character, enemy, ... }
```

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
  action: ActionType,
  campaignId: number,
  diceRoll?: number,
  itemId?: number
}

Response:
GameServiceResponse {
  success: boolean,
  message: string,
  character: Character,
  enemy?: Enemy,
  currentPhase: GamePhase,
  choices: string[]
}
```

**GET /api/game/action?campaignId=X**
```typescript
Response:
GameValidation {
  isValid: boolean,
  error?: string,
  currentPhase: GamePhase
}
```

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
- `handleCombatAction()` - Resolves combat, calls LLM for flavor
- `handleEventChoice()` - Handles Accept/Reject for events

**Event Processing**:
- `generateEventType()` - LLM generates event type
- `processAcceptedEvent()` - Generates description and effects
- `applyStatChanges()` - Updates character stats

**Combat**:
- `resolveCombat()` - Dice roll, damage calculation, critical hits
- `handlePostCombatRewards()` - Post-victory rewards

**Orchestration Pattern**:
```typescript
GameService coordinates:
├─→ LLMService.generateEventType()
├─→ LLMService.generateDescription()
├─→ LLMService.requestStatBoost()
├─→ EventType.trigger()
├─→ Dice_Roll.roll()
├─→ Stat_Calc.applyRoll()
├─→ BackendService.saveEvent()
└─→ BackendService.updateCharacter()
```

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

**Additional Calls** (placeholders):
- `RequestItemDrop()` - Generate item data
- `bonusStatRequest()` - Generate bonus stat for critical success

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
- Pending event state management
- Current enemy state management

**Entity Operations**:

**Characters**:
- `getCharacter(id)` - Fetch character by ID
- `updateCharacter(id, updates)` - Update stats/equipment
- `getCharacterByCampaign(campaignId)` - Get campaign character

**Enemies**:
- `getEnemy(id)` - Fetch enemy by ID
- `getRandomEnemy(difficulty?)` - Get random enemy
- `getCurrentEnemy(campaignId)` - Get active combat enemy
- `setCurrentEnemy(campaignId, enemyId)` - Set/clear combat state

**Campaigns**:
- `getCampaign(id)` - Fetch campaign
- `updateCampaign(id, updates)` - Update campaign state

**Events/Logs**:
- `saveEvent(campaignId, message, eventType, eventData)` - Save event to logs
- `getRecentEvents(campaignId, limit)` - Fetch event history
- `getNextEventNumber(campaignId)` - Get sequential event number

**Items/Inventory**:
- `getItem(id)` - Fetch item data
- `getInventory(characterId)` - Get character's inventory
- `addItemToInventory(characterId, itemId)` - Add item
- `removeItemFromInventory(characterId, itemId)` - Remove item
- `equipItem(characterId, itemId, slot)` - Equip with stat replacement

**Pending Events**:
- `setPendingEvent(campaignId, eventType)` - Store pending event
- `getPendingEvent(campaignId)` - Retrieve pending event
- `clearPendingEvent(campaignId)` - Clear after Accept/Reject

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
- Post-combat rewards handled by GameService

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
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ API HELPER: callGameAPI("Continue", campaignId, 14)           │
│ - Maps to: { action: "continue", campaignId: 1, diceRoll: 14 }│
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ API: POST /api/game/action                                     │
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
│ API HELPER: callGameAPI("Accept", campaignId)                 │
│ - Maps to: { action: "accept_event", campaignId: 1 }          │
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
│ Choices: [Attack] [Flee]                                       │
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

### Frontend ↔ API Helper

**Interface**: TypeScript function calls

**Contract**:
```typescript
Frontend calls:
callGameAPI(choice: string, campaignId: string, diceRoll?: number)

API Helper returns:
{
  message: string,
  choices: string[],
  character: { health, attack, defense, ... },
  enemy?: { name, health, attack, defense },
  combat?: { characterDamage, enemyDamage, isCritical },
  statChanges?: { health, attack, defense },
  error?: string
}
```

**Responsibilities**:
- Frontend: Provides user choice and dice roll
- API Helper: Transforms to backend format, handles API call

---

### API Helper ↔ API Endpoint

**Interface**: HTTP (POST/GET)

**Contract**:
```typescript
POST /api/game/action
Request Body:
{
  action: ActionType,
  campaignId: number,
  diceRoll?: number,
  itemId?: number
}

Response:
GameServiceResponse (JSON)
```

**Responsibilities**:
- API Helper: HTTP client, request formatting
- API Endpoint: HTTP server, JSON parsing, error handling

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

```
User Action → Frontend → API Helper → API Endpoint → Game Service
                                                          ↓
                                           ┌──────────────┼──────────────┐
                                           ↓              ↓              ↓
                                      LLM Service   Backend Service  Event Type
                                           ↓              ↓              ↓
                                      Gemini API    MySQL DB      Dice/Stat Calc
                                           ↓              ↓              ↓
                                           └──────────────┴──────────────┘
                                                          ↓
Game Service Response → API Endpoint → API Helper → Frontend → UI Update
```

### Phase Management

The system operates in three distinct phases:

1. **Exploration**: Player navigates dungeon, triggers events
2. **Event Choice**: Player accepts or rejects proposed event
3. **Combat**: Player fights enemy until victory or defeat

Each phase has its own action handlers and available choices, ensuring clean state management and preventing invalid actions.

---

## For Developers

### Adding a New Event Type

1. Add type to `EventTypeString` in `lib/types/llm.types.ts`
2. Add handler in `Event_type.ts` → `trigger()` method
3. Update LLM prompts in `llm.service.ts` to recognize new type
4. Add processing logic in `game.service.ts` → `handleEventChoice()`

### Adding a New Action

1. Add to `ActionType` in `lib/types/game.types.ts`
2. Add to mapping in `api-helper.ts` → `mapChoiceToActionType()`
3. Add handler in appropriate Game Service phase handler
4. Update frontend to display new choice button

### Debugging Flow

1. **Frontend**: Check browser console for API call details
2. **API Layer**: Check Next.js server logs for request/response
3. **Game Service**: Check `[GameService]` console logs for orchestration
4. **LLM Service**: Check `[LLM_Service]` logs for API calls
5. **Backend Service**: Check `[Backend]` logs for database operations

### Testing a Feature

1. Start with frontend interaction (button click)
2. Trace through API Helper transformation
3. Verify API endpoint receives correct payload
4. Follow Game Service orchestration
5. Confirm backend operations (mock or real DB)
6. Verify response transformation back to frontend
7. Check UI updates correctly

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Backend Team


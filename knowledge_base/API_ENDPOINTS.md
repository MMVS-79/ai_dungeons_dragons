# API Endpoints Reference

This document lists all API endpoints in the AI Dungeons & Dragons system. All endpoints except `/api/game/action` are **TODO stubs** awaiting implementation.

## Status Legend

- **IMPLEMENTED** - Fully functional with database integration
- **TODO** - Created with stub/mock data, needs implementation

---

## Core Game Endpoint

### `/api/game/action`

**Status**: FULLY IMPLEMENTED - Main game loop endpoint

**Methods**:

- `POST` - Process player actions
  - Action types: `continue`, `search`, `attack`, `use_item`, `pickup_item`, `reject_item`, `equip_item`, `accept_event`, `reject_event`
  - Body: `{ campaignId: number, actionType: string, actionData?: object }`
  - Returns: `GameServiceResponse` with updated game state

**File**: `app/api/game/action/route.ts`

---

## Campaign Endpoints

### `/api/campaigns`

**Purpose**: List and create campaigns

**Methods**:

- `GET` - List all campaigns for user
  - Query params: `accountId`, `status?`
  - Returns: `{ campaigns: Campaign[] }`
  
- `POST` - Create new campaign with character
  - Body: `{ accountId, campaignName, campaignDescription?, character: { name, raceId, classId } }`
  - Returns: `{ campaign: Campaign, character: Character }`

**File**: `app/api/campaigns/route.ts`

---

### `/api/campaigns/[id]`

**Purpose**: Get, update, or delete specific campaign

**Methods**:

- `GET` - Get full campaign details
  - Returns: `{ campaign, character, recentEvents, inventory }`
  
- `DELETE` - Delete campaign and all associated data
  - Returns: `{ message: string }`

**File**: `app/api/campaigns/[id]/route.ts`

---

## Character Endpoints

### `/api/characters/[id]`

**Purpose**: Update character details

**Methods**:

- `PUT` - Update character stats (admin/debug)
  - Body: `{ currentHealth?, maxHealth?, attack?, defense? }`
  - Returns: `{ character: Character }`

**File**: `app/api/characters/[id]/route.ts`

---

### `/api/characters/[id]/inventory`

**Purpose**: Manage character inventory

**Methods**:

- `POST` - Add item to inventory (admin/debug)
  - Body: `{ itemId: number }`
  - Returns: `{ inventory: Item[] }`
  
- `DELETE` - Remove item from inventory
  - Query params: `itemId` (required)
  - Returns: `{ inventory: Item[] }`

**File**: `app/api/characters/[id]/inventory/route.ts`

---

## Enemy Catalog Endpoints

### `/api/enemies/[id]`

**Purpose**: Get specific enemy details

**Methods**:

- `GET` - Fetch enemy by ID
  - Returns: `{ enemy: Enemy }`

**File**: `app/api/enemies/[id]/route.ts`

---

## Implementation Priority

### Phase 1: Essential (for multi-user support)

1. `POST /api/campaigns` - Create campaigns
2. `GET /api/campaigns` - List campaigns
3. `GET /api/campaigns/[id]` - Load campaign
4. `DELETE /api/campaigns/[id]` - Delete campaigns

### Phase 2: Enhanced Features

5. `PUT /api/characters/[id]` - Character updates
7. `POST/DELETE /api/characters/[id]/inventory` - Inventory management

### Phase 3: Admin & Polish

8. `GET /api/enemies/[id]` - Enemy details

---

## Implementation Notes

### All TODO Endpoints Follow This Pattern

1. **Request validation** - Check required parameters
2. **TODO comment** - Calls to BackendService functions
3. **Mock data return** - Placeholder response
4. **Error handling** - Try/catch with proper status codes

### Required BackendService Functions (to be implemented)

**Campaign Functions:**

- `getCampaignsByAccount(accountId, filters?)` - List user campaigns
- `createCampaign(data)` - Create new campaign
- `updateCampaign(id, updates)` - Update campaign details
- `deleteCampaign(id)` - Delete campaign

**Character Functions:**

- `createCharacter(data)` - Create character with base stats
- `getCharacter(id)` - Get character details (STUB exists)
- `updateCharacter(id, updates)` - Update character stats (STUB exists)
- `getCharacterByCampaign(campaignId)` - Get campaign's character (STUB exists)

**Event Functions:**

- `saveEvent(campaignId, message, type, data?)` - Log game event (STUB exists)
- `getRecentEvents(campaignId, limit)` - Get recent events (STUB exists)

**Inventory & Items:**

- `getInventory(characterId)` - Get character inventory (STUB exists)
- `addItemToInventory(characterId, item)` - Add item (ROUTING LOGIC IMPLEMENTED)
- `removeItemFromInventory(characterId, itemId)` - Remove item (STUB exists)
- `clearInventory(characterId)` - Clear all items
- `getItem(id)` - Get item details (STUB exists)
- `equipItem(characterId, itemId, slot)` - Equip with stat calculation (STEPS ONLY)

**Enemy Functions:**

- `getEnemy(id)` - Get enemy details (STUB exists)

**State Management:**

- `setPendingEvent(campaignId, type)` - Store pending event (IN-MEMORY implemented)
- `getPendingEvent(campaignId)` - Get pending event (IN-MEMORY implemented)
- `clearPendingEvent(campaignId)` - Clear pending event (STUB exists)
- `setCurrentEnemy(campaignId, enemyId)` - Set active enemy (IN-MEMORY implemented)
- `getCurrentEnemy(campaignId)` - Get active enemy (IN-MEMORY implemented)

### Next Steps

1. **Phase 1**: Implement database queries for STUB functions in `backend.service.ts`
   - Priority: Campaign CRUD, Character CRUD, Event logging
   - Many functions already have step-by-step implementation instructions

2. **Phase 2**: Replace in-memory storage with database persistence
   - `setPendingEvent`, `getPendingEvent`, `clearPendingEvent`
   - `setCurrentEnemy`, `getCurrentEnemy`

3. **Phase 3**: Complete special implementations
   - `equipItem()` - Implement stat replacement logic (steps exist)
   - `addItemToInventory()` - Add SQL queries to existing routing logic

4. **Phase 4**: Replace mock data in API endpoints with BackendService calls

5. **Phase 5**: Add authentication
   - User authentication for all endpoints

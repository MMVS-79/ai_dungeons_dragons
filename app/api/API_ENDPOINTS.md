# API Endpoints Reference

This document lists all API endpoints in the AI Dungeons & Dragons system. All endpoints except `/api/game/action` are **TODO stubs** awaiting implementation.

## Status Legend

- ✅ **IMPLEMENTED** - Fully functional with database integration
- 📝 **TODO** - Created with stub/mock data, needs implementation
- ⚠️ **LEGACY** - Marked for removal

---

## Core Game Endpoint

### `/api/game/action` ✅

**Status**: FULLY IMPLEMENTED - Main game loop endpoint

**Methods**:

- `POST` - Process player actions
  - Action types: `continue`, `search`, `attack`, `use_item`, `pickup_item`, `reject_item`, `equip_item`, `accept_event`, `reject_event`
  - Body: `{ campaignId: number, actionType: string, actionData?: object }`
  - Returns: `GameServiceResponse` with updated game state

**File**: `app/api/game/action/route.ts`

---

## Campaign Endpoints 📝

### `/api/campaigns`

**Purpose**: List and create campaigns

**Methods**:

- `GET` - List all campaigns for user
  - Query params: `accountId`, `status?`, `limit?`, `offset?`
  - Returns: `{ campaigns: Campaign[], total: number }`
  
- `POST` - Create new campaign with character
  - Body: `{ accountId, campaignName, campaignDescription?, character: { name, raceId, classId } }`
  - Returns: `{ campaign: Campaign, character: Character }`

**File**: `app/api/campaigns/route.ts`

---

### `/api/campaigns/[id]`

**Purpose**: Get, update, or delete specific campaign

**Methods**:

- `GET` - Get full campaign details
  - Returns: `{ campaign, character, recentEvents, currentEnemy?, inventory }`
  
- `PUT` - Update campaign details
  - Body: `{ name?, description?, state? }`
  - Returns: `{ campaign: Campaign }`
  
- `DELETE` - Delete campaign and all associated data
  - Returns: `{ message: string }`

**File**: `app/api/campaigns/[id]/route.ts`

---

### `/api/campaigns/[id]/logs`

**Purpose**: Get paginated event history

**Methods**:

- `GET` - Fetch event logs with pagination
  - Query params: `limit?`, `offset?`, `eventType?`, `startEventNumber?`, `endEventNumber?`
  - Returns: `{ events: GameEvent[], total: number, hasMore: boolean }`

**File**: `app/api/campaigns/[id]/logs/route.ts`

---

### `/api/campaigns/[id]/logs/export`

**Purpose**: Export campaign story

**Methods**:

- `GET` - Export as JSON, text, or markdown
  - Query params: `format?` ("json" | "text" | "markdown")
  - Returns: Formatted campaign story

**File**: `app/api/campaigns/[id]/logs/export/route.ts`

---

## Character Endpoints 📝

### `/api/characters/[id]`

**Purpose**: Get or update character details

**Methods**:

- `GET` - Get character with equipment and inventory
  - Returns: `{ character, equippedItems: { weapon?, armor?, shield? }, inventory }`
  
- `PUT` - Update character stats (admin/debug)
  - Body: `{ currentHealth?, maxHealth?, attack?, defense? }`
  - Returns: `{ character: Character }`

**File**: `app/api/characters/[id]/route.ts`

---

### `/api/characters/[id]/inventory`

**Purpose**: Manage character inventory

**Methods**:

- `GET` - Get inventory items
  - Query params: `type?` (filter by item type)
  - Returns: `{ inventory: Item[] }`
  
- `POST` - Add item to inventory (admin/debug)
  - Body: `{ itemId: number }`
  - Returns: `{ item: Item }`
  
- `DELETE` - Remove item from inventory
  - Query params: `itemId` (required)
  - Returns: `{ message: string }`

**File**: `app/api/characters/[id]/inventory/route.ts`

---

## Item Catalog Endpoints 📝

### `/api/items`

**Purpose**: Browse item catalog

**Methods**:

- `GET` - List all items
  - Query params: `type?`, `limit?`, `offset?`
  - Returns: `{ items: Item[], total: number }`

**File**: `app/api/items/route.ts`

---

### `/api/items/[id]`

**Purpose**: Get specific item details

**Methods**:

- `GET` - Fetch item by ID
  - Returns: `{ item: Item }`

**File**: `app/api/items/[id]/route.ts`

---

## Enemy Catalog Endpoints 📝

### `/api/enemies`

**Purpose**: Browse enemy catalog

**Methods**:

- `GET` - List all enemies
  - Query params: `difficulty?`, `limit?`, `offset?`
  - Returns: `{ enemies: Enemy[], total: number }`

**File**: `app/api/enemies/route.ts`

---

### `/api/enemies/[id]`

**Purpose**: Get specific enemy details

**Methods**:

- `GET` - Fetch enemy by ID
  - Returns: `{ enemy: Enemy }`

**File**: `app/api/enemies/[id]/route.ts`

---

## Admin Endpoints 📝

### `/api/admin/campaigns/[id]/reset`

**Purpose**: Reset campaign to initial state (testing/debug)

**Methods**:

- `POST` - Reset campaign and character
  - Returns: `{ message: string }`

**Note**: Requires admin authentication in production

**File**: `app/api/admin/campaigns/[id]/reset/route.ts`

---

### `/api/admin/stats`

**Purpose**: Get system-wide statistics

**Methods**:

- `GET` - Fetch dashboard statistics
  - Returns: `{ stats: { totalUsers, totalCampaigns, activeCampaigns, ... } }`

**Note**: Requires admin authentication in production

**File**: `app/api/admin/stats/route.ts`

---

## Legacy Endpoints ⚠️

### `/api/dragon` ⚠️ MARKED FOR REMOVAL

**Purpose**: Legacy dragon demo endpoint

**Methods**:

- `GET` - Get dragon stats
- `POST` - Attack dragon

**Status**: Only used by demo page, not part of main architecture

**Action Required**: Remove after confirming main game system works

**File**: `app/api/dragon/route.ts`

---

## Implementation Priority

### Phase 1: Essential (for multi-user support)

1. `POST /api/campaigns` - Create campaigns
2. `GET /api/campaigns` - List campaigns
3. `GET /api/campaigns/[id]` - Load campaign
4. `DELETE /api/campaigns/[id]` - Delete campaigns

### Phase 2: Enhanced Features

5. `PUT /api/campaigns/[id]` - Update campaigns
6. `GET /api/campaigns/[id]/logs` - Event history
7. `GET /api/characters/[id]` - Character sheet
8. `GET /api/characters/[id]/inventory` - Inventory view

### Phase 3: Admin & Polish

9. `GET /api/items` - Item browsing
10. `GET /api/enemies` - Enemy browsing
11. `POST /api/admin/campaigns/[id]/reset` - Campaign reset
12. `GET /api/admin/stats` - Admin dashboard
13. `GET /api/campaigns/[id]/logs/export` - Story export

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
- `getEventLogs(campaignId, options)` - Paginated event history
- `getEventLogsCount(campaignId, filters?)` - Count for pagination
- `getAllEvents(campaignId)` - Get all events (for export)
- `deleteAllEvents(campaignId)` - Delete all events (for reset)

**Inventory & Items:**

- `getInventory(characterId)` - Get character inventory (STUB exists)
- `addItemToInventory(characterId, item)` - Add item (ROUTING LOGIC IMPLEMENTED)
- `removeItemFromInventory(characterId, itemId)` - Remove item (STUB exists)
- `clearInventory(characterId)` - Clear all items
- `getItem(id)` - Get item details (STUB exists)
- `equipItem(characterId, itemId, slot)` - Equip with stat calculation (STEPS ONLY)
- `getAllItems(filters?)` - List all items
- `getItemsCount(filters?)` - Count for pagination
- `createItem(data)` - Create LLM-generated item

**Enemy Functions:**

- `getEnemy(id)` - Get enemy details (STUB exists)
- `getRandomEnemy(difficulty?)` - Get random enemy (STUB exists)
- `getAllEnemies(filters?)` - List all enemies
- `getEnemiesCount(filters?)` - Count for pagination

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
   - `createItem()` - For LLM-generated items

4. **Phase 4**: Replace mock data in API endpoints with BackendService calls

5. **Phase 5**: Add authentication
   - User authentication for all endpoints
   - Admin authentication for admin endpoints

6. **Phase 6**: Remove `/api/dragon` legacy endpoint after verification

---

## Summary

**Total Endpoints Created**: 16

- ✅ **Implemented**: 1 (`/api/game/action`)
- 📝 **TODO Stubs**: 14 (all campaign, character, item, enemy, admin endpoints)
- ⚠️ **Legacy**: 1 (`/api/dragon`)

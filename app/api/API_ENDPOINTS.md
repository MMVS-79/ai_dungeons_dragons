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
- `POST` - Process player actions (continue, search, attack, accept/reject events, equip items)
- `GET` - Validate game state

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

### All TODO Endpoints Follow This Pattern:
1. **Request validation** - Check required parameters
2. **TODO comment** - Calls to BackendService functions
3. **Mock data return** - Placeholder response
4. **Error handling** - Try/catch with proper status codes

### Required BackendService Functions (to be implemented):
- `getCampaignsByAccount(accountId)`
- `createCampaign(data)`
- `createCharacter(data)`
- `getAllItems(filters)`
- `getAllEnemies(filters)`
- `getEventLogs(campaignId, options)`
- `deleteAllEvents(campaignId)`
- `clearInventory(characterId)`
- And more (see individual endpoint files)

### Next Steps:
1. Implement BackendService database functions (reference `backend.service.ts`)
2. Replace mock data returns with actual BackendService calls
3. Add authentication middleware for admin endpoints
4. Add user authentication for all endpoints
5. Remove `/api/dragon` legacy endpoint

---

## Summary

**Total Endpoints Created**: 16

- ✅ **Implemented**: 1 (`/api/game/action`)
- 📝 **TODO Stubs**: 14 (all others)
- ⚠️ **Legacy**: 1 (`/api/dragon`)

All TODO endpoints are fully typed, documented, and ready for implementation by assigning issues to team members.

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Backend Team


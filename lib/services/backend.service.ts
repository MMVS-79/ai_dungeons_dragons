/**
 * Backend Service (Database Layer)
 * ------------------------------------------------------------
 * This service provides the complete interface for all database operations.
 *
 * STATUS: ✅ Interface complete - Replace PLACEHOLDER logs with actual queries
 * DATABASE: MySQL via pool from lib/db.ts
 * SCHEMA: See lib/schema/tables/ for all table structures
 *
 * Implementation Guide:
 * 1. Import pool from '@/lib/db'
 * 2. Replace console.log with pool.query()
 * 3. Map snake_case DB columns to camelCase TypeScript fields
 * 4. Handle errors and return proper types
 *
 * Key Column Mappings (DB → TypeScript):
 * - current_health → currentHealth
 * - max_health → maxHealth
 * - event_number → eventNumber
 * - sprite_path → spritePath
 * - race_id/class_id/campaign_id → raceId/classId/campaignId
 * - weapon_id/armour_id/shield_id → weaponId/armorId/shieldId
 *
 */

import type {
  Character,
  Enemy,
  Campaign,
  GameEvent,
  Item,
  EventTypeString
} from "@/lib/types/game.types";

// Temporary in-memory storage for pending events and current enemies
// TODO: Replace with database storage
declare global {
  var pendingEvents: Map<number, string> | undefined;
  var currentEnemies: Map<number, number> | undefined;
}

// ============================================================================
// CHARACTER OPERATIONS
// ============================================================================

/**
 * Fetch character by ID from database
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT * FROM characters WHERE id = ?
 * 2. Map DB fields to TypeScript:
 *    - current_health → currentHealth
 *    - max_health → maxHealth
 *    - sprite_path → spritePath
 *    - race_id → raceId
 *    - class_id → classId
 *    - campaign_id → campaignId
 *    - weapon_id → weaponId
 *    - armour_id → armorId
 *    - shield_id → shieldId
 * 3. Return Character object
 *
 * @param characterId - Character ID
 * @returns Character data from database
 */
export async function getCharacter(characterId: number): Promise<Character> {
  // Step 1: Query database for character
  // const [rows] = await pool.query('SELECT * FROM characters WHERE id = ?', [characterId]);
  // const row = rows[0];

  // Step 2: Map database fields to Character type
  // return {
  //   id: row.id,
  //   name: row.name,
  //   currentHealth: row.current_health,
  //   maxHealth: row.max_health,
  //   attack: row.attack,
  //   defense: row.defense,
  //   spritePath: row.sprite_path,
  //   raceId: row.race_id,
  //   classId: row.class_id,
  //   campaignId: row.campaign_id,
  //   weaponId: row.weapon_id,
  //   armorId: row.armour_id,
  //   shieldId: row.shield_id
  // };

  console.log(`[PLACEHOLDER] getCharacter(${characterId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: characterId,
    name: "Placeholder Hero",
    currentHealth: 50,
    maxHealth: 50,
    attack: 10,
    defense: 5,
    spritePath: "/characters/player/warrior.png",
    raceId: 1,
    classId: 1,
    campaignId: 1
  };
}

/**
 * Update character stats in database
 *
 * TODO: Implement database update
 *
 * Implementation:
 * 1. Map TypeScript fields to DB columns:
 *    - currentHealth → current_health
 *    - maxHealth → max_health
 *    - weaponId → weapon_id
 *    - armorId → armour_id (note: armour not armor in DB)
 *    - shieldId → shield_id
 * 2. Build dynamic UPDATE query for provided fields only
 * 3. Query: UPDATE characters SET field1 = ?, field2 = ? WHERE id = ?
 * 4. Return updated character via getCharacter()
 *
 * Example:
 * updates = { currentHealth: 50, attack: 15 }
 * → UPDATE characters SET current_health = 50, attack = 15 WHERE id = ?
 *
 * @param characterId - Character ID
 * @param updates - Partial character updates (camelCase fields)
 * @returns Updated character from database
 */
export async function updateCharacter(
  characterId: number,
  updates: Partial<Character>
): Promise<Character> {
  // Step 1: Build dynamic update fields
  // const fields = [];
  // const values = [];
  // if (updates.currentHealth !== undefined) {
  //   fields.push('current_health = ?');
  //   values.push(updates.currentHealth);
  // }
  // if (updates.maxHealth !== undefined) {
  //   fields.push('max_health = ?');
  //   values.push(updates.maxHealth);
  // }
  // // ... map other fields (attack, defense, weaponId → weapon_id, etc.)
  // values.push(characterId);

  // Step 2: Execute update query
  // await pool.query(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`, values);

  // Step 3: Return updated character
  // return await getCharacter(characterId);

  console.log(`[PLACEHOLDER] updateCharacter(${characterId})`, updates);

  const character = await getCharacter(characterId);
  return { ...character, ...updates };
}

// ============================================================================
// ENEMY OPERATIONS
// ============================================================================

/**
 * Fetch enemy by ID from database
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT * FROM enemies WHERE id = ?
 * 2. Map DB fields to TypeScript:
 *    - sprite_path → spritePath
 * 3. Return Enemy object
 *
 * @param enemyId - Enemy ID
 * @returns Enemy data
 */
export async function getEnemy(enemyId: number): Promise<Enemy> {
  // Step 1: Query database for enemy
  // const [rows] = await pool.query('SELECT * FROM enemies WHERE id = ?', [enemyId]);
  // const row = rows[0];

  // Step 2: Map database fields to Enemy type
  // return {
  //   id: row.id,
  //   name: row.name,
  //   health: row.health,
  //   attack: row.attack,
  //   defense: row.defense,
  //   spritePath: row.sprite_path
  // };

  console.log(`[PLACEHOLDER] getEnemy(${enemyId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: enemyId,
    name: "Placeholder Dragon",
    health: 100,
    attack: 15,
    defense: 8,
    spritePath: "/characters/enemy/boss/dragon.png"
  };
}

/**
 * Get random enemy based on difficulty or context
 *
 * TODO: Implement random enemy selection from database
 *
 * Implementation:
 * 1. Query: SELECT * FROM enemies WHERE difficulty = ? ORDER BY RAND() LIMIT 1
 * 2. If no difficulty specified, select from all enemies: ORDER BY RAND() LIMIT 1
 * 3. Map DB fields to TypeScript (sprite_path → spritePath)
 * 4. Return random Enemy object
 *
 * @param difficulty - Optional difficulty level ("easy", "medium", "hard")
 * @returns Random enemy matching criteria
 */
export async function getRandomEnemy(difficulty?: string): Promise<Enemy> {
  // Step 1: Build query based on difficulty parameter
  // let query = 'SELECT * FROM enemies';
  // const params = [];
  // if (difficulty) {
  //   query += ' WHERE difficulty = ?';
  //   params.push(difficulty);
  // }
  // query += ' ORDER BY RAND() LIMIT 1';

  // Step 2: Execute query and get random enemy
  // const [rows] = await pool.query(query, params);
  // const row = rows[0];

  // Step 3: Map to Enemy type and return
  // return {
  //   id: row.id,
  //   name: row.name,
  //   health: row.health,
  //   attack: row.attack,
  //   defense: row.defense,
  //   spritePath: row.sprite_path
  // };

  console.log(`[PLACEHOLDER] getRandomEnemy(${difficulty})`);

  return getEnemy(1);
}

// ============================================================================
// CAMPAIGN OPERATIONS
// ============================================================================

/**
 * Fetch campaign by ID from database
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT * FROM campaigns WHERE id = ?
 * 2. Map DB fields to TypeScript:
 *    - account_id → accountId
 *    - created_at → createdAt
 *    - updated_at → updatedAt
 * 3. Convert date strings to Date objects
 * 4. Return Campaign object
 *
 * @param campaignId - Campaign ID
 * @returns Campaign data
 */
export async function getCampaign(campaignId: number): Promise<Campaign> {
  // Step 1: Query database for campaign
  // const [rows] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
  // const row = rows[0];

  // Step 2: Map database fields to Campaign type
  // return {
  //   id: row.id,
  //   accountId: row.account_id,
  //   name: row.name,
  //   description: row.description,
  //   state: row.state,
  //   createdAt: new Date(row.created_at),
  //   updatedAt: new Date(row.updated_at)
  // };

  console.log(`[PLACEHOLDER] getCampaign(${campaignId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: campaignId,
    accountId: 1,
    name: "Placeholder Campaign",
    description: "A placeholder campaign",
    state: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Update campaign state in database
 *
 * TODO: Implement database update
 *
 * Implementation:
 * 1. Map TypeScript fields to DB columns:
 *    - accountId → account_id
 *    - updatedAt → updated_at
 * 2. Build dynamic UPDATE query for provided fields only
 * 3. Query: UPDATE campaigns SET field1 = ?, updated_at = NOW() WHERE id = ?
 * 4. Return updated campaign via getCampaign()
 *
 * @param campaignId - Campaign ID
 * @param updates - Partial campaign updates (camelCase fields)
 * @returns Updated campaign from database
 */
export async function updateCampaign(
  campaignId: number,
  updates: Partial<Campaign>
): Promise<Campaign> {
  // Step 1: Build dynamic update fields
  // const fields = [];
  // const values = [];
  // if (updates.state !== undefined) {
  //   fields.push('state = ?');
  //   values.push(updates.state);
  // }
  // if (updates.name !== undefined) {
  //   fields.push('name = ?');
  //   values.push(updates.name);
  // }
  // // Add updated_at timestamp
  // fields.push('updated_at = NOW()');
  // values.push(campaignId);

  // Step 2: Execute update query
  // await pool.query(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`, values);

  // Step 3: Return updated campaign
  // return await getCampaign(campaignId);

  console.log(`[PLACEHOLDER] updateCampaign(${campaignId})`, updates);

  const campaign = await getCampaign(campaignId);
  return { ...campaign, ...updates };
}

/**
 * Get character associated with a campaign
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT * FROM characters WHERE campaign_id = ? LIMIT 1
 * 2. Map DB fields to TypeScript (same as getCharacter)
 * 3. Return Character object
 *
 * Note: Assumes one character per campaign. If multiple characters possible,
 * this should return the primary/active character.
 *
 * @param campaignId - Campaign ID
 * @returns Character data for this campaign
 */
export async function getCharacterByCampaign(
  campaignId: number
): Promise<Character> {
  // Step 1: Query for character by campaign_id
  // const [rows] = await pool.query('SELECT * FROM characters WHERE campaign_id = ? LIMIT 1', [campaignId]);
  // const row = rows[0];

  // Step 2: Map database fields (same as getCharacter mapping)
  // return {
  //   id: row.id,
  //   name: row.name,
  //   currentHealth: row.current_health,
  //   maxHealth: row.max_health,
  //   attack: row.attack,
  //   defense: row.defense,
  //   spritePath: row.sprite_path,
  //   raceId: row.race_id,
  //   classId: row.class_id,
  //   campaignId: row.campaign_id,
  //   weaponId: row.weapon_id,
  //   armorId: row.armour_id,
  //   shieldId: row.shield_id
  // };

  console.log(`[PLACEHOLDER] getCharacterByCampaign(${campaignId})`);

  return getCharacter(1);
}

// ============================================================================
// EVENT OPERATIONS
// ============================================================================

/**
 * Get next sequential event number for a campaign
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT MAX(event_number) as maxNum FROM logs WHERE campaign_id = ?
 * 2. Get maxNum from result (will be NULL if no events exist)
 * 3. Return (maxNum || 0) + 1
 * 4. Ensures UNIQUE constraint on (campaign_id, event_number)
 *
 * Example:
 * - First event: maxNum is NULL → return 1
 * - After 5 events: maxNum is 5 → return 6
 *
 * @param campaignId - Campaign ID
 * @returns Next event number (starts at 1)
 */
async function getNextEventNumber(campaignId: number): Promise<number> {
  // Step 1: Query for max event_number in this campaign
  // const [rows] = await pool.query(
  //   'SELECT MAX(event_number) as maxNum FROM logs WHERE campaign_id = ?',
  //   [campaignId]
  // );

  // Step 2: Get max number (will be NULL if no events exist)
  // const lastNum = rows[0]?.maxNum || 0;

  // Step 3: Return next sequential number
  // return lastNum + 1;

  console.log(`[PLACEHOLDER] getNextEventNumber(${campaignId})`);
  return 1; // Placeholder: always return 1 for now
}

/**
 * Save game event to database (logs table)
 *
 * TODO: Implement database insert
 *
 * Implementation:
 * 1. Get next event_number via getNextEventNumber()
 * 2. Stringify eventData as JSON
 * 3. INSERT INTO logs (campaign_id, message, event_number, event_type, event_data)
 * 4. VALUES (?, ?, ?, ?, ?)
 * 5. Get insertId from result
 * 6. Return GameEvent object with id and createdAt
 *
 * Schema:
 * - event_number: INT NOT NULL
 * - event_type: VARCHAR(50) - "Descriptive"|"Environmental"|"Combat"|"Item_Drop"
 * - event_data: JSON - can store { statChanges, diceRoll, combatResult, etc }
 * - UNIQUE constraint on (campaign_id, event_number)
 *
 * @param campaignId - Campaign ID
 * @param message - Event narrative text
 * @param eventType - Event type (EventTypeString)
 * @param eventData - Optional JSON data (combat results, stat changes, etc)
 * @returns Saved event with id and timestamp
 */
export async function saveEvent(
  campaignId: number,
  message: string,
  eventType: EventTypeString,
  eventData?: Record<string, unknown>
): Promise<GameEvent> {
  // Step 1: Get next sequential event number
  const eventNumber = await getNextEventNumber(campaignId);

  // Step 2: Insert event into logs table
  // const [result] = await pool.query(
  //   'INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (?, ?, ?, ?, ?)',
  //   [campaignId, message, eventNumber, eventType, JSON.stringify(eventData || {})]
  // );

  // Step 3: Return saved event with generated ID and timestamp
  // return {
  //   id: result.insertId,
  //   campaignId,
  //   message,
  //   eventNumber,
  //   eventType,
  //   eventData,
  //   createdAt: new Date()
  // };

  console.log(`[PLACEHOLDER] saveEvent(${campaignId})`, {
    message,
    eventNumber,
    eventType,
    eventData
  });

  // MOCK DATA - Replace with actual database insert
  return {
    id: Math.floor(Math.random() * 1000),
    campaignId,
    message,
    eventNumber,
    eventType,
    eventData,
    createdAt: new Date()
  };
}

/**
 * Fetch recent events for a campaign
 *
 * TODO: Implement database query with ordering and limit
 *
 * Implementation:
 * 1. Query: SELECT * FROM logs WHERE campaign_id = ? ORDER BY event_number DESC LIMIT ?
 * 2. Map DB fields to TypeScript:
 *    - event_number → eventNumber
 *    - event_type → eventType
 *    - event_data → eventData (parse JSON string to object)
 *    - created_at → createdAt
 * 3. Return array of GameEvent objects (most recent first)
 *
 * @param campaignId - Campaign ID
 * @param limit - Number of events to fetch (default 10)
 * @returns Array of recent events, ordered by event_number descending
 */
export async function getRecentEvents(
  campaignId: number,
  limit: number = 10
): Promise<GameEvent[]> {
  // Step 1: Query recent events with limit
  // const [rows] = await pool.query(
  //   'SELECT * FROM logs WHERE campaign_id = ? ORDER BY event_number DESC LIMIT ?',
  //   [campaignId, limit]
  // );

  // Step 2: Map each row to GameEvent type
  // return rows.map(row => ({
  //   id: row.id,
  //   campaignId: row.campaign_id,
  //   message: row.message,
  //   eventNumber: row.event_number,
  //   eventType: row.event_type,
  //   eventData: JSON.parse(row.event_data || '{}'),
  //   createdAt: new Date(row.created_at)
  // }));

  console.log(`[PLACEHOLDER] getRecentEvents(${campaignId}, ${limit})`);

  return [];
}

// ============================================================================
// ITEM & INVENTORY OPERATIONS
// ============================================================================

/**
 * Get character's inventory
 *
 * TODO: Implement database query with JOIN
 *
 * Implementation:
 * 1. Query: SELECT items.* FROM items
 *           JOIN inventory ON items.id = inventory.item_id
 *           WHERE inventory.character_id = ?
 * 2. Map DB fields to TypeScript:
 *    - heal_amount → healAmount
 *    - hp_bonus → hpBonus
 * 3. Return array of Item objects
 *
 * Note: Inventory table should track which items belong to which character
 *
 * @param characterId - Character ID
 * @returns Array of items in character's inventory
 */
export async function getInventory(characterId: number): Promise<Item[]> {
  // Step 1: Query inventory with JOIN to get item details
  // const [rows] = await pool.query(
  //   `SELECT items.* FROM items
  //    JOIN inventory ON items.id = inventory.item_id
  //    WHERE inventory.character_id = ?`,
  //   [characterId]
  // );

  // Step 2: Map each row to Item type
  // return rows.map(row => ({
  //   id: row.id,
  //   name: row.name,
  //   type: row.type,
  //   attack: row.attack,
  //   defense: row.defense,
  //   hpBonus: row.hp_bonus,
  //   healAmount: row.heal_amount,
  //   description: row.description
  // }));

  console.log(`[PLACEHOLDER] getInventory(${characterId})`);

  return [];
}

/**
 * Add item to character's inventory
 *
 * TODO: Implement database insert
 *
 * Implementation:
 * 1. Query: INSERT INTO inventory (character_id, item_id) VALUES (?, ?)
 * 2. Handle duplicate key error if item already in inventory (optional)
 * 3. For stackable items, may need to increment quantity instead
 *
 * @param characterId - Character ID
 * @param itemId - Item ID to add
 */
export async function addItemToInventory(
  characterId: number,
  itemId: number
): Promise<void> {
  // Step 1: Insert item into inventory
  // await pool.query(
  //   'INSERT INTO inventory (character_id, item_id) VALUES (?, ?)',
  //   [characterId, itemId]
  // );

  // Step 2 (Optional): Handle stackable items
  // If items can stack, check if item already exists and increment quantity:
  // const [existing] = await pool.query(
  //   'SELECT * FROM inventory WHERE character_id = ? AND item_id = ?',
  //   [characterId, itemId]
  // );
  // if (existing.length > 0) {
  //   await pool.query(
  //     'UPDATE inventory SET quantity = quantity + 1 WHERE character_id = ? AND item_id = ?',
  //     [characterId, itemId]
  //   );
  // } else {
  //   // Insert new row with quantity = 1
  // }

  console.log(`[PLACEHOLDER] addItemToInventory(${characterId}, ${itemId})`);
}

/**
 * Remove item from character's inventory
 *
 * TODO: Implement database delete
 *
 * Implementation:
 * 1. Query: DELETE FROM inventory WHERE character_id = ? AND item_id = ?
 * 2. For stackable items, may need to decrement quantity instead
 * 3. Only delete row if quantity reaches 0
 *
 * @param characterId - Character ID
 * @param itemId - Item ID to remove
 */
export async function removeItemFromInventory(
  characterId: number,
  itemId: number
): Promise<void> {
  // Step 1: Delete item from inventory
  // await pool.query(
  //   'DELETE FROM inventory WHERE character_id = ? AND item_id = ?',
  //   [characterId, itemId]
  // );

  // Step 2 (Optional): Handle stackable items
  // If items can stack, decrement quantity instead of deleting:
  // await pool.query(
  //   'UPDATE inventory SET quantity = quantity - 1 WHERE character_id = ? AND item_id = ?',
  //   [characterId, itemId]
  // );
  // // Then delete if quantity is now 0:
  // await pool.query(
  //   'DELETE FROM inventory WHERE character_id = ? AND item_id = ? AND quantity <= 0',
  //   [characterId, itemId]
  // );

  console.log(
    `[PLACEHOLDER] removeItemFromInventory(${characterId}, ${itemId})`
  );
}

/**
 * Get item by ID
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT * FROM items WHERE id = ?
 * 2. Map DB fields to TypeScript:
 *    - heal_amount → healAmount
 *    - hp_bonus → hpBonus
 * 3. Return Item object
 *
 * @param itemId - Item ID
 * @returns Item data with all stats
 */
export async function getItem(itemId: number): Promise<Item> {
  // Step 1: Query database for item
  // const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
  // const row = rows[0];

  // Step 2: Map database fields to Item type
  // return {
  //   id: row.id,
  //   name: row.name,
  //   type: row.type,
  //   attack: row.attack,
  //   defense: row.defense,
  //   hpBonus: row.hp_bonus,
  //   healAmount: row.heal_amount,
  //   description: row.description
  // };

  console.log(`[PLACEHOLDER] getItem(${itemId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: itemId,
    name: "Placeholder Item",
    type: "potion",
    healAmount: 20,
    description: "A placeholder item"
  };
}

/**
 * Equip item to character slot (handles stat replacement)
 *
 * TODO: Implement complete equipment replacement logic
 *
 * Implementation Steps:
 * 1. Get character from database
 * 2. Get new item from weapons/armours/shields table (based on slot)
 * 3. If character has old item in slot, get it and subtract its stats
 * 4. Add new item stats to character
 * 5. Handle maxHealth changes proportionally (preserve health ratio)
 * 6. Update character stats AND slot field (weapon_id/armour_id/shield_id)
 *
 * Example Flow:
 * - Character: attack=20, weaponId=1 (Bronze Sword +5)
 * - Equip itemId=2 (Steel Sword +7)
 * - Remove old: attack = 20 - 5 = 15
 * - Add new: attack = 15 + 7 = 22
 * - Update: SET attack=22, weapon_id=2
 *
 * Health Proportions:
 * - If armor changes maxHealth, preserve current health ratio
 * - Example: 50/100 HP, +20 maxHP armor → 60/120 HP (same 50% ratio)
 *
 * @param characterId - Character ID
 * @param itemId - Item ID to equip
 * @param slot - Equipment slot ("weapon"|"armor"|"shield")
 */
export async function equipItem(
  characterId: number,
  itemId: number,
  slot: "weapon" | "armor" | "shield"
): Promise<void> {
  // Step 1: Get current character data from database
  // const character = await getCharacter(characterId);

  // Step 2: Get new item data from items table
  // const newItem = await getItem(itemId);

  // Step 3: Determine which slot field to update (weaponId/armorId/shieldId)
  // const slotIdField = `${slot}Id` as keyof Character;
  // const oldItemId = character[slotIdField];

  // Step 4: If character has old item in slot, get it and subtract its stats
  // if (oldItemId) {
  //   const oldItem = await getItem(oldItemId);
  //   - Subtract old item's attack, defense, hpBonus from character
  //   - If maxHealth changes, preserve health ratio: currentHealth = Math.floor(newMaxHealth * (oldHealth/oldMaxHealth))
  // }

  // Step 5: Add new item stats to character
  // - Add new item's attack, defense, hpBonus to character
  // - If maxHealth changes, preserve health ratio

  // Step 6: Update the slot field with new item ID
  // - If slot === "weapon": statUpdates.weaponId = itemId
  // - If slot === "armor": statUpdates.armorId = itemId
  // - If slot === "shield": statUpdates.shieldId = itemId

  // Step 7: Save all stat changes to database via updateCharacter()
  // await updateCharacter(characterId, statUpdates);

  console.log(`[PLACEHOLDER] equipItem(${characterId}, ${itemId}, ${slot})`);

  // MOCK DATA - Function does nothing until database is implemented
}

// ============================================================================
// CURRENT ENEMY TRACKING (for active campaigns)
// ============================================================================

/**
 * Get current enemy for a campaign (if in combat)
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT enemy_id FROM campaigns WHERE id = ?
 * 2. If enemy_id is NULL, return null (not in combat)
 * 3. If enemy_id exists, fetch enemy details via getEnemy()
 * 4. Return Enemy object or null
 *
 * Note: enemy_id field in campaigns table tracks active combat
 *
 * @param campaignId - Campaign ID
 * @returns Current enemy or null if not in combat
 */
export async function getCurrentEnemy(
  campaignId: number
): Promise<Enemy | null> {
  // Step 1: Query campaigns table for enemy_id
  // const [rows] = await pool.query('SELECT enemy_id FROM campaigns WHERE id = ?', [campaignId]);
  // const enemyId = rows[0]?.enemy_id;

  // Step 2: If no enemy_id, return null (not in combat)
  // if (!enemyId) {
  //   return null;
  // }

  // Step 3: Fetch enemy details
  // return await getEnemy(enemyId);

  console.log(`[PLACEHOLDER] getCurrentEnemy(${campaignId})`);

  // Temporary in-memory storage (replace with DB)
  if (!global.currentEnemies) {
    global.currentEnemies = new Map<number, number>();
  }

  const enemyId = global.currentEnemies.get(campaignId);
  if (!enemyId) {
    return null;
  }

  return await getEnemy(enemyId);
}

/**
 * Set current enemy for a campaign
 *
 * TODO: Implement database update
 *
 * Implementation:
 * 1. Query: UPDATE campaigns SET enemy_id = ? WHERE id = ?
 * 2. Pass NULL to clear enemy (exit combat)
 * 3. Pass enemyId to set active enemy (enter combat)
 *
 * Use Cases:
 * - Combat event accepted: setCurrentEnemy(campaignId, newEnemyId)
 * - Enemy defeated: setCurrentEnemy(campaignId, null)
 * - Player flees: setCurrentEnemy(campaignId, null)
 *
 * @param campaignId - Campaign ID
 * @param enemyId - Enemy ID to set, or null to clear (exit combat)
 */
export async function setCurrentEnemy(
  campaignId: number,
  enemyId: number | null
): Promise<void> {
  // Step 1: Update campaigns table with enemy_id
  // await pool.query(
  //   'UPDATE campaigns SET enemy_id = ? WHERE id = ?',
  //   [enemyId, campaignId]
  // );

  console.log(`[PLACEHOLDER] setCurrentEnemy(${campaignId}, ${enemyId})`);

  // Temporary in-memory storage (replace with DB)
  if (!global.currentEnemies) {
    global.currentEnemies = new Map<number, number>();
  }

  if (enemyId === null) {
    global.currentEnemies.delete(campaignId);
  } else {
    global.currentEnemies.set(campaignId, enemyId);
  }
}

// ============================================================================
// PENDING EVENT OPERATIONS (for Accept/Reject flow)
// ============================================================================

/**
 * Store pending event waiting for user acceptance (Accept/Reject flow)
 *
 * TODO: Implement database update
 *
 * Implementation:
 * 1. Query: UPDATE campaigns SET pending_event_type = ? WHERE id = ?
 * 2. Store EventTypeString value ("Descriptive", "Environmental", "Combat", "Item_Drop")
 * 3. This will be read back when building game state
 *
 * Flow:
 * 1. LLM generates event type
 * 2. setPendingEvent stores it
 * 3. User sees preview and [Accept]/[Reject] buttons
 * 4. On Accept: generate full event details
 * 5. On Reject: clearPendingEvent and regenerate
 *
 * @param campaignId - Campaign ID
 * @param eventType - Event type (Descriptive, Environmental, Combat, Item_Drop)
 */
export async function setPendingEvent(
  campaignId: number,
  eventType: EventTypeString
): Promise<void> {
  // Step 1: Update campaigns table with pending event type
  // await pool.query(
  //   'UPDATE campaigns SET pending_event_type = ? WHERE id = ?',
  //   [eventType, campaignId]
  // );

  console.log(`[PLACEHOLDER] setPendingEvent(${campaignId}, ${eventType})`);

  // Temporary in-memory storage (replace with DB)
  if (!global.pendingEvents) {
    global.pendingEvents = new Map<number, string>();
  }

  global.pendingEvents.set(campaignId, eventType);
}

/**
 * Get pending event for a campaign
 *
 * TODO: Implement database query
 *
 * Implementation:
 * 1. Query: SELECT pending_event_type FROM campaigns WHERE id = ?
 * 2. Return pending_event_type value or null if not set
 * 3. Used to determine if game is in "event_choice" phase
 *
 * @param campaignId - Campaign ID
 * @returns Pending event type or null if no pending event
 */
export async function getPendingEvent(
  campaignId: number
): Promise<EventTypeString | null> {
  // Step 1: Query campaigns table for pending_event_type
  // const [rows] = await pool.query(
  //   'SELECT pending_event_type FROM campaigns WHERE id = ?',
  //   [campaignId]
  // );

  // Step 2: Return event type or null
  // const eventType = rows[0]?.pending_event_type;
  // return eventType || null;

  console.log(`[PLACEHOLDER] getPendingEvent(${campaignId})`);

  // Temporary in-memory storage (replace with DB)
  if (!global.pendingEvents) {
    global.pendingEvents = new Map<number, string>();
  }

  const eventType = global.pendingEvents.get(campaignId);
  return (eventType as EventTypeString | undefined) || null;
}

/**
 * Clear pending event after acceptance or rejection
 *
 * TODO: Implement database update
 *
 * Implementation:
 * 1. Query: UPDATE campaigns SET pending_event_type = NULL WHERE id = ?
 * 2. Called after user accepts or rejects event
 * 3. Clears the pending state so game returns to normal flow
 *
 * Flow:
 * - User clicks [Accept] → process event → clearPendingEvent()
 * - User clicks [Reject] → clearPendingEvent() → generate new event
 *
 * @param campaignId - Campaign ID
 */
export async function clearPendingEvent(campaignId: number): Promise<void> {
  // Step 1: Set pending_event_type to NULL in campaigns table
  // await pool.query(
  //   'UPDATE campaigns SET pending_event_type = NULL WHERE id = ?',
  //   [campaignId]
  // );

  console.log(`[PLACEHOLDER] clearPendingEvent(${campaignId})`);

  // Temporary in-memory storage (replace with DB)
  if (!global.pendingEvents) {
    global.pendingEvents = new Map<number, string>();
  }

  global.pendingEvents.delete(campaignId);
}

/**
 * Backend Service (Database Layer)
 * ------------------------------------------------------------
 * This service provides the complete interface for all database operations.
 *
 * STATUS: Interface complete - Replace PLACEHOLDER logs with actual queries
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
 * - vitality → vitality
 * - event_number → eventNumber
 * - sprite_path → spritePath
 * - race_id/class_id/campaign_id → race/class/campaignId
 * - weapon_id/armour_id/shield_id → weapon/armor/shield
 *
 */

import type {
  Character,
  Unit,
  Campaign,
  GameEvent,
  Item,
  EventTypeString
} from "@/lib/types/game.types";
import { LLMService } from "@/lib/services/llm.service";
import type { LLMGameContext } from "@/lib/types/llm.types";

// Initialize LLM service for combat rewards (item drops and bonus stats)
const llmService = new LLMService({
  apiKey: process.env.GEMINI_API_KEY || "",
  model: "gemini-2.5-flash-lite",
  temperature: 0.8
});

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
 *    - vitality → vitality
 *    - sprite_path → spritePath
 *    - race_id → race
 *    - class_id → class
 *    - campaign_id → campaignId
 *    - weapon_id → weapon
 *    - armour_id → armor
 *    - shield_id → shield
 * 3. Return Character object
 *
 * @param characterId - Character ID
 * @returns Character data from database
 */
export async function getCharacter(characterId: number): Promise<Character> {
  // Step 1: Query database for character

  // Step 2: Map database fields to Character type

  console.log(`[PLACEHOLDER] getCharacter(${characterId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: characterId,
    name: "Placeholder Hero",
    currentHealth: 50,
    vitality: 10,
    attack: 10,
    defense: 5,
    spritePath: "/characters/player/warrior.png",
    race: { id: 1, name: "Human", vitality: 10, attack: 10, defense: 5 },
    class: { id: 1, name: "Warrior", vitality: 12, attack: 15, defense: 10 },
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
 *    - vitality → vitality
 *    - weapon → weapon_id
 *    - armor → armour_id (note: armour not armor in DB)
 *    - shield → shield_id
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

  // Step 2: Execute update query

  // Step 3: Return updated character

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
export async function getEnemy(enemyId: number): Promise<Unit> {
  // Step 1: Query database for enemy

  // Step 2: Map database fields to Enemy type

  console.log(`[PLACEHOLDER] getEnemy(${enemyId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: enemyId,
    name: "Placeholder Dragon",
    vitality: 10,
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
export async function getRandomEnemy(difficulty?: string): Promise<Unit> {
  // Step 1: Build query based on difficulty parameter

  // Step 2: Execute query and get random enemy

  // Step 3: Map to Enemy type and return

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

  // Step 2: Map database fields to Campaign type

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

  // Step 2: Execute update query

  // Step 3: Return updated campaign

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
  // Step 2: Map database fields (same as getCharacter mapping)
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

  // Step 2: Get max number (will be NULL if no events exist)

  // Step 3: Return next sequential number

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

  // Step 3: Return saved event with generated ID and timestamp

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

  // Step 2: Map each row to GameEvent type

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

  // Step 2: Map each row to Item type

  console.log(`[PLACEHOLDER] getInventory(${characterId})`);

  // MOCK DATA - Replace with actual database query
  return [];
}

/**
 * Add LLM-generated item to character's inventory
 * Routes items to correct database tables based on itemType
 *
 * TODO: Implement database inserts
 *
 * Implementation:
 * 1. Check itemType to determine target table
 * 2. Insert item into appropriate table (weapons/armours/shields/items)
 * 3. For equipment (weapon/armor/shield): Update character's slot field
 * 4. For consumables (potion): Add to character_items join table
 * 5. Handle stat mapping (attack → weapons, defense → shields, etc.)
 *
 * @param characterId - Character ID
 * @param item - LLM-generated item with type, name, and stats
 */
export async function addItemToInventory(
  characterId: number,
  item: {
    itemType: string;
    itemName: string;
    itemStats: Record<string, number>;
  }
): Promise<void> {
  // Step 1: Route item to correct table based on type
  switch (item.itemType) {
    case "weapon":
      // Step 2: Insert into weapons table with name, attack stat, and default rarity
      // Step 3: Get the inserted weapon_id from result
      // Step 4: Update character's weapon_id field

      console.log(
        `[PLACEHOLDER] addItemToInventory - Weapon: ${item.itemName} (attack: ${item.itemStats.attack})`
      );
      break;

    case "armor":
      // Step 5: Insert into armours table with name, vitality (vitality bonus), and default rarity
      // Step 6: Get the inserted armour_id from result
      // Step 7: Update character's armour_id field

      console.log(
        `[PLACEHOLDER] addItemToInventory - Armor: ${
          item.itemName
        } (defense/hp: ${item.itemStats.defense || item.itemStats.hpBonus})`
      );
      break;

    case "shield":
      // Step 8: Insert into shields table with name, defense stat, and default rarity
      // Step 9: Get the inserted shield_id from result
      // Step 10: Update character's shield_id field

      console.log(
        `[PLACEHOLDER] addItemToInventory - Shield: ${item.itemName} (defense: ${item.itemStats.defense})`
      );
      break;

    case "potion":
      // Step 11: Insert into items table with name, health (heal amount), and description
      // Step 12: Get the inserted item_id from result
      // Step 13: Add to character_items join table linking character and item

      console.log(
        `[PLACEHOLDER] addItemToInventory - Potion: ${item.itemName} (heal: ${item.itemStats.healAmount})`
      );
      break;

    default:
      console.error(
        `[BackendService] Unknown item type: ${item.itemType} for ${item.itemName}`
      );
      break;
  }
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

  // Step 2 (Optional): Handle stackable items

  console.log(
    `[PLACEHOLDER] removeItemFromInventory(${characterId}, ${itemId})`
  );
}

/**
 * Assign an existing item to a character (e.g. picking up a dropped item)
 * 
 * TODO: Implement database insert
 * 
 * Implementation:
 * 1. Check item type (weapon/armor/shield/item)
 * 2. If equipment: UPDATE characters SET weapon_id/armor_id/shield_id = ? WHERE id = ?
 * 3. If consumable: INSERT INTO character_items (character_id, item_id) VALUES (?, ?)
 * 
 * @param characterId - Character ID
 * @param itemId - ID of the item to assign
 */
export async function assignItemToCharacter(
  characterId: number,
  itemId: number
): Promise<void> {
  console.log(`[PLACEHOLDER] assignItemToCharacter(${characterId}, ${itemId})`);
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

  // Step 2: Map database fields to Item type

  console.log(`[PLACEHOLDER] getItem(${itemId})`);

  // MOCK DATA - Replace with actual database query
  return {
    id: itemId,
    name: "Placeholder Item",
    health: 20,
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
 * 5. Handle vitality changes proportionally (preserve health ratio)
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
 * - If armor changes vitality, preserve current health ratio
 * - Example: 50/100 HP, +4 vitality armor → 60/120 HP (same 50% ratio)
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

  // Step 2: Get new item data from items table

  // Step 3: Determine which slot field to update (weaponId/armorId/shieldId)

  // Step 4: If character has old item in slot, get it and subtract its stats

  // Step 5: Add new item stats to character
  // Step 6: Update the slot field with new item ID

  // Step 7: Save all stat changes to database via updateCharacter()

  console.log(`[PLACEHOLDER] equipItem(${characterId}, ${itemId}, ${slot})`);
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
): Promise<Unit | null> {
  // Step 1: Query campaigns table for enemy_id

  // Step 2: If no enemy_id, return null (not in combat)

  // Step 3: Fetch enemy details

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

  console.log(`[PLACEHOLDER] setCurrentEnemy(${campaignId}, ${enemyId})`);
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

  // Step 2: Return event type or null

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

  console.log(`[PLACEHOLDER] clearPendingEvent(${campaignId})`);
}

// ============================================================================
// COMBAT REWARDS (CRIT ROLL BEHAVIOR)
// ============================================================================

/**
 * Process combat victory rewards based on dice roll classification
 * Handles crit roll behavior logic (delegated from Event_type.ts for loose coupling)
 *
 * ARCHITECTURE NOTE:
 * - This function contains the "if crit then do X" logic
 * - EventType.handleCombat() calls this with the roll classification
 * - This keeps EventType loosely coupled from reward logic
 * - LLM_Service calls are made here, not in EventType
 *
 * IMPLEMENTATION STATUS:
 * ✅ LLM reward generation (items, stat boosts, bonuses)
 * ✅ Event logging to database
 * ✅ Item inventory routing
 * ⏳ Character stat updates (pending getCharacter implementation)
 *
 * Implementation:
 * 1. Build LLM context from character data
 * 2. Based on roll classification:
 *    - critical_failure (1-4): No rewards, return empty
 *    - regular (5-15): Call LLM_Service.requestStatBoost() → save to logs → (TODO: apply stat changes)
 *    - critical_success (16-20): Call LLM_Service.RequestItemDrop() AND bonusStatRequest() → add item to inventory → save to logs → (TODO: apply bonus stats)
 * 3. Return rewards for EventType to log/display
 *
 * @param campaignId - Campaign ID for context
 * @param characterId - Character ID receiving rewards
 * @param rollClassification - Dice roll classification from Dice_Roll.classifyRoll()
 * @param context - Game context for LLM calls (character stats, recent events, etc.)
 * @returns Rewards applied (stat boosts and items)
 */
export async function processCombatRewards(
  campaignId: number,
  characterId: number,
  rollClassification: "critical_failure" | "regular" | "critical_success",
  context?: {
    characterName: string;
    characterStats: {
      health: number;
      vitality: number;
      attack: number;
      defense: number;
    };
    enemyDefeated: string;
  }
): Promise<{
  statBoosts: Array<{ statType: string; value: number }>;
  items: Array<{
    itemType: string;
    itemName: string;
    itemStats: Record<string, number>;
  }>;
  bonusStats: Array<{ statType: string; value: number }>;
}> {
  // Step 1: Build LLM context from provided context or fetch character
  let llmContext: LLMGameContext | undefined;
  if (context) {
    llmContext = {
      character: {
        name: context.characterName,
        health: context.characterStats.health,
        vitality: context.characterStats.vitality,
        attack: context.characterStats.attack,
        defense: context.characterStats.defense
      },
      enemy: {
        name: context.enemyDefeated,
        health: 0, // Enemy is defeated
        attack: 0,
        defense: 0
      },
      recentEvents: [],
      trigger: `Combat victory against ${context.enemyDefeated}`
    };
  }

  // Step 2: Determine rewards based on roll classification
  switch (rollClassification) {
    case "critical_failure":
      // Step 3: No rewards for critical failure
      console.log(
        `[BackendService] processCombatRewards - Critical Failure: No rewards`
      );
      return { statBoosts: [], items: [], bonusStats: [] };

    case "regular":
      // Step 4: Regular roll (5-15) - Stat boost only
      try {
        const statBoost = await llmService.requestStatBoost(
          llmContext!,
          "Combat"
        );

        // TODO: Uncomment when Stat_Calc is available to apply dice roll modifier
        // const finalValue = Stat_Calc.applyRoll(diceRoll, statBoost.statType, statBoost.baseValue);

        // For now, use baseValue directly (will be modified by Stat_Calc later)
        const finalValue = statBoost.baseValue;

        // TODO: Uncomment when getCharacter is implemented
        // Get current character stats to add boost on top
        // const character = await getCharacter(characterId);
        // await updateCharacter(characterId, { [statBoost.statType]: character[statBoost.statType] + finalValue });

        // Log the reward event
        await saveEvent(
          campaignId,
          `Combat reward: +${finalValue} ${statBoost.statType}`,
          "Combat",
          { reward: statBoost }
        );

        console.log(
          `[BackendService] processCombatRewards - Regular: +${finalValue} ${statBoost.statType}`
        );

        return {
          statBoosts: [{ statType: statBoost.statType, value: finalValue }],
          items: [],
          bonusStats: []
        };
      } catch (error) {
        console.error("Failed to generate regular combat rewards:", error);
        return {
          statBoosts: [{ statType: "vitality", value: 1 }],
          items: [],
          bonusStats: []
        };
      }

    case "critical_success":
      // Step 5: Critical success (16-20) - Item drop AND bonus stat
      try {
        // Call both LLM methods in parallel for efficiency
        const [item, bonusStat] = await Promise.all([
          llmService.RequestItemDrop(llmContext),
          llmService.bonusStatRequest(llmContext)
        ]);

        // Add item to inventory (routes to correct table internally)
        await addItemToInventory(characterId, item);

        // TODO: Uncomment when getCharacter is implemented
        // Get current character stats to add bonus on top
        // const character = await getCharacter(characterId);
        // await updateCharacter(characterId, { [bonusStat.statType]: character[bonusStat.statType] + bonusStat.value });

        // Log the reward event
        await saveEvent(
          campaignId,
          `Combat reward: ${item.itemName} + ${bonusStat.value} ${bonusStat.statType}!`,
          "Combat",
          { item, bonusStat }
        );

        console.log(
          `[BackendService] processCombatRewards - Critical Success: ${item.itemName} + ${bonusStat.value} ${bonusStat.statType}`
        );

        return {
          statBoosts: [],
          items: [item],
          bonusStats: [bonusStat]
        };
      } catch (error) {
        console.error("Failed to generate critical success rewards:", error);
        return {
          statBoosts: [],
          items: [
            {
              itemType: "potion",
              itemName: "Health Potion",
              itemStats: { health: 20 }
            }
          ],
          bonusStats: [{ statType: "vitality", value: 1 }]
        };
      }

    default:
      console.error(
        `[BackendService] Unknown roll classification: ${rollClassification}`
      );
      return { statBoosts: [], items: [], bonusStats: [] };
  }
}

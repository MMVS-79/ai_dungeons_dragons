/**
 * Backend Service (Database Layer) - UPDATED FOR NEW ARCHITECTURE
 * ================================================================
 * Complete database abstraction layer with full implementations
 *
 * KEY FEATURES:
 * - Character operations with equipment and inventory loading
 * - Rarity-based item/equipment selection
 * - Difficulty-based enemy selection
 * - Equipment management (equip weapons/armour/shields)
 * - Inventory management (add/remove items)
 * - Event logging system
 *
 * DATABASE MAPPING:
 * - snake_case (DB) ↔ camelCase (TypeScript)
 * - current_health → currentHealth
 * - max_health → maxHealth
 * - stat_modified → statModified
 * - stat_value → statValue
 * - sprite_path → spritePath
 */

import { pool } from "../db";
import type {
  Character,
  Enemy,
  Campaign,
  GameEvent,
  Item,
  Weapon,
  Armour,
  Shield,
  Equipment,
  EventTypeString,
} from "../types/game.types";
import type {
  CharacterRow,
  WeaponRow,
  ArmourRow,
  ShieldRow,
  ItemRow,
  EnemyRow,
  CampaignRow,
  LogRow,
  RaceRow,
  ClassRow,
  EventData,
  InsertResult,
} from "../types/db.types";
import { RowDataPacket } from "mysql2";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse JSON event data safely
 */
function parseEventData(data: unknown): EventData | undefined {
  if (!data) return undefined;

  if (typeof data === "object" && data !== null) return data as EventData;

  if (typeof data === "string") {
    try {
      return JSON.parse(data) as EventData;
    } catch (e) {
      console.error("[BackendService] Failed to parse event_data:", data);
      return undefined;
    }
  }
  return undefined;
}

/**
 * Map database row to Character type
 */
function mapCharacterRow(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    currentHealth: row.current_health,
    maxHealth: row.max_health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path || undefined,
    raceId: row.race_id,
    classId: row.class_id,
    campaignId: row.campaign_id,
    weaponId: row.weapon_id || undefined,
    armourId: row.armour_id || undefined,
    shieldId: row.shield_id || undefined,
  };
}

/**
 * Map database row to Weapon type
 */
function mapWeaponRow(row: WeaponRow): Weapon {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    attack: row.attack,
    description: row.description || undefined,
    spritePath: row.sprite_path || undefined,
  };
}

/**
 * Map database row to Armour type
 */
function mapArmourRow(row: ArmourRow): Armour {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    health: row.health,
    description: row.description || undefined,
    spritePath: row.sprite_path || undefined,
  };
}

/**
 * Map database row to Shield type
 */
function mapShieldRow(row: ShieldRow): Shield {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    defense: row.defense,
    description: row.description || undefined,
    spritePath: row.sprite_path || undefined,
  };
}

/**
 * Map database row to Item type
 */
function mapItemRow(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    statModified: row.stat_modified,
    statValue: row.stat_value,
    description: row.description || undefined,
    spritePath: row.sprite_path || undefined,
  };
}

/**
 * Map database row to Enemy type
 */
function mapEnemyRow(row: EnemyRow): Enemy {
  return {
    id: row.id,
    name: row.name,
    difficulty: row.difficulty,
    health: row.health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path || undefined,
  };
}

/**
 * Map database row to Campaign type
 */
function mapCampaignRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    description: row.description || undefined,
    state: row.state,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface RaceRow {
  id: number;
  name: string;
  health: number;
  attack: number;
  defense: number;
  sprite_path?: string;
}

export interface ClassRow {
  id: number;
  name: string;
  health: number;
  attack: number;
  defense: number;
  sprite_path?: string;
}

async function getRace(id: number): Promise<RaceRow> {
  const sql = `SELECT * FROM races WHERE id = ?`;
  const [rows] = await pool.query<RaceRow[]>(sql, [id]);

  if (rows.length === 0) throw new Error(`Race ${id} not found`);
  return rows[0];
}

async function getClass(id: number): Promise<ClassRow> {
  const sql = `SELECT * FROM classes WHERE id = ?`;
  const [rows] = await pool.query<ClassRow[]>(sql, [id]);

  if (rows.length === 0) throw new Error(`Class ${id} not found`);
  return rows[0];
}

// ---------------------------------------------------------------------------
// Type for updates
// ---------------------------------------------------------------------------
export type CharacterUpdates = Partial<Omit<Character, "race" | "class">> & {
  weapon?: Partial<Weapon>;
  armor?: Partial<Armour>;
  shield?: Partial<Shield>;
};

// ============================================================================
// CHARACTER OPERATIONS
// ============================================================================

/**
 * Creates a new character
 * Includes race, class, equipment, base stats, and final stats
 */

export async function createCharacter(
  campaignId: number,
  name: string,
  raceId: number,
  classId: number,
): Promise<Character> {
  try {
    // 1. Load race + class data
    const race = await getRace(raceId);
    const cls = await getClass(classId);

    // 2. Compute base stats
    const baseHealth = race.health + cls.health;
    const baseAttack = race.attack + cls.attack;
    const baseDefense = race.defense + cls.defense;

    // 3. Insert the new character
    const sql = `
      INSERT INTO characters (
        name, current_health, max_health,
        attack, defense, sprite_path,
        campaign_id, race_id, class_id,
        weapon_id, armour_id, shield_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
    `;

    const [result] = await pool.query<any>(sql, [
      name,
      baseHealth, // current
      baseHealth, // max
      baseAttack,
      baseDefense,
      null, // sprite_path for character
      campaignId,
      raceId,
      classId,
    ]);

    const newId = result.insertId;

    // 4. Return it using same mapping as getCharacter
    return await getCharacter(newId);
  } catch (err) {
    console.error("[BackendService] createCharacter failed:", err);
    throw err;
  }
}

/**
 * Fetch a character by ID from the database
 * Includes race, class, equipment, base stats, and final stats
 */

export async function getCharacter(id: number): Promise<Character> {
  try {
    const sql = `
        SELECT 
          c.id AS id,
          c.name AS name,
          c.current_health AS current_health,
          c.max_health AS max_health,
          c.attack AS base_attack,
          c.defense AS base_defense,
          c.sprite_path AS sprite_path,
          c.campaign_id AS campaign_id,
          c.race_id AS race_id,
          c.class_id AS class_id,
          c.weapon_id AS weapon_id,
          c.armour_id AS armour_id,
          c.shield_id AS shield_id
        FROM characters c
        WHERE c.id = ?
      `;

    const [rows] = await pool.query<CharacterRow[]>(sql, [id]);

    if (rows.length === 0) {
      throw new Error(`Character ${id} not found`);
    }

    return mapCharacterRow(rows[0]);
  } catch (error) {
    console.error(`[BackendService] getCharacter(${id}) failed:`, error);
    throw error;
  }
}

/**
 * Update character dynamically in the database
 */
export async function updateCharacter(
  characterId: number,
  updates: Partial<Character>,
): Promise<Character> {
  try {
    // Map TypeScript keys to DB columns
    const fieldMap: Record<string, string> = {
      name: "name",
      currentHealth: "current_health",
      maxHealth: "max_health",
      attack: "attack",
      defense: "defense",
      spritePath: "sprite_path",
      campaignId: "campaign_id",
      weaponId: "weapon_id",
      armourId: "armour_id",
      shieldId: "shield_id",
    };

    const columns: string[] = [];
    const values: (number | string | null)[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const col = fieldMap[key];
      if (!col) continue;

      values.push(value as number | string | null);
      columns.push(col);
    }

    // Nothing to update
    if (columns.length === 0) {
      return await getCharacter(characterId);
    }

    const setClause = columns.map((col) => `${col} = ?`).join(", ");

    const sql = `UPDATE characters SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    values.push(characterId);

    await pool.query(sql, values);

    return await getCharacter(characterId);
  } catch (error) {
    console.error(
      `[BackendService] updateCharacter(${characterId}) failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Get Character by Campaign ID
 */
export async function getCharacterByCampaign(
  campaignId: number,
): Promise<Character> {
  const [rows] = await pool.query<CharacterRow[]>(
    "SELECT * FROM characters WHERE campaign_id = ? LIMIT 1",
    [campaignId],
  );

  if (rows.length === 0) {
    throw new Error(`No character found for campaign ${campaignId}`);
  }

  return mapCharacterRow(rows[0]);
}

/**
 * Get full character data with equipment and inventory
 * Called on page load to initialize frontend state
 */
export async function getCharacterWithFullData(campaignId: number): Promise<{
  character: Character;
  equipment: Equipment;
  inventory: Item[];
}> {
  const character = await getCharacterByCampaign(campaignId);

  const equipment: Equipment = {};

  if (character.weaponId) {
    equipment.weapon = await getWeapon(character.weaponId);
  }

  if (character.armourId) {
    equipment.armour = await getArmour(character.armourId);
  }

  if (character.shieldId) {
    equipment.shield = await getShield(character.shieldId);
  }

  const inventory = await getInventory(character.id);

  return { character, equipment, inventory };
}

// ============================================================================
// RACE & CLASS GETTERS
// ============================================================================

export async function getAllRaces(): Promise<RaceRow[]> {
  const [rows] = await pool.query<RaceRow[]>(
    `SELECT * FROM races
     ORDER BY name ASC`,
  );

  return rows;
}

export async function getAllClasses(): Promise<ClassRow[]> {
  const [rows] = await pool.query<ClassRow[]>(
    `SELECT * FROM classes
     ORDER BY name ASC`,
  );

  return rows;
}

// ============================================================================
// EQUIPMENT GETTERS
// ============================================================================

/**
 * Get weapon by ID
 */
export async function getWeapon(weaponId: number): Promise<Weapon> {
  const [rows] = await pool.query<WeaponRow[]>(
    "SELECT * FROM weapons WHERE id = ?",
    [weaponId],
  );

  if (rows.length === 0) {
    throw new Error(`Weapon ${weaponId} not found`);
  }
  return mapWeaponRow(rows[0]);
}

/**
 * Get armour by ID
 */
export async function getArmour(armourId: number): Promise<Armour> {
  const [rows] = await pool.query<ArmourRow[]>(
    "SELECT * FROM armours WHERE id = ?",
    [armourId],
  );

  if (rows.length === 0) {
    throw new Error(`Armour ${armourId} not found`);
  }
  return mapArmourRow(rows[0]);
}

/**
 * Get shield by ID
 */
export async function getShield(shieldId: number): Promise<Shield> {
  const [rows] = await pool.query<ShieldRow[]>(
    "SELECT * FROM shields WHERE id = ?",
    [shieldId],
  );

  if (rows.length === 0) {
    throw new Error(`Shield ${shieldId} not found`);
  }
  return mapShieldRow(rows[0]);
}

// ============================================================================
// EQUIPMENT MANAGEMENT
// ============================================================================

/**
 * Equip weapon to character
 */
export async function equipWeapon(
  characterId: number,
  weaponId: number,
): Promise<void> {
  await pool.query(
    "UPDATE characters SET weapon_id = ?, updated_at = NOW() WHERE id = ?",
    [weaponId, characterId],
  );
}

/**
 * Equip armour to character
 */
export async function equipArmour(
  characterId: number,
  armourId: number,
): Promise<void> {
  await pool.query(
    "UPDATE characters SET armour_id = ?, updated_at = NOW() WHERE id = ?",
    [armourId, characterId],
  );
}

/**
 * Equip shield to character
 */
export async function equipShield(
  characterId: number,
  shieldId: number,
): Promise<void> {
  await pool.query(
    "UPDATE characters SET shield_id = ?, updated_at = NOW() WHERE id = ?",
    [shieldId, characterId],
  );
}

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

/**
 * Get character's inventory items
 */
export async function getInventory(characterId: number): Promise<Item[]> {
  const [rows] = await pool.query<ItemRow[]>(
    `SELECT items.* FROM items
     JOIN character_items ON items.id = character_items.item_id
     WHERE character_items.character_id = ?`,
    [characterId],
  );

  return rows.map(mapItemRow);
}

/**
 * Get single item by ID
 */
export async function getItem(itemId: number): Promise<Item> {
  const [rows] = await pool.query<ItemRow[]>(
    "SELECT * FROM items WHERE id = ?",
    [itemId],
  );

  if (rows.length === 0) {
    throw new Error(`Item ${itemId} not found`);
  }

  return mapItemRow(rows[0]);
}

/**
 * Add existing item to character inventory
 */
export async function addItemToInventory(
  characterId: number,
  itemId: number,
): Promise<void> {
  await pool.query(
    "INSERT INTO character_items (character_id, item_id) VALUES (?, ?)",
    [characterId, itemId],
  );
}

/**
 * Remove item from character inventory
 */
export async function removeItemFromInventory(
  characterId: number,
  itemId: number,
): Promise<void> {
  await pool.query(
    "DELETE FROM character_items WHERE character_id = ? AND item_id = ? LIMIT 1",
    [characterId, itemId],
  );
}

// ============================================================================
// RARITY-BASED ITEM SELECTION
// ============================================================================

/**
 * Get item by rarity range (for exploration item drops)
 */
export async function getItemByRarity(
  targetRarity: number,
  variance: number = 5,
): Promise<Item> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<ItemRow[]>(
    `SELECT * FROM items 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity],
  );

  if (rows.length === 0) {
    // Fallback to closest item
    const [fallbackRows] = await pool.query<ItemRow[]>(
      `SELECT * FROM items 
       ORDER BY ABS(rarity - ?) ASC 
       LIMIT 1`,
      [targetRarity],
    );

    if (fallbackRows.length === 0) {
      throw new Error("No items found in database");
    }

    return mapItemRow(fallbackRows[0]);
  }

  return mapItemRow(rows[0]);
}

/**
 * Get weapon by rarity range (for combat rewards)
 */
export async function getWeaponByRarity(
  targetRarity: number,
  variance: number = 5,
): Promise<Weapon> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<WeaponRow[]>(
    `SELECT * FROM weapons 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity],
  );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<WeaponRow[]>(
      "SELECT * FROM weapons ORDER BY ABS(rarity - ?) ASC LIMIT 1",
      [targetRarity],
    );

    if (fallbackRows.length === 0) {
      throw new Error("No weapons found in database");
    }

    return mapWeaponRow(fallbackRows[0]);
  }

  return mapWeaponRow(rows[0]);
}

/**
 * Get armour by rarity range (for combat rewards)
 */
export async function getArmourByRarity(
  targetRarity: number,
  variance: number = 5,
): Promise<Armour> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<ArmourRow[]>(
    `SELECT * FROM armours 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity],
  );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<ArmourRow[]>(
      "SELECT * FROM armours ORDER BY ABS(rarity - ?) ASC LIMIT 1",
      [targetRarity],
    );

    if (fallbackRows.length === 0) {
      throw new Error("No armours found in database");
    }

    return mapArmourRow(fallbackRows[0]);
  }

  return mapArmourRow(rows[0]);
}

/**
 * Get shield by rarity range (for combat rewards)
 */
export async function getShieldByRarity(
  targetRarity: number,
  variance: number = 5,
): Promise<Shield> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<ShieldRow[]>(
    `SELECT * FROM shields 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity],
  );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<ShieldRow[]>(
      "SELECT * FROM shields ORDER BY ABS(rarity - ?) ASC LIMIT 1",
      [targetRarity],
    );

    if (fallbackRows.length === 0) {
      throw new Error("No shields found in database");
    }

    return mapShieldRow(fallbackRows[0]);
  }

  return mapShieldRow(rows[0]);
}

// ============================================================================
// ENEMY OPERATIONS
// ============================================================================

/**
 * Get enemy by ID
 */
export async function getEnemy(enemyId: number): Promise<Enemy> {
  const [rows] = await pool.query<EnemyRow[]>(
    "SELECT * FROM enemies WHERE id = ?",
    [enemyId],
  );

  if (rows.length === 0) {
    throw new Error(`Enemy ${enemyId} not found`);
  }

  return mapEnemyRow(rows[0]);
}

/**
 * Get enemy by difficulty range (for combat encounters)
 */
export async function getEnemyByDifficulty(
  targetDifficulty: number,
  variance: number = 3,
  excludeBosses: boolean = true,
): Promise<Enemy> {
  const minDifficulty = Math.max(0, targetDifficulty - variance);
  const maxDifficulty = targetDifficulty + variance;

  let query = `SELECT * FROM enemies WHERE difficulty BETWEEN ? AND ?`;
  const params: (number | string)[] = [minDifficulty, maxDifficulty];

  if (excludeBosses) {
    query += ` AND difficulty < 1000`;
  }

  query += ` ORDER BY ABS(difficulty - ?) ASC, RAND() LIMIT 1`;
  params.push(targetDifficulty);

  const [rows] = await pool.query<EnemyRow[]>(query, params);

  if (rows.length === 0) {
    // Fallback to closest enemy
    console.warn(`[BackendService] No enemy found in range, using closest`);
    let fallbackQuery = "SELECT * FROM enemies";
    if (excludeBosses) {
      fallbackQuery += " WHERE difficulty < 1000";
    }
    fallbackQuery += " ORDER BY ABS(difficulty - ?) ASC LIMIT 1";

    const [fallbackRows] = await pool.query<EnemyRow[]>(fallbackQuery, [
      targetDifficulty,
    ]);

    if (fallbackRows.length === 0) {
      throw new Error("No enemies found in database");
    }

    return mapEnemyRow(fallbackRows[0]);
  }

  return mapEnemyRow(rows[0]);
}

/**
 * Get random boss enemy (difficulty >= 1000)
 */
export async function getBossEnemy(): Promise<Enemy> {
  const [rows] = await pool.query<EnemyRow[]>(
    "SELECT * FROM enemies WHERE difficulty >= 1000 ORDER BY RAND() LIMIT 1",
  );

  if (rows.length === 0) {
    throw new Error("No boss enemies found in database");
  }

  return mapEnemyRow(rows[0]);
}

// ============================================================================
// CAMPAIGN OPERATIONS
// ============================================================================

/**
 * Creates a new campaign
 * Returns the created Campaign object
 */
export async function createCampaign(
  accountId: number,
  name: string,
  description?: string,
): Promise<Campaign> {
  try {
    // 1. Insert new campaign into DB
    const sql = `
      INSERT INTO campaigns (
        account_id,
        name,
        description,
        state,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.query<any>(sql, [
      accountId,
      name,
      description || null,
      "active", // default state
    ]);

    const newId = result.insertId;

    // 2. Return the campaign using the same mapping as getCampaign
    return await getCampaign(newId);
  } catch (err) {
    console.error("[BackendService] createCampaign failed:", err);
    throw err;
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaign(campaignId: number): Promise<Campaign> {
  const [rows] = await pool.query<CampaignRow[]>(
    "SELECT * FROM campaigns WHERE id = ?",
    [campaignId],
  );

  if (rows.length === 0) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  return mapCampaignRow(rows[0]);
}

/**
 * Update campaign state
 */
export async function updateCampaign(
  campaignId: number,
  updates: Partial<Campaign>,
): Promise<Campaign> {
  const dbUpdates: Record<string, string | undefined> = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.state !== undefined) dbUpdates.state = updates.state;

  if (Object.keys(dbUpdates).length === 0) {
    return getCampaign(campaignId);
  }

  const setClause = Object.keys(dbUpdates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(dbUpdates), campaignId];

  await pool.query(
    `UPDATE campaigns SET ${setClause}, updated_at = NOW() WHERE id = ?`,
    values,
  );

  return getCampaign(campaignId);
}

// ============================================================================
// EVENT OPERATIONS
// ============================================================================

/**
 * Get next sequential event number for a campaign
 */
async function getNextEventNumber(campaignId: number): Promise<number> {
  interface MaxNumRow extends RowDataPacket {
    maxNum: number | null;
  }

  const [rows] = await pool.query<MaxNumRow[]>(
    "SELECT MAX(event_number) as maxNum FROM logs WHERE campaign_id = ?",
    [campaignId],
  );

  const maxNum = rows[0]?.maxNum;
  return (maxNum || 0) + 1;
}

/**
 * Save game event to database (logs table)
 */
export async function saveEvent(
  campaignId: number,
  message: string,
  eventType: EventTypeString,
  eventData?: EventData,
): Promise<GameEvent> {
  const eventNumber = await getNextEventNumber(campaignId);
  const eventDataJson = eventData ? JSON.stringify(eventData) : null;

  const [result] = await pool.query<InsertResult>(
    "INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (?, ?, ?, ?, ?)",
    [campaignId, message, eventNumber, eventType, eventDataJson],
  );

  return {
    id: result.insertId,
    campaignId,
    message,
    eventNumber,
    eventType,
    eventData,
    createdAt: new Date(),
  };
}

/**
 * Fetch recent events for a campaign
 */
export async function getRecentEvents(
  campaignId: number,
  limit: number = 10,
): Promise<GameEvent[]> {
  const [rows] = await pool.query<LogRow[]>(
    "SELECT * FROM logs WHERE campaign_id = ? ORDER BY event_number DESC LIMIT ?",
    [campaignId, limit],
  );

  return rows.map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    message: row.message,
    eventNumber: row.event_number,
    eventType: row.event_type,
    eventData: parseEventData(row.event_data),
    createdAt: new Date(row.created_at),
  }));
}

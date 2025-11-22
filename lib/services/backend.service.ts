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

import pool from "../db";
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse JSON event data safely
 */
function parseEventData(data: any): Record<string, unknown> | undefined {
  if (!data) return undefined;
  if (typeof data === "object" && data !== null)
    return data as Record<string, unknown>;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("[BackendService] Failed to parse event_data:", data);
      return undefined;
    }
  }
  return undefined;
}

// ============================================================================
// CHARACTER OPERATIONS
// ============================================================================

/**
 * Get character by ID from database
 */
export async function getCharacter(characterId: number): Promise<Character> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM characters WHERE id = ?",
    [characterId]
  );

  if (rows.length === 0) {
    throw new Error(`Character ${characterId} not found`);
  }

  const row = rows[0];

  return {
    id: row.id,
    name: row.name,
    currentHealth: row.current_health,
    maxHealth: row.max_health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path,
    raceId: row.race_id,
    classId: row.class_id,
    campaignId: row.campaign_id,
    weaponId: row.weapon_id,
    armourId: row.armour_id,
    shieldId: row.shield_id,
  };
}

/**
 * Update character stats in database
 */
export async function updateCharacter(
  characterId: number,
  updates: Partial<Character>
): Promise<Character> {
  const dbUpdates: Record<string, any> = {};

  if (updates.currentHealth !== undefined)
    dbUpdates.current_health = updates.currentHealth;
  if (updates.maxHealth !== undefined) dbUpdates.max_health = updates.maxHealth;
  if (updates.attack !== undefined) dbUpdates.attack = updates.attack;
  if (updates.defense !== undefined) dbUpdates.defense = updates.defense;
  if (updates.weaponId !== undefined) dbUpdates.weapon_id = updates.weaponId;
  if (updates.armourId !== undefined) dbUpdates.armour_id = updates.armourId;
  if (updates.shieldId !== undefined) dbUpdates.shield_id = updates.shieldId;

  if (Object.keys(dbUpdates).length === 0) {
    return getCharacter(characterId);
  }

  const setClause = Object.keys(dbUpdates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(dbUpdates), characterId];

  await pool.query(
    `UPDATE characters SET ${setClause}, updated_at = NOW() WHERE id = ?`,
    values
  );

  return getCharacter(characterId);
}

/**
 * Get character by campaign ID
 */
export async function getCharacterByCampaign(
  campaignId: number
): Promise<Character> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM characters WHERE campaign_id = ? LIMIT 1",
    [campaignId]
  );

  if (rows.length === 0) {
    throw new Error(`No character found for campaign ${campaignId}`);
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    currentHealth: row.current_health,
    maxHealth: row.max_health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path,
    raceId: row.race_id,
    classId: row.class_id,
    campaignId: row.campaign_id,
    weaponId: row.weapon_id,
    armourId: row.armour_id,
    shieldId: row.shield_id,
  };
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

  console.log(
    `[BackendService] Loaded full character data for campaign ${campaignId}`
  );

  return { character, equipment, inventory };
}

// ============================================================================
// EQUIPMENT GETTERS
// ============================================================================

/**
 * Get weapon by ID
 */
export async function getWeapon(weaponId: number): Promise<Weapon> {
  const [rows] = await pool.query<any[]>("SELECT * FROM weapons WHERE id = ?", [
    weaponId,
  ]);

  if (rows.length === 0) {
    throw new Error(`Weapon ${weaponId} not found`);
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    attack: row.attack,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

/**
 * Get armour by ID
 */
export async function getArmour(armourId: number): Promise<Armour> {
  const [rows] = await pool.query<any[]>("SELECT * FROM armours WHERE id = ?", [
    armourId,
  ]);

  if (rows.length === 0) {
    throw new Error(`Armour ${armourId} not found`);
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    health: row.health,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

/**
 * Get shield by ID
 */
export async function getShield(shieldId: number): Promise<Shield> {
  const [rows] = await pool.query<any[]>("SELECT * FROM shields WHERE id = ?", [
    shieldId,
  ]);

  if (rows.length === 0) {
    throw new Error(`Shield ${shieldId} not found`);
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    defense: row.defense,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

// ============================================================================
// EQUIPMENT MANAGEMENT (EQUIP TO CHARACTER)
// ============================================================================

/**
 * Equip weapon to character
 */
export async function equipWeapon(
  characterId: number,
  weaponId: number
): Promise<void> {
  await pool.query(
    "UPDATE characters SET weapon_id = ?, updated_at = NOW() WHERE id = ?",
    [weaponId, characterId]
  );

  console.log(
    `[BackendService] Equipped weapon ${weaponId} to character ${characterId}`
  );
}

/**
 * Equip armour to character
 */
export async function equipArmour(
  characterId: number,
  armourId: number
): Promise<void> {
  await pool.query(
    "UPDATE characters SET armour_id = ?, updated_at = NOW() WHERE id = ?",
    [armourId, characterId]
  );

  console.log(
    `[BackendService] Equipped armour ${armourId} to character ${characterId}`
  );
}

/**
 * Equip shield to character
 */
export async function equipShield(
  characterId: number,
  shieldId: number
): Promise<void> {
  await pool.query(
    "UPDATE characters SET shield_id = ?, updated_at = NOW() WHERE id = ?",
    [shieldId, characterId]
  );

  console.log(
    `[BackendService] Equipped shield ${shieldId} to character ${characterId}`
  );
}

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

/**
 * Get character's inventory items
 */
export async function getInventory(characterId: number): Promise<Item[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT items.* FROM items
     JOIN character_items ON items.id = character_items.item_id
     WHERE character_items.character_id = ?`,
    [characterId]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    statModified: row.stat_modified as "health" | "attack" | "defense",
    statValue: row.stat_value,
    description: row.description,
    spritePath: row.sprite_path,
  }));
}

/**
 * Get single item by ID
 */
export async function getItem(itemId: number): Promise<Item> {
  const [rows] = await pool.query<any[]>("SELECT * FROM items WHERE id = ?", [
    itemId,
  ]);

  if (rows.length === 0) {
    throw new Error(`Item ${itemId} not found`);
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    statModified: row.stat_modified as "health" | "attack" | "defense",
    statValue: row.stat_value,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

/**
 * Add existing item to character inventory
 */
export async function addItemToInventory(
  characterId: number,
  itemId: number
): Promise<void> {
  await pool.query(
    "INSERT INTO character_items (character_id, item_id) VALUES (?, ?)",
    [characterId, itemId]
  );

  console.log(
    `[BackendService] Added item ${itemId} to character ${characterId}`
  );
}

/**
 * Remove item from character inventory
 */
export async function removeItemFromInventory(
  characterId: number,
  itemId: number
): Promise<void> {
  console.log(
    `[BackendService] Removing item ${itemId} from character ${characterId} inventory`
  );

  const result = await pool.query(
    "DELETE FROM character_items WHERE character_id = ? AND item_id = ? LIMIT 1",
    [characterId, itemId]
  );

  console.log(`[BackendService] Delete result:`, result);
  console.log(
    `[BackendService] Removed item ${itemId} from character ${characterId}`
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
  variance: number = 5
): Promise<Item> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM items 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity]
  );

  if (rows.length === 0) {
    // Fallback to closest item
    const [fallbackRows] = await pool.query<any[]>(
      `SELECT * FROM items 
       ORDER BY ABS(rarity - ?) ASC 
       LIMIT 1`,
      [targetRarity]
    );

    if (fallbackRows.length === 0) {
      throw new Error("No items found in database");
    }

    const row = fallbackRows[0];
    return {
      id: row.id,
      name: row.name,
      rarity: row.rarity,
      statModified: row.stat_modified,
      statValue: row.stat_value,
      description: row.description,
      spritePath: row.sprite_path,
    };
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    statModified: row.stat_modified,
    statValue: row.stat_value,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

/**
 * Get weapon by rarity range (for combat rewards)
 */
export async function getWeaponByRarity(
  targetRarity: number,
  variance: number = 5
): Promise<Weapon> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM weapons 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity]
  );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<any[]>(
      "SELECT * FROM weapons ORDER BY ABS(rarity - ?) ASC LIMIT 1",
      [targetRarity]
    );

    if (fallbackRows.length === 0) {
      throw new Error("No weapons found in database");
    }

    const row = fallbackRows[0];
    return {
      id: row.id,
      name: row.name,
      rarity: row.rarity,
      attack: row.attack,
      description: row.description,
      spritePath: row.sprite_path,
    };
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    attack: row.attack,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

/**
 * Get armour by rarity range (for combat rewards)
 */
export async function getArmourByRarity(
  targetRarity: number,
  variance: number = 5
): Promise<Armour> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM armours 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity]
  );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<any[]>(
      "SELECT * FROM armours ORDER BY ABS(rarity - ?) ASC LIMIT 1",
      [targetRarity]
    );

    if (fallbackRows.length === 0) {
      throw new Error("No armours found in database");
    }

    const row = fallbackRows[0];
    return {
      id: row.id,
      name: row.name,
      rarity: row.rarity,
      health: row.health,
      description: row.description,
      spritePath: row.sprite_path,
    };
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    health: row.health,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

/**
 * Get shield by rarity range (for combat rewards)
 */
export async function getShieldByRarity(
  targetRarity: number,
  variance: number = 5
): Promise<Shield> {
  const minRarity = Math.max(0, targetRarity - variance);
  const maxRarity = targetRarity + variance;

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM shields 
     WHERE rarity BETWEEN ? AND ?
     ORDER BY ABS(rarity - ?) ASC, RAND()
     LIMIT 1`,
    [minRarity, maxRarity, targetRarity]
  );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<any[]>(
      "SELECT * FROM shields ORDER BY ABS(rarity - ?) ASC LIMIT 1",
      [targetRarity]
    );

    if (fallbackRows.length === 0) {
      throw new Error("No shields found in database");
    }

    const row = fallbackRows[0];
    return {
      id: row.id,
      name: row.name,
      rarity: row.rarity,
      defense: row.defense,
      description: row.description,
      spritePath: row.sprite_path,
    };
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    defense: row.defense,
    description: row.description,
    spritePath: row.sprite_path,
  };
}

// ============================================================================
// ENEMY OPERATIONS
// ============================================================================

/**
 * Get enemy by ID
 */
export async function getEnemy(enemyId: number): Promise<Enemy> {
  const [rows] = await pool.query<any[]>("SELECT * FROM enemies WHERE id = ?", [
    enemyId,
  ]);

  if (rows.length === 0) {
    throw new Error(`Enemy ${enemyId} not found`);
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    difficulty: row.difficulty,
    health: row.health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path,
  };
}

/**
 * Get enemy by difficulty range (for combat encounters)
 */
export async function getEnemyByDifficulty(
  targetDifficulty: number,
  variance: number = 3,
  excludeBosses: boolean = true
): Promise<Enemy> {
  const minDifficulty = Math.max(0, targetDifficulty - variance);
  const maxDifficulty = targetDifficulty + variance;

  let query = `SELECT * FROM enemies WHERE difficulty BETWEEN ? AND ?`;
  const params: any[] = [minDifficulty, maxDifficulty];

  if (excludeBosses) {
    query += ` AND difficulty < 1000`;
  }

  query += ` ORDER BY ABS(difficulty - ?) ASC, RAND() LIMIT 1`;
  params.push(targetDifficulty);

  const [rows] = await pool.query<any[]>(query, params);

  if (rows.length === 0) {
    // Fallback to closest enemy
    let fallbackQuery = "SELECT * FROM enemies";
    if (excludeBosses) {
      fallbackQuery += " WHERE difficulty < 1000";
    }
    fallbackQuery += " ORDER BY ABS(difficulty - ?) ASC LIMIT 1";

    const [fallbackRows] = await pool.query<any[]>(fallbackQuery, [
      targetDifficulty,
    ]);

    if (fallbackRows.length === 0) {
      throw new Error("No enemies found in database");
    }

    const row = fallbackRows[0];
    return {
      id: row.id,
      name: row.name,
      difficulty: row.difficulty,
      health: row.health,
      attack: row.attack,
      defense: row.defense,
      spritePath: row.sprite_path,
    };
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    difficulty: row.difficulty,
    health: row.health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path,
  };
}

/**
 * Get random boss enemy (difficulty >= 1000)
 */
export async function getBossEnemy(): Promise<Enemy> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM enemies WHERE difficulty >= 1000 ORDER BY RAND() LIMIT 1"
  );

  if (rows.length === 0) {
    throw new Error("No boss enemies found in database");
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    difficulty: row.difficulty,
    health: row.health,
    attack: row.attack,
    defense: row.defense,
    spritePath: row.sprite_path,
  };
}

// ============================================================================
// CAMPAIGN OPERATIONS
// ============================================================================

/**
 * Get campaign by ID
 */
export async function getCampaign(campaignId: number): Promise<Campaign> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM campaigns WHERE id = ?",
    [campaignId]
  );

  if (rows.length === 0) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const row = rows[0];
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    description: row.description,
    state: row.state,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Update campaign state
 */
export async function updateCampaign(
  campaignId: number,
  updates: Partial<Campaign>
): Promise<Campaign> {
  const dbUpdates: Record<string, any> = {};

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
    values
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
  const [rows] = await pool.query<any[]>(
    "SELECT MAX(event_number) as maxNum FROM logs WHERE campaign_id = ?",
    [campaignId]
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
  eventData?: Record<string, unknown>
): Promise<GameEvent> {
  const eventNumber = await getNextEventNumber(campaignId);
  const eventDataJson = eventData ? JSON.stringify(eventData) : null;

  const [result] = await pool.query<any>(
    "INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (?, ?, ?, ?, ?)",
    [campaignId, message, eventNumber, eventType, eventDataJson]
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
  limit: number = 10
): Promise<GameEvent[]> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM logs WHERE campaign_id = ? ORDER BY event_number DESC LIMIT ?",
    [campaignId, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    message: row.message,
    eventNumber: row.event_number,
    eventType: row.event_type as EventTypeString,
    eventData: parseEventData(row.event_data),
    createdAt: new Date(row.created_at),
  }));
}

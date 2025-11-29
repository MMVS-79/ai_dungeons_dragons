/**
 * Test Data Generator
 * ====================
 * Utility to generate consistent test data sets for unit and integration tests
 * 
 * Features:
 * - Generate test accounts
 * - Generate test campaigns at various stages
 * - Generate characters with different loadouts
 * - Generate complete game states for testing
 * - Seed database with test data (when using real DB)
 */

import { pool } from '../lib/db';
import { ResultSetHeader } from 'mysql2';

/**
 * Test data generator class for creating consistent test fixtures
 */
export class TestDataGenerator {
  /**
   * Create a test account
   */
  static async createTestAccount(email: string): Promise<{ id: number; email: string }> {
    const sql = `INSERT INTO accounts (email, created_at) VALUES (?, NOW())`;
    const [result] = await pool.query<ResultSetHeader>(sql, [email]);
    
    return {
      id: result.insertId,
      email,
    };
  }

  /**
   * Create a test campaign with optional progression
   */
  static async createTestCampaign(options: {
    accountId: number;
    name?: string;
    state?: 'active' | 'completed' | 'game_over';
    eventNumber?: number;
    description?: string;
  }): Promise<{ campaign: any; character: any }> {
    const {
      accountId,
      name = 'Test Campaign',
      state = 'active',
      eventNumber = 0,
      description = 'A test campaign',
    } = options;

    // 1. Create campaign
    const campaignSql = `
      INSERT INTO campaigns (account_id, name, description, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const [campaignResult] = await pool.query<ResultSetHeader>(campaignSql, [
      accountId,
      name,
      description,
      state,
    ]);

    const campaignId = campaignResult.insertId;

    // 2. Create default character (Human Warrior)
    const character = await this.createTestCharacter({
      campaignId,
      name: 'Test Hero',
      raceId: 1, // Human
      classId: 1, // Warrior
    });

    // 3. Advance to specific event if needed
    if (eventNumber > 0) {
      for (let i = 1; i <= eventNumber; i++) {
        await this.createTestEvent({
          campaignId,
          eventNumber: i,
          message: `Test event ${i}`,
          eventType: 'exploration',
        });
      }
    }

    return {
      campaign: {
        id: campaignId,
        accountId,
        name,
        description,
        state,
      },
      character,
    };
  }

  /**
   * Create a test character with customizable stats
   */
  static async createTestCharacter(options: {
    campaignId: number;
    name: string;
    raceId: number;
    classId: number;
    currentHealth?: number;
    weaponId?: number | null;
    armourId?: number | null;
    shieldId?: number | null;
  }): Promise<any> {
    const {
      campaignId,
      name,
      raceId,
      classId,
      weaponId = null,
      armourId = null,
      shieldId = null,
    } = options;

    // Get race and class stats
    const [raceRows] = await pool.query('SELECT * FROM races WHERE id = ?', [raceId]);
    const [classRows] = await pool.query('SELECT * FROM classes WHERE id = ?', [classId]);

    if (!Array.isArray(raceRows) || raceRows.length === 0) {
      throw new Error(`Race ${raceId} not found`);
    }
    if (!Array.isArray(classRows) || classRows.length === 0) {
      throw new Error(`Class ${classId} not found`);
    }

    const race = raceRows[0] as any;
    const cls = classRows[0] as any;

    // Calculate base stats
    const maxHealth = race.health + cls.health;
    const attack = race.attack + cls.attack;
    const defense = race.defense + cls.defense;
    const currentHealth = options.currentHealth ?? maxHealth;

    // Insert character
    const sql = `
      INSERT INTO characters (
        campaign_id, name, race_id, class_id,
        current_health, max_health, attack, defense,
        weapon_id, armour_id, shield_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(sql, [
      campaignId,
      name,
      raceId,
      classId,
      currentHealth,
      maxHealth,
      attack,
      defense,
      weaponId,
      armourId,
      shieldId,
    ]);

    return {
      id: result.insertId,
      campaignId,
      name,
      raceId,
      classId,
      currentHealth,
      maxHealth,
      attack,
      defense,
      weaponId,
      armourId,
      shieldId,
    };
  }

  /**
   * Create a test event/log entry
   */
  static async createTestEvent(options: {
    campaignId: number;
    eventNumber: number;
    message: string;
    eventType: string;
    eventData?: any;
  }): Promise<any> {
    const { campaignId, eventNumber, message, eventType, eventData } = options;

    const sql = `
      INSERT INTO logs (campaign_id, event_number, message, event_type, event_data, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.query<ResultSetHeader>(sql, [
      campaignId,
      eventNumber,
      message,
      eventType,
      eventData ? JSON.stringify(eventData) : null,
    ]);

    return {
      id: result.insertId,
      campaignId,
      eventNumber,
      message,
      eventType,
      eventData,
    };
  }

  /**
   * Add items to character inventory
   */
  static async addTestInventoryItem(characterId: number, itemId: number, quantity: number = 1): Promise<void> {
    const sql = `INSERT INTO character_items (character_id, item_id) VALUES (?, ?)`;
    
    for (let i = 0; i < quantity; i++) {
      await pool.query(sql, [characterId, itemId]);
    }
  }

  /**
   * Create a fully-equipped character for testing
   */
  static async createFullyEquippedCharacter(options: {
    campaignId: number;
    name?: string;
  }): Promise<any> {
    const { campaignId, name = 'Equipped Hero' } = options;

    // Create character
    const character = await this.createTestCharacter({
      campaignId,
      name,
      raceId: 1,
      classId: 1,
      weaponId: 1, // Iron Sword
      armourId: 1, // Leather Armour
      shieldId: 1, // Wooden Shield
    });

    // Add some inventory items
    await this.addTestInventoryItem(character.id, 5, 3); // 3 Health Potions
    await this.addTestInventoryItem(character.id, 6, 1); // 1 Attack Elixir

    return character;
  }

  /**
   * Create a character at low health for testing combat
   */
  static async createLowHealthCharacter(options: {
    campaignId: number;
    name?: string;
    currentHealth?: number;
  }): Promise<any> {
    const { campaignId, name = 'Wounded Hero', currentHealth = 10 } = options;

    return await this.createTestCharacter({
      campaignId,
      name,
      raceId: 1,
      classId: 1,
      currentHealth,
    });
  }

  /**
   * Create a campaign at specific game stage
   */
  static async createCampaignAtStage(options: {
    accountId: number;
    stage: 'early' | 'mid' | 'late' | 'boss';
    characterHealth?: number;
  }): Promise<{ campaign: any; character: any }> {
    const { accountId, stage, characterHealth } = options;

    const stageConfig = {
      early: { eventNumber: 5, name: 'Early Game Campaign' },
      mid: { eventNumber: 25, name: 'Mid Game Campaign' },
      late: { eventNumber: 45, name: 'Late Game Campaign' },
      boss: { eventNumber: 60, name: 'Boss Fight Campaign' },
    };

    const config = stageConfig[stage];

    const result = await this.createTestCampaign({
      accountId,
      name: config.name,
      eventNumber: config.eventNumber,
    });

    // Update character health if specified
    if (characterHealth !== undefined) {
      await pool.query('UPDATE characters SET current_health = ? WHERE id = ?', [
        characterHealth,
        result.character.id,
      ]);
      result.character.currentHealth = characterHealth;
    }

    return result;
  }

  /**
   * Clean up test data (use carefully!)
   */
  static async cleanupTestData(campaignId: number): Promise<void> {
    // Delete in correct order to respect FK constraints
    await pool.query('DELETE FROM character_items WHERE character_id IN (SELECT id FROM characters WHERE campaign_id = ?)', [campaignId]);
    await pool.query('DELETE FROM logs WHERE campaign_id = ?', [campaignId]);
    await pool.query('DELETE FROM characters WHERE campaign_id = ?', [campaignId]);
    await pool.query('DELETE FROM campaigns WHERE id = ?', [campaignId]);
  }

  /**
   * Seed database with initial test data (races, classes, weapons, etc.)
   */
  static async seedBaseData(): Promise<void> {
    // This would run the seed.sql file or insert base game data
    // For unit tests, this is typically not needed as we mock the DB
    console.log('Base data seeding not implemented for unit tests (uses mocks)');
  }
}

/**
 * Test Fixtures - Pre-defined test data objects
 */
export const TestFixtures = {
  // Standard test account
  testAccount: {
    id: 1,
    email: 'test@example.com',
  },

  // Test campaigns
  campaigns: {
    active: { id: 1, account_id: 1, name: 'Active Campaign', state: 'active' as const },
    completed: { id: 2, account_id: 1, name: 'Completed Campaign', state: 'completed' as const },
    gameOver: { id: 3, account_id: 1, name: 'Game Over Campaign', state: 'game_over' as const },
  },

  // Test races
  races: {
    human: { id: 1, name: 'Human', health: 20, attack: 5, defense: 3 },
    elf: { id: 2, name: 'Elf', health: 15, attack: 6, defense: 4 },
    dwarf: { id: 3, name: 'Dwarf', health: 25, attack: 4, defense: 6 },
  },

  // Test classes
  classes: {
    warrior: { id: 1, name: 'Warrior', health: 15, attack: 8, defense: 5 },
    mage: { id: 2, name: 'Mage', health: 10, attack: 10, defense: 2 },
    rogue: { id: 3, name: 'Rogue', health: 12, attack: 7, defense: 3 },
  },

  // Test weapons
  weapons: {
    rustySword: { id: 1, name: 'Rusty Sword', rarity: 5, attack: 3 },
    ironSword: { id: 2, name: 'Iron Sword', rarity: 15, attack: 7 },
    steelSword: { id: 3, name: 'Steel Sword', rarity: 25, attack: 12 },
    legendaryBlade: { id: 4, name: 'Legendary Blade', rarity: 50, attack: 20 },
  },

  // Test armours
  armours: {
    leatherArmour: { id: 1, name: 'Leather Armour', rarity: 10, health: 5 },
    chainmail: { id: 2, name: 'Chainmail', rarity: 20, health: 10 },
    plateArmour: { id: 3, name: 'Plate Armour', rarity: 30, health: 15 },
  },

  // Test shields
  shields: {
    woodenShield: { id: 1, name: 'Wooden Shield', rarity: 8, defense: 2 },
    ironShield: { id: 2, name: 'Iron Shield', rarity: 18, defense: 5 },
    steelShield: { id: 3, name: 'Steel Shield', rarity: 28, defense: 8 },
  },

  // Test items
  items: {
    healthPotion: { id: 5, name: 'Health Potion', rarity: 10, stat_modified: 'health', stat_value: 20 },
    attackElixir: { id: 6, name: 'Attack Elixir', rarity: 15, stat_modified: 'attack', stat_value: 5 },
    defensePotion: { id: 7, name: 'Defense Potion', rarity: 12, stat_modified: 'defense', stat_value: 3 },
    rareElixir: { id: 8, name: 'Rare Elixir', rarity: 50, stat_modified: 'attack', stat_value: 10 },
  },

  // Test enemies
  enemies: {
    goblin: { id: 1, name: 'Goblin', difficulty: 5, health: 15, attack: 3, defense: 1 },
    orc: { id: 2, name: 'Orc', difficulty: 15, health: 30, attack: 8, defense: 4 },
    troll: { id: 3, name: 'Troll', difficulty: 25, health: 50, attack: 12, defense: 6 },
    dragon: { id: 4, name: 'Dragon', difficulty: 1000, health: 200, attack: 30, defense: 15 },
  },

  // Test character (Human Warrior)
  defaultCharacter: {
    id: 1,
    campaign_id: 1,
    name: 'Test Hero',
    race_id: 1,
    class_id: 1,
    current_health: 35, // 20 + 15
    max_health: 35,
    attack: 13, // 5 + 8
    defense: 8, // 3 + 5
    weapon_id: null,
    armour_id: null,
    shield_id: null,
  },
};

/**
 * Helper function to create mock ResultSetHeader
 */
export function createMockResultSetHeader(insertId: number = 1): ResultSetHeader {
  return {
    insertId,
    affectedRows: 1,
    fieldCount: 0,
    info: '',
    serverStatus: 0,
    warningStatus: 0,
    changedRows: 0,
  };
}

/**
 * Helper function to generate random test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test.user.${timestamp}.${random}@example.com`;
}

/**
 * Helper function to generate random campaign name
 */
export function generateCampaignName(): string {
  const adjectives = ['Epic', 'Dangerous', 'Mysterious', 'Ancient', 'Forgotten'];
  const nouns = ['Quest', 'Adventure', 'Journey', 'Expedition', 'Campaign'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

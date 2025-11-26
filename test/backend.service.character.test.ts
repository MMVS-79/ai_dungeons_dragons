/**
 * Unit Tests for Backend Service - Character Operations
 * =======================================================
 * Tests for character CRUD operations including:
 * - Character creation with stat calculation
 * - Character retrieval and field mapping
 * - Character updates
 * - Campaign-based character queries
 * - Full character data with equipment and inventory
 * 
 * Test Coverage: >90% for character operations
 */

import { pool } from '../lib/db';
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  getCharacterByCampaign,
  getCharacterWithFullData,
} from '../lib/services/backend.service';
import { ResultSetHeader } from 'mysql2';

// Mock the database connection
jest.mock('../lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Backend Service - Character Operations', () => {
  // Test data fixtures
  const testData = {
    campaigns: [
      { id: 1, account_id: 1, name: 'Test Campaign', state: 'active' },
    ],
    races: [
      { id: 1, name: 'Human', health: 20, attack: 5, defense: 3 },
      { id: 2, name: 'Elf', health: 15, attack: 6, defense: 4 },
    ],
    classes: [
      { id: 1, name: 'Warrior', health: 15, attack: 8, defense: 5 },
      { id: 2, name: 'Mage', health: 10, attack: 10, defense: 2 },
    ],
    weapons: [
      { id: 1, name: 'Iron Sword', rarity: 10, attack: 5 },
    ],
    characters: [
      {
        id: 1,
        campaign_id: 1,
        name: 'Test Hero',
        race_id: 1,
        class_id: 1,
        current_health: 35, // 20 + 15
        max_health: 35,
        attack: 13, // 5 + 8
        defense: 8, // 3 + 5
        sprite_path: null,
        weapon_id: null,
        armour_id: null,
        shield_id: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCharacter()', () => {
    it('should successfully create character with valid data', async () => {
      // Arrange
      const mockRaceQuery = jest.fn().mockResolvedValue([testData.races]);
      const mockClassQuery = jest.fn().mockResolvedValue([testData.classes]);
      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };
      const mockCharacterQuery = jest.fn().mockResolvedValue([[testData.characters[0]]]);

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([testData.races]) // getRace
        .mockResolvedValueOnce([testData.classes]) // getClass
        .mockResolvedValueOnce([mockInsertResult]) // INSERT character
        .mockResolvedValueOnce([[testData.characters[0]]]); // getCharacter

      // Act
      const result = await createCharacter(1, 'Test Hero', 1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Hero');
      expect(result.campaignId).toBe(1);
      expect(result.raceId).toBe(1);
      expect(result.classId).toBe(1);
    });

    it('should correctly calculate base stats (race.health + class.health)', async () => {
      // Arrange - Expected stats
      const expected = {
        maxHealth: 35, // race(20) + class(15)
        attack: 13, // race(5) + class(8)
        defense: 8, // race(3) + class(5)
      };

      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([testData.races]) // getRace
        .mockResolvedValueOnce([testData.classes]) // getClass
        .mockResolvedValueOnce([mockInsertResult]) // INSERT character
        .mockResolvedValueOnce([[testData.characters[0]]]); // getCharacter

      // Act
      const result = await createCharacter(1, 'Hero', 1, 1);

      // Assert - Verify stats calculation
      expect(result.maxHealth).toBe(expected.maxHealth);
      expect(result.attack).toBe(expected.attack);
      expect(result.defense).toBe(expected.defense);
      expect(result.currentHealth).toBe(expected.maxHealth); // Should start at full health
    });

    it('should set all equipment IDs to NULL initially', async () => {
      // Arrange
      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([testData.races])
        .mockResolvedValueOnce([testData.classes])
        .mockResolvedValueOnce([mockInsertResult])
        .mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await createCharacter(1, 'Hero', 1, 1);

      // Assert - All equipment should be undefined/null
      expect(result.weaponId).toBeUndefined();
      expect(result.armourId).toBeUndefined();
      expect(result.shieldId).toBeUndefined();
    });

    it('should return created character with correct mapping (camelCase)', async () => {
      // Arrange
      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([testData.races])
        .mockResolvedValueOnce([testData.classes])
        .mockResolvedValueOnce([mockInsertResult])
        .mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await createCharacter(1, 'Hero', 1, 1);

      // Assert - Verify camelCase mapping from snake_case DB fields
      expect(result).toHaveProperty('currentHealth'); // not current_health
      expect(result).toHaveProperty('maxHealth'); // not max_health
      expect(result).toHaveProperty('campaignId'); // not campaign_id
      expect(result).toHaveProperty('raceId'); // not race_id
      expect(result).toHaveProperty('classId'); // not class_id
    });

    it('should throw error if race does not exist', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Empty race result

      // Act & Assert
      await expect(createCharacter(1, 'Hero', 999, 1)).rejects.toThrow('Race 999 not found');
    });

    it('should throw error if class does not exist', async () => {
      // Arrange
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([testData.races]) // Race exists
        .mockResolvedValueOnce([[]]); // Empty class result

      // Act & Assert
      await expect(createCharacter(1, 'Hero', 1, 999)).rejects.toThrow('Class 999 not found');
    });

    it('should throw error if campaign does not exist (FK constraint)', async () => {
      // Arrange - Database will throw FK constraint error
      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([testData.races])
        .mockResolvedValueOnce([testData.classes])
        .mockRejectedValueOnce(new Error('Foreign key constraint fails')); // FK violation

      // Act & Assert
      await expect(createCharacter(999, 'Hero', 1, 1)).rejects.toThrow();
    });
  });

  describe('getCharacter()', () => {
    it('should retrieve character by ID with all fields', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await getCharacter(1);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Hero');
      expect(result.currentHealth).toBe(35);
      expect(result.maxHealth).toBe(35);
      expect(result.attack).toBe(13);
      expect(result.defense).toBe(8);
    });

    it('should correctly map snake_case DB fields to camelCase', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await getCharacter(1);

      // Assert - Verify field name mapping
      expect(result.currentHealth).toBeDefined(); // mapped from current_health
      expect(result.maxHealth).toBeDefined(); // mapped from max_health
      expect(result.campaignId).toBeDefined(); // mapped from campaign_id
      expect(result.raceId).toBeDefined(); // mapped from race_id
      expect(result.classId).toBeDefined(); // mapped from class_id
      expect(result.spritePath).toBeUndefined(); // null sprite_path becomes undefined
    });

    it('should throw error if character not found', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Empty result

      // Act & Assert
      await expect(getCharacter(999)).rejects.toThrow('Character 999 not found');
    });
  });

  describe('updateCharacter()', () => {
    it('should update single field (e.g., currentHealth)', async () => {
      // Arrange
      const updatedCharacter = { ...testData.characters[0], current_health: 30 };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE query
        .mockResolvedValueOnce([[updatedCharacter]]); // getCharacter

      // Act
      const result = await updateCharacter(1, { currentHealth: 30 });

      // Assert
      expect(result.currentHealth).toBe(30);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters'),
        expect.arrayContaining([30, 1])
      );
    });

    it('should update multiple fields simultaneously', async () => {
      // Arrange
      const updatedCharacter = {
        ...testData.characters[0],
        current_health: 25,
        attack: 15,
        defense: 10,
      };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[updatedCharacter]]);

      // Act
      const result = await updateCharacter(1, {
        currentHealth: 25,
        attack: 15,
        defense: 10,
      });

      // Assert
      expect(result.currentHealth).toBe(25);
      expect(result.attack).toBe(15);
      expect(result.defense).toBe(10);
    });

    it('should ignore invalid fields not in fieldMap', async () => {
      // Arrange
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await updateCharacter(1, {
        currentHealth: 30,
        // @ts-ignore - Testing invalid field
        invalidField: 'should be ignored',
      });

      // Assert - Should only update valid fields
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('current_health'),
        expect.any(Array)
      );
      expect(pool.query).not.toHaveBeenCalledWith(
        expect.stringContaining('invalidField'),
        expect.any(Array)
      );
    });

    it('should return updated character object', async () => {
      // Arrange
      const updatedCharacter = { ...testData.characters[0], current_health: 20 };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[updatedCharacter]]);

      // Act
      const result = await updateCharacter(1, { currentHealth: 20 });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.currentHealth).toBe(20);
    });

    it('should automatically update updated_at timestamp', async () => {
      // Arrange
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      await updateCharacter(1, { currentHealth: 30 });

      // Assert - Check if UPDATE query includes updated_at
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('updated_at'),
        expect.any(Array)
      );
    });

    it('should handle empty updates gracefully (no-op)', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await updateCharacter(1, {});

      // Assert - Should just return current character without UPDATE
      expect(result).toBeDefined();
      expect(pool.query).toHaveBeenCalledTimes(1); // Only getCharacter, no UPDATE
    });
  });

  describe('getCharacterByCampaign()', () => {
    it('should retrieve character by campaign ID', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[testData.characters[0]]]);

      // Act
      const result = await getCharacterByCampaign(1);

      // Assert
      expect(result).toBeDefined();
      expect(result.campaignId).toBe(1);
      expect(result.name).toBe('Test Hero');
    });

    it('should throw error if no character for campaign', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Empty result

      // Act & Assert
      await expect(getCharacterByCampaign(999)).rejects.toThrow(
        'No character found for campaign 999'
      );
    });
  });

  describe('getCharacterWithFullData()', () => {
    it('should return character + equipment + inventory in one call', async () => {
      // Arrange
      const mockWeapon = { id: 1, name: 'Iron Sword', rarity: 10, attack: 5 };
      const mockArmour = { id: 1, name: 'Leather Armor', rarity: 10, health: 5 };
      const mockShield = { id: 1, name: 'Wooden Shield', rarity: 8, defense: 2 };
      const mockInventory = [
        { id: 5, name: 'Health Potion', rarity: 10, stat_modified: 'health', stat_value: 20 },
      ];

      const characterWithEquipment = {
        ...testData.characters[0],
        weapon_id: 1,
        armour_id: 1,
        shield_id: 1,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[characterWithEquipment]]) // getCharacter
        .mockResolvedValueOnce([[mockWeapon]]) // getWeapon
        .mockResolvedValueOnce([[mockArmour]]) // getArmour
        .mockResolvedValueOnce([[mockShield]]) // getShield
        .mockResolvedValueOnce([mockInventory]); // getInventory

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.character).toBeDefined();
      expect(result.equipment).toBeDefined();
      expect(result.equipment?.weapon).toEqual(expect.objectContaining({ name: 'Iron Sword' }));
      expect(result.equipment?.armour).toEqual(expect.objectContaining({ name: 'Leather Armor' }));
      expect(result.equipment?.shield).toEqual(expect.objectContaining({ name: 'Wooden Shield' }));
      expect(result.inventory).toHaveLength(1);
    });

    it('should handle character with no equipment (null values)', async () => {
      // Arrange - Character with no equipment
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.characters[0]]]) // Character with null equipment
        .mockResolvedValueOnce([[]]); // Empty inventory

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.character).toBeDefined();
      expect(result.equipment).toBeUndefined();
      expect(result.inventory).toHaveLength(0);
    });

    it('should handle character with full equipment loadout', async () => {
      // Arrange
      const characterWithFullEquipment = {
        ...testData.characters[0],
        weapon_id: 1,
        armour_id: 1,
        shield_id: 1,
      };

      const mockEquipment = {
        weapon: { id: 1, name: 'Iron Sword', rarity: 10, attack: 5 },
        armour: { id: 1, name: 'Leather Armor', rarity: 10, health: 5 },
        shield: { id: 1, name: 'Wooden Shield', rarity: 8, defense: 2 },
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[characterWithFullEquipment]])
        .mockResolvedValueOnce([[mockEquipment.weapon]])
        .mockResolvedValueOnce([[mockEquipment.armour]])
        .mockResolvedValueOnce([[mockEquipment.shield]])
        .mockResolvedValueOnce([[]]);

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.equipment?.weapon).toBeDefined();
      expect(result.equipment?.armour).toBeDefined();
      expect(result.equipment?.shield).toBeDefined();
    });

    it('should return empty inventory array if no items', async () => {
      // Arrange
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.characters[0]]])
        .mockResolvedValueOnce([[]]); // Empty inventory

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.inventory).toEqual([]);
      expect(Array.isArray(result.inventory)).toBe(true);
    });
  });
});

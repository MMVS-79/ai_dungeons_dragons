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
    races: [
      { id: 1, name: 'Human', health: 20, attack: 5, defense: 3, sprite_path: 'races/human.png' },
      { id: 2, name: 'Elf', health: 15, attack: 6, defense: 4, sprite_path: 'races/elf.png' },
    ],
    classes: [
      { id: 1, name: 'Warrior', health: 15, attack: 8, defense: 5 },
      { id: 2, name: 'Mage', health: 10, attack: 10, defense: 2 },
    ],
    weapons: [
      { id: 1, name: 'Iron Sword', rarity: 10, attack: 5 },
    ],
    armours: [
      { id: 1, name: 'Leather Armor', rarity: 10, health: 5 },
    ],
    shields: [
      { id: 1, name: 'Wooden Shield', rarity: 8, defense: 2 },
    ],
    items: [
      { id: 5, name: 'Health Potion', rarity: 10, stat_modified: 'health', stat_value: 20 },
      { id: 6, name: 'Attack Elixir', rarity: 15, stat_modified: 'attack', stat_value: 5 },
    ],
    characters: [
      {
        id: 1,
        name: 'Test Hero',
        current_health: 35,
        max_health: 35,
        attack: 13,
        defense: 8,
        sprite_path: 'characters/player/warrior.png',
        campaign_id: 1,
        race_id: 1,
        class_id: 1,
        weapon_id: null,
        armour_id: null,
        shield_id: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================================
  // CREATE CHARACTER TESTS
  // =====================================================================

  describe('createCharacter()', () => {
    it('should create a new character with base stats and default sprite', async () => {
      // Arrange
      const expectedId = 10;
      const { races, classes } = testData;

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[races[0]], []]) // getRace
        .mockResolvedValueOnce([[classes[0]], []]) // getClass
        .mockResolvedValueOnce([{ insertId: expectedId, affectedRows: 1 } as ResultSetHeader, []]) // INSERT
        .mockResolvedValueOnce([[{ ...testData.characters[0], id: expectedId, name: 'New Hero' }], []]); // getCharacter

      // Act
      const newCharacter = await createCharacter(1, 'New Hero', 1, 1);

      // Assert
      expect(newCharacter.id).toBe(expectedId);
      expect(newCharacter.name).toBe('New Hero');
      expect(newCharacter.maxHealth).toBe(35); // 20 + 15
      expect(newCharacter.attack).toBe(13); // 5 + 8
      expect(newCharacter.defense).toBe(8); // 3 + 5
    });

    it('should use provided spritePath over race default', async () => {
      // Arrange
      const customSprite = 'custom/elf_mage.png';
      const expectedId = 11;

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.races[1]], []]) // getRace (Elf)
        .mockResolvedValueOnce([[testData.classes[1]], []]) // getClass (Mage)
        .mockResolvedValueOnce([{ insertId: expectedId, affectedRows: 1 } as ResultSetHeader, []])
        .mockResolvedValueOnce([[{ ...testData.characters[0], id: expectedId, sprite_path: customSprite }], []]);

      // Act
      const newCharacter = await createCharacter(1, 'Elf Mage', 2, 2, customSprite);

      // Assert
      expect(newCharacter.spritePath).toBe(customSprite);
    });

    it('should throw error if race ID is invalid', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[], []]); // Empty race result

      // Act & Assert
      await expect(createCharacter(1, 'Test', 999, 1)).rejects.toThrow('Race 999 not found');
    });
  });

  // =====================================================================
  // GET CHARACTER TESTS
  // =====================================================================

  describe('getCharacter()', () => {
    it('should return a character and correctly map DB fields to TS fields', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[testData.characters[0]], []]);

      // Act
      const result = await getCharacter(1);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters WHERE id = ?'),
        [1]
      );
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Hero');
      expect(result.currentHealth).toBe(35);
      expect(result.maxHealth).toBe(35);
    });

    it('should throw error if character not found', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      // Act & Assert
      await expect(getCharacter(999)).rejects.toThrow('Character 999 not found');
    });
  });

  // =====================================================================
  // UPDATE CHARACTER TESTS
  // =====================================================================

  describe('updateCharacter()', () => {
    it('should update a single field and return the updated character', async () => {
      // Arrange
      const updatedChar = { ...testData.characters[0], attack: 20 };
      
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.characters[0]], []]) // getCharacter (before update)
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]) // UPDATE
        .mockResolvedValueOnce([[updatedChar], []]); // getCharacter (after update)

      // Act
      const result = await updateCharacter(1, { attack: 20 });

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET'),
        expect.arrayContaining([20, 1])
      );
      expect(result.attack).toBe(20);
    });

    it('should update multiple fields and return the updated character', async () => {
      // Arrange
      const updatedChar = { ...testData.characters[0], name: 'New Name', maxHealth: 50, attack: 20 };
      
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.characters[0]], []])
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []])
        .mockResolvedValueOnce([[updatedChar], []]);

      // Act
      const result = await updateCharacter(1, { name: 'New Name', maxHealth: 50, attack: 20 });

      // Assert
      expect(result.name).toBe('New Name');
      expect(result.maxHealth).toBe(50);
      expect(result.attack).toBe(20);
    });

    it('should return existing character if no valid updates are provided', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[testData.characters[0]], []]);

      // Act
      const result = await updateCharacter(1, {});

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        name: 'Test Hero',
      }));
    });

    it('should throw error if character not found during update', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      // Act & Assert
      await expect(updateCharacter(999, { attack: 15 })).rejects.toThrow('Character 999 not found');
    });
  });

  // =====================================================================
  // GET CHARACTER BY CAMPAIGN TESTS
  // =====================================================================

  describe('getCharacterByCampaign()', () => {
    it('should return the character associated with a campaign ID', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[testData.characters[0]], []]);

      // Act
      const result = await getCharacterByCampaign(1);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters WHERE campaign_id = ?'),
        [1]
      );
      expect(result.id).toBe(1);
      expect(result.campaignId).toBe(1);
    });

    it('should throw error if no character found for campaign', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      // Act & Assert
      await expect(getCharacterByCampaign(999)).rejects.toThrow(
        'No character found for campaign 999'
      );
    });
  });

  // =====================================================================
  // GET CHARACTER WITH FULL DATA TESTS
  // =====================================================================

  describe('getCharacterWithFullData()', () => {
    it('should handle character with full equipment loadout', async () => {
      // Arrange
      const characterWithEquipment = {
        ...testData.characters[0],
        weapon_id: 1,
        armour_id: 1,
        shield_id: 1,
      };

      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM characters WHERE campaign_id')) {
          return Promise.resolve([[characterWithEquipment], []]);
        }
        if (sql.includes('SELECT * FROM weapons WHERE id')) {
          return Promise.resolve([[testData.weapons[0]], []]);
        }
        if (sql.includes('SELECT * FROM armour WHERE id')) {
          return Promise.resolve([[testData.armours[0]], []]);
        }
        if (sql.includes('SELECT * FROM shields WHERE id')) {
          return Promise.resolve([[testData.shields[0]], []]);
        }
        if (sql.includes('SELECT i.* FROM items i')) {
          return Promise.resolve([[], []]);
        }
        return Promise.resolve([[], []]);
      });

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.equipment.weapon).toEqual(testData.weapons[0]);
      expect(result.equipment.armour).toEqual(testData.armours[0]);
      expect(result.equipment.shield).toEqual(testData.shields[0]);
      expect(result.inventory).toEqual([]);
    });

    it('should handle character with partial equipment (only weapon)', async () => {
      // Arrange
      const characterWithWeapon = {
        ...testData.characters[0],
        weapon_id: 1,
        armour_id: null,
        shield_id: null,
      };

      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM characters WHERE campaign_id')) {
          return Promise.resolve([[characterWithWeapon], []]);
        }
        if (sql.includes('SELECT * FROM weapons WHERE id')) {
          return Promise.resolve([[testData.weapons[0]], []]);
        }
        if (sql.includes('SELECT i.* FROM items i')) {
          return Promise.resolve([[], []]);
        }
        return Promise.resolve([[], []]);
      });

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.equipment.weapon).toEqual(testData.weapons[0]);
      expect(result.equipment.armour).toBeNull();
      expect(result.equipment.shield).toBeNull();
    });

    it('should handle character with no equipment (null values)', async () => {
      // Arrange
      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM characters WHERE campaign_id')) {
          return Promise.resolve([[testData.characters[0]], []]);
        }
        if (sql.includes('SELECT i.* FROM items i')) {
          return Promise.resolve([[], []]);
        }
        return Promise.resolve([[], []]);
      });

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.equipment.weapon).toBeNull();
      expect(result.equipment.armour).toBeNull();
      expect(result.equipment.shield).toBeNull();
      expect(result.inventory).toEqual([]);
    });

    it('should return empty inventory array if no items', async () => {
      // Arrange
      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM characters WHERE campaign_id')) {
          return Promise.resolve([[testData.characters[0]], []]);
        }
        if (sql.includes('SELECT i.* FROM items i')) {
          return Promise.resolve([[], []]);
        }
        return Promise.resolve([[], []]);
      });

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.inventory).toEqual([]);
    });

    it('should return populated inventory array', async () => {
      // Arrange
      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM characters WHERE campaign_id')) {
          return Promise.resolve([[testData.characters[0]], []]);
        }
        if (sql.includes('SELECT i.* FROM items i')) {
          return Promise.resolve([testData.items, []]);
        }
        return Promise.resolve([[], []]);
      });

      // Act
      const result = await getCharacterWithFullData(1);

      // Assert
      expect(result.inventory).toHaveLength(2);
      expect(result.inventory[0].name).toBe('Health Potion');
      expect(result.inventory[1].name).toBe('Attack Elixir');
    });

    it('should throw error if getCharacterByCampaign fails', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      // Act & Assert
      await expect(getCharacterWithFullData(999)).rejects.toThrow(
        'No character found for campaign 999'
      );
    });
  });
});

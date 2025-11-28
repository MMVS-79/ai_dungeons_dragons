/**
 * Unit Tests for Backend Service - Character Operations
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

jest.mock('../lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Backend Service - Character Operations', () => {
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

  describe('createCharacter()', () => {
    it('should create a new character with base stats', async () => {
      const expectedId = 10;

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.races[0]], []]) // getRace
        .mockResolvedValueOnce([[testData.classes[0]], []]) // getClass
        .mockResolvedValueOnce([{ insertId: expectedId, affectedRows: 1 } as ResultSetHeader, []]) // INSERT
        .mockResolvedValueOnce([[{ ...testData.characters[0], id: expectedId, name: 'New Hero' }], []]); // getCharacter

      const result = await createCharacter(1, 'New Hero', 1, 1);

      expect(result.id).toBe(expectedId);
      expect(result.maxHealth).toBe(35);
    });

    it('should throw error if race ID is invalid', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[], []]);

      await expect(createCharacter(1, 'Test', 999, 1)).rejects.toThrow('Race 999 not found');
    });
  });

  describe('getCharacter()', () => {
    it('should return a character', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[testData.characters[0]], []]);

      const result = await getCharacter(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Hero');
    });

    it('should throw error if character not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      await expect(getCharacter(999)).rejects.toThrow('Character 999 not found');
    });
  });

  describe('updateCharacter()', () => {
    it('should update character fields', async () => {
      const updatedChar = { ...testData.characters[0], name: 'Updated Hero', attack: 20 };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[testData.characters[0]], []]) // Initial getCharacter
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]) // UPDATE
        .mockResolvedValueOnce([[updatedChar], []]); // Final getCharacter

      const result = await updateCharacter(1, { name: 'Updated Hero', attack: 20 });

      expect(result.name).toBe('Updated Hero');
      expect(result.attack).toBe(20);
    });

    it('should throw error if character not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      await expect(updateCharacter(999, { attack: 15 })).rejects.toThrow('Character 999 not found');
    });
  });

  describe('getCharacterByCampaign()', () => {
    it('should return character for campaign', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[testData.characters[0]], []]);

      const result = await getCharacterByCampaign(1);

      expect(result.id).toBe(1);
      expect(result.campaignId).toBe(1);
    });

    it('should throw error if no character found', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      await expect(getCharacterByCampaign(999)).rejects.toThrow('No character found for campaign 999');
    });
  });

  describe('getCharacterWithFullData()', () => {
    it('should handle character with full equipment', async () => {
      const charWithEquip = { ...testData.characters[0], weapon_id: 1, armour_id: 1, shield_id: 1 };

      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('characters') && sql.includes('campaign_id')) {
          return Promise.resolve([[charWithEquip], []]);
        }
        if (sql.includes('SELECT') && sql.includes('weapons')) {
          return Promise.resolve([[testData.weapons[0]], []]);
        }
        if (sql.includes('SELECT') && sql.includes('armour')) {
          return Promise.resolve([[testData.armours[0]], []]);
        }
        if (sql.includes('SELECT') && sql.includes('shields')) {
          return Promise.resolve([[testData.shields[0]], []]);
        }
        if (sql.includes('SELECT') && sql.includes('items')) {
          return Promise.resolve([[], []]);
        }
        return Promise.resolve([[], []]);
      });

      const result = await getCharacterWithFullData(1);

      expect(result.equipment.weapon).toEqual(testData.weapons[0]);
      expect(result.equipment.armour).toEqual(testData.armours[0]);
      expect(result.equipment.shield).toEqual(testData.shields[0]);
    });

    it('should handle character with no equipment', async () => {
      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('characters') && sql.includes('campaign_id')) {
          return Promise.resolve([[testData.characters[0]], []]);
        }
        if (sql.includes('SELECT') && sql.includes('items')) {
          return Promise.resolve([[], []]);
        }
        return Promise.resolve([[], []]);
      });

      const result = await getCharacterWithFullData(1);

      expect(result.equipment.weapon).toBeUndefined();
      expect(result.equipment.armour).toBeUndefined();
      expect(result.equipment.shield).toBeUndefined();
    });

    it('should return populated inventory', async () => {
      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('characters') && sql.includes('campaign_id')) {
          return Promise.resolve([[testData.characters[0]], []]);
        }
        if (sql.includes('SELECT') && sql.includes('items')) {
          return Promise.resolve([testData.items, []]);
        }
        return Promise.resolve([[], []]);
      });

      const result = await getCharacterWithFullData(1);

      expect(result.inventory).toHaveLength(2);
    });

    it('should throw error if campaign not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[], []]);

      await expect(getCharacterWithFullData(999)).rejects.toThrow('No character found for campaign 999');
    });
  });
});

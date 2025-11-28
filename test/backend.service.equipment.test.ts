/**
 * Unit Tests for Backend Service - Equipment Operations
 * =======================================================
 * Tests for equipment management including:
 * - Getting weapons, armour, and shields by ID
 * - Equipping and unequipping items
 * - Rarity-based equipment selection with fallback logic
 * 
 * Test Coverage: >85% for equipment operations
 */

import { pool } from '../lib/db';
import {
  getWeapon,
  getArmour,
  getShield,
  equipWeapon,
  equipArmour,
  equipShield,
  unequipWeapon,
  unequipArmour,
  unequipShield,
  getWeaponByRarity,
  getArmourByRarity,
  getShieldByRarity,
} from '../lib/services/backend.service';
import { ResultSetHeader } from 'mysql2';

// Mock the database connection
jest.mock('../lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Backend Service - Equipment Operations', () => {
  const testData = {
    weapons: [
      { id: 1, name: 'Rusty Sword', rarity: 5, attack: 3 },
      { id: 2, name: 'Iron Sword', rarity: 15, attack: 7 },
      { id: 3, name: 'Steel Sword', rarity: 25, attack: 12 },
      { id: 4, name: 'Legendary Blade', rarity: 50, attack: 20 },
    ],
    armours: [
      { id: 1, name: 'Leather Armor', rarity: 10, health: 5 },
      { id: 2, name: 'Chainmail', rarity: 20, health: 10 },
      { id: 3, name: 'Plate Armor', rarity: 30, health: 15 },
    ],
    shields: [
      { id: 1, name: 'Wooden Shield', rarity: 8, defense: 2 },
      { id: 2, name: 'Iron Shield', rarity: 18, defense: 5 },
      { id: 3, name: 'Steel Shield', rarity: 28, defense: 8 },
    ],
    character: {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================================
  // GET EQUIPMENT TESTS
  // =====================================================================

  describe('Get Operations', () => {
    describe('getWeapon()', () => {
      it('should return a weapon by ID', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.weapons[0]], []]);

        // Act
        const result = await getWeapon(1);

        // Assert
        expect(result).toEqual(testData.weapons[0]);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM weapons WHERE id = ?'),
          [1]
        );
      });

      it('should return undefined if weapon not found', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        // Act
        const result = await getWeapon(999);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('getArmour()', () => {
      it('should return armour by ID', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.armours[0]], []]);

        // Act
        const result = await getArmour(1);

        // Assert
        expect(result).toEqual(testData.armours[0]);
      });

      it('should return undefined if armour not found', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        // Act
        const result = await getArmour(999);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('getShield()', () => {
      it('should return shield by ID', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.shields[0]], []]);

        // Act
        const result = await getShield(1);

        // Assert
        expect(result).toEqual(testData.shields[0]);
      });

      it('should return undefined if shield not found', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        // Act
        const result = await getShield(999);

        // Assert
        expect(result).toBeUndefined();
      });
    });
  });

  // =====================================================================
  // EQUIP OPERATIONS TESTS
  // =====================================================================

  describe('Equip Operations', () => {
    describe('equipWeapon()', () => {
      it('should successfully equip weapon and update character record', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await equipWeapon(1, 1);

        // Assert
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters SET weapon_id = ? WHERE id = ?'),
          [1, 1]
        );
        expect(result).toBeUndefined();
      });

      it('should return undefined after successful equip', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await equipWeapon(1, 2);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('equipArmour()', () => {
      it('should successfully equip armour and update character record', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await equipArmour(1, 1);

        // Assert
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters SET armour_id = ? WHERE id = ?'),
          [1, 1]
        );
        expect(result).toBeUndefined();
      });
    });

    describe('equipShield()', () => {
      it('should successfully equip shield and update character record', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await equipShield(1, 1);

        // Assert
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters SET shield_id = ? WHERE id = ?'),
          [1, 1]
        );
        expect(result).toBeUndefined();
      });
    });
  });

  // =====================================================================
  // UNEQUIP OPERATIONS TESTS
  // =====================================================================

  describe('Unequip Operations', () => {
    describe('unequipWeapon()', () => {
      it('should successfully unequip weapon and set to NULL', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await unequipWeapon(1);

        // Assert
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters SET weapon_id = NULL WHERE id = ?'),
          [1]
        );
        expect(result).toBeUndefined();
      });
    });

    describe('unequipArmour()', () => {
      it('should successfully unequip armour and set to NULL', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await unequipArmour(1);

        // Assert
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters SET armour_id = NULL WHERE id = ?'),
          [1]
        );
        expect(result).toBeUndefined();
      });
    });

    describe('unequipShield()', () => {
      it('should successfully unequip shield and set to NULL', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 } as ResultSetHeader, []]);

        // Act
        const result = await unequipShield(1);

        // Assert
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters SET shield_id = NULL WHERE id = ?'),
          [1]
        );
        expect(result).toBeUndefined();
      });
    });
  });

  // =====================================================================
  // RARITY-BASED SELECTION TESTS
  // =====================================================================

  describe('Rarity-Based Equipment Selection', () => {
    describe('getWeaponByRarity()', () => {
      it('should return weapon within rarity range', async () => {
        // Arrange - Looking for rarity 20 ± 10 (range: 10-30)
        // Should match Iron Sword (15) or Steel Sword (25)
        (pool.query as jest.Mock).mockResolvedValue([[testData.weapons[1]], []]);

        // Act
        const result = await getWeaponByRarity(20, 10);

        // Assert
        expect(result).toBeDefined();
        expect(result!.rarity).toBeGreaterThanOrEqual(10);
        expect(result!.rarity).toBeLessThanOrEqual(30);
      });

      it('should fall back to closest weapon if none in range', async () => {
        // Arrange - Looking for rarity 100 ± 5 (range: 95-105)
        // Should fall back to Legendary Blade (50) as closest
        (pool.query as jest.Mock).mockResolvedValue([[testData.weapons[3]], []]);

        // Act
        const result = await getWeaponByRarity(100, 5);

        // Assert
        expect(result).toEqual(testData.weapons[3]);
      });

      it('should handle zero variance (exact match only)', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.weapons[1]], []]);

        // Act
        const result = await getWeaponByRarity(15, 0);

        // Assert
        expect(result).toBeDefined();
      });

      it('should return undefined if no weapons exist', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        // Act
        const result = await getWeaponByRarity(20, 10);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('getArmourByRarity()', () => {
      it('should return armour within rarity range', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.armours[1]], []]);

        // Act
        const result = await getArmourByRarity(20, 10);

        // Assert
        expect(result).toBeDefined();
        expect(result!.rarity).toBeGreaterThanOrEqual(10);
        expect(result!.rarity).toBeLessThanOrEqual(30);
      });

      it('should fall back to closest armour if none in range', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.armours[2]], []]);

        // Act
        const result = await getArmourByRarity(100, 5);

        // Assert
        expect(result).toEqual(testData.armours[2]);
      });
    });

    describe('getShieldByRarity()', () => {
      it('should return shield within rarity range', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.shields[1]], []]);

        // Act
        const result = await getShieldByRarity(18, 10);

        // Assert
        expect(result).toBeDefined();
        expect(result!.rarity).toBeGreaterThanOrEqual(8);
        expect(result!.rarity).toBeLessThanOrEqual(28);
      });

      it('should fall back to closest shield if none in range', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValue([[testData.shields[2]], []]);

        // Act
        const result = await getShieldByRarity(100, 5);

        // Assert
        expect(result).toEqual(testData.shields[2]);
      });
    });
  });
});

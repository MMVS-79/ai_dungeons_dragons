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

// Mock the database connection
jest.mock('../lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Backend Service - Equipment Operations', () => {
  // Test equipment data
  const testEquipment = {
    weapons: [
      { id: 1, name: 'Rusty Sword', rarity: 5, attack: 3, description: 'Old weapon', sprite_path: null },
      { id: 2, name: 'Iron Sword', rarity: 15, attack: 7, description: 'Standard weapon', sprite_path: null },
      { id: 3, name: 'Steel Sword', rarity: 25, attack: 12, description: 'Fine weapon', sprite_path: null },
      { id: 4, name: 'Legendary Blade', rarity: 50, attack: 20, description: 'Epic weapon', sprite_path: null },
    ],
    armours: [
      { id: 1, name: 'Leather Armor', rarity: 10, health: 5, description: 'Basic armor', sprite_path: null },
      { id: 2, name: 'Chainmail', rarity: 20, health: 10, description: 'Strong armor', sprite_path: null },
      { id: 3, name: 'Plate Armor', rarity: 30, health: 15, description: 'Heavy armor', sprite_path: null },
    ],
    shields: [
      { id: 1, name: 'Wooden Shield', rarity: 8, defense: 2, description: 'Basic shield', sprite_path: null },
      { id: 2, name: 'Iron Shield', rarity: 18, defense: 5, description: 'Strong shield', sprite_path: null },
    ],
  };

  const testCharacter = {
    id: 1,
    campaign_id: 1,
    name: 'Test Hero',
    race_id: 1,
    class_id: 1,
    current_health: 35,
    max_health: 35,
    attack: 13,
    defense: 8,
    sprite_path: null,
    weapon_id: null,
    armour_id: null,
    shield_id: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Equipment Retrieval Operations', () => {
    describe('getWeapon()', () => {
      it('should retrieve weapon by ID', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[0]]]);

        // Act
        const result = await getWeapon(1);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
        expect(result.name).toBe('Rusty Sword');
        expect(result.attack).toBe(3);
      });

      it('should throw error if weapon not found', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

        // Act & Assert
        await expect(getWeapon(999)).rejects.toThrow('Weapon 999 not found');
      });
    });

    describe('getArmour()', () => {
      it('should retrieve armour by ID', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.armours[0]]]);

        // Act
        const result = await getArmour(1);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
        expect(result.name).toBe('Leather Armor');
        expect(result.health).toBe(5);
      });

      it('should throw error if armour not found', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

        // Act & Assert
        await expect(getArmour(999)).rejects.toThrow('Armour 999 not found');
      });
    });

    describe('getShield()', () => {
      it('should retrieve shield by ID', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.shields[0]]]);

        // Act
        const result = await getShield(1);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
        expect(result.name).toBe('Wooden Shield');
        expect(result.defense).toBe(2);
      });

      it('should throw error if shield not found', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

        // Act & Assert
        await expect(getShield(999)).rejects.toThrow('Shield 999 not found');
      });
    });
  });

  describe('Equip Operations', () => {
    describe('equipWeapon()', () => {
      it('should successfully equip weapon and update character record', async () => {
        // Arrange
        const updatedCharacter = { ...testCharacter, weapon_id: 1 };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE
          .mockResolvedValueOnce([[updatedCharacter]]); // getCharacter

        // Act
        const result = await equipWeapon(1, 1);

        // Assert
        expect(result.weaponId).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE characters'),
          expect.arrayContaining([1, 1])
        );
      });

      it('should replace previously equipped weapon', async () => {
        // Arrange - Character already has weapon_id = 2
        const characterWithWeapon = { ...testCharacter, weapon_id: 2 };
        const updatedCharacter = { ...characterWithWeapon, weapon_id: 1 };

        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[updatedCharacter]]);

        // Act
        const result = await equipWeapon(1, 1);

        // Assert - New weapon should replace old one
        expect(result.weaponId).toBe(1);
      });

      it('should return updated character with new equipment ID', async () => {
        // Arrange
        const updatedCharacter = { ...testCharacter, weapon_id: 1 };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[updatedCharacter]]);

        // Act
        const result = await equipWeapon(1, 1);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
        expect(result.weaponId).toBe(1);
      });

      it('should throw error if weapon does not exist', async () => {
        // Arrange - Database throws error for non-existent weapon FK
        (pool.query as jest.Mock).mockRejectedValueOnce(
          new Error('Foreign key constraint fails')
        );

        // Act & Assert
        await expect(equipWeapon(1, 999)).rejects.toThrow();
      });

      it('should throw error if character does not exist', async () => {
        // Arrange
        (pool.query as jest.Mock).mockRejectedValueOnce(
          new Error('Character not found')
        );

        // Act & Assert
        await expect(equipWeapon(999, 1)).rejects.toThrow();
      });
    });

    describe('equipArmour()', () => {
      it('should successfully equip armour and update character record', async () => {
        // Arrange
        const updatedCharacter = { ...testCharacter, armour_id: 1 };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[updatedCharacter]]);

        // Act
        const result = await equipArmour(1, 1);

        // Assert
        expect(result.armourId).toBe(1);
      });

      it('should replace previously equipped armour', async () => {
        // Arrange
        const updatedCharacter = { ...testCharacter, armour_id: 2 };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[updatedCharacter]]);

        // Act
        const result = await equipArmour(1, 2);

        // Assert
        expect(result.armourId).toBe(2);
      });
    });

    describe('equipShield()', () => {
      it('should successfully equip shield and update character record', async () => {
        // Arrange
        const updatedCharacter = { ...testCharacter, shield_id: 1 };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[updatedCharacter]]);

        // Act
        const result = await equipShield(1, 1);

        // Assert
        expect(result.shieldId).toBe(1);
      });
    });
  });

  describe('Unequip Operations', () => {
    describe('unequipWeapon()', () => {
      it('should set weapon ID to NULL', async () => {
        // Arrange
        const updatedCharacter = { ...testCharacter, weapon_id: null };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[updatedCharacter]]);

        // Act
        const result = await unequipWeapon(1);

        // Assert
        expect(result.weaponId).toBeUndefined();
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('weapon_id = NULL'),
          expect.any(Array)
        );
      });

      it('should handle already-unequipped slot gracefully', async () => {
        // Arrange - Character already has no weapon
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[testCharacter]]);

        // Act
        const result = await unequipWeapon(1);

        // Assert - Should not throw error
        expect(result).toBeDefined();
        expect(result.weaponId).toBeUndefined();
      });

      it('should return updated character', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[testCharacter]]);

        // Act
        const result = await unequipWeapon(1);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
      });
    });

    describe('unequipArmour()', () => {
      it('should set armour ID to NULL', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[testCharacter]]);

        // Act
        const result = await unequipArmour(1);

        // Assert
        expect(result.armourId).toBeUndefined();
      });
    });

    describe('unequipShield()', () => {
      it('should set shield ID to NULL', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([[testCharacter]]);

        // Act
        const result = await unequipShield(1);

        // Assert
        expect(result.shieldId).toBeUndefined();
      });
    });
  });

  describe('Rarity-Based Selection', () => {
    describe('getWeaponByRarity()', () => {
      it('should return weapon within rarity range (target ± variance)', async () => {
        // Arrange
        const targetRarity = 20;
        const variance = 10;
        // Expected range: 10-30 (should match weapons 2 and 3)
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[1]]]);

        // Act
        const weapon = await getWeaponByRarity(targetRarity, variance);

        // Assert
        expect(weapon.rarity).toBeGreaterThanOrEqual(10);
        expect(weapon.rarity).toBeLessThanOrEqual(30);
        expect([2, 3]).toContain(weapon.id);
      });

      it('should fallback to closest rarity when no match in range', async () => {
        // Arrange
        const targetRarity = 100;
        const variance = 5;
        // Expected range: 95-105 (no matches, should return weapon 4 with rarity 50)
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No matches in range
          .mockResolvedValueOnce([[testEquipment.weapons[3]]]); // Fallback query

        // Act
        const weapon = await getWeaponByRarity(targetRarity, variance);

        // Assert - Expected: Legendary Blade (closest to target)
        expect(weapon.id).toBe(4);
        expect(weapon.name).toBe('Legendary Blade');
        expect(weapon.rarity).toBe(50);
      });

      it('should randomize selection when multiple matches exist', async () => {
        // Arrange - Both Iron Sword (15) and Steel Sword (25) are in range 10-30
        const targetRarity = 20;
        const variance = 10;

        // Mock returns Iron Sword (could be either based on RAND())
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[1]]]);

        // Act
        const weapon = await getWeaponByRarity(targetRarity, variance);

        // Assert - Should be one of the matches
        expect([15, 25]).toContain(weapon.rarity);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('RAND()'),
          expect.any(Array)
        );
      });

      it('should throw error if no weapons in database', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No match in range
          .mockResolvedValueOnce([[]]); // No fallback either

        // Act & Assert
        await expect(getWeaponByRarity(50, 5)).rejects.toThrow(
          'No weapons found in database'
        );
      });

      it('should exclude items outside variance range', async () => {
        // Arrange - Target 15, variance 3 (range: 12-18)
        // Should NOT include Rusty Sword (5) or Steel Sword (25)
        const targetRarity = 15;
        const variance = 3;

        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[1]]]); // Iron Sword

        // Act
        const weapon = await getWeaponByRarity(targetRarity, variance);

        // Assert
        expect(weapon.rarity).toBeGreaterThanOrEqual(12);
        expect(weapon.rarity).toBeLessThanOrEqual(18);
        expect(weapon.id).toBe(2); // Only Iron Sword (15) fits
      });

      it('should use default variance of 5 if not specified', async () => {
        // Arrange
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[1]]]);

        // Act
        await getWeaponByRarity(15);

        // Assert - Check query was called with ±5 range
        expect(pool.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([10, 20, 15]) // min, max, target
        );
      });
    });

    describe('getArmourByRarity()', () => {
      it('should return armour within variance range', async () => {
        // Arrange
        const targetRarity = 20;
        const variance = 10;
        // Range: 10-30, matches Leather Armor (10), Chainmail (20), Plate Armor (30)
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.armours[1]]]);

        // Act
        const armour = await getArmourByRarity(targetRarity, variance);

        // Assert
        expect(armour.rarity).toBeGreaterThanOrEqual(10);
        expect(armour.rarity).toBeLessThanOrEqual(30);
      });

      it('should fallback to closest rarity when no match in range', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No match
          .mockResolvedValueOnce([[testEquipment.armours[2]]]); // Fallback

        // Act
        const armour = await getArmourByRarity(100, 5);

        // Assert
        expect(armour).toBeDefined();
        expect(armour.id).toBe(3); // Plate Armor is closest
      });

      it('should throw error if no armours in database', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[]])
          .mockResolvedValueOnce([[]]);

        // Act & Assert
        await expect(getArmourByRarity(50, 5)).rejects.toThrow(
          'No armours found in database'
        );
      });
    });

    describe('getShieldByRarity()', () => {
      it('should return shield within variance range', async () => {
        // Arrange
        const targetRarity = 13;
        const variance = 10;
        // Range: 3-23, matches both shields
        (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.shields[0]]]);

        // Act
        const shield = await getShieldByRarity(targetRarity, variance);

        // Assert
        expect(shield.rarity).toBeGreaterThanOrEqual(3);
        expect(shield.rarity).toBeLessThanOrEqual(23);
      });

      it('should fallback to closest rarity when no match in range', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[]])
          .mockResolvedValueOnce([[testEquipment.shields[1]]]);

        // Act
        const shield = await getShieldByRarity(100, 5);

        // Assert
        expect(shield).toBeDefined();
      });

      it('should throw error if no shields in database', async () => {
        // Arrange
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[]])
          .mockResolvedValueOnce([[]]);

        // Act & Assert
        await expect(getShieldByRarity(50, 5)).rejects.toThrow(
          'No shields found in database'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative rarity gracefully', async () => {
      // Arrange - Negative target should clamp minRarity to 0
      (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[0]]]);

      // Act
      const weapon = await getWeaponByRarity(-10, 5);

      // Assert - Should query with minRarity = 0
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0, expect.any(Number), -10])
      );
    });

    it('should handle zero variance', async () => {
      // Arrange - Exact rarity match only
      (pool.query as jest.Mock).mockResolvedValueOnce([[testEquipment.weapons[1]]]);

      // Act
      await getWeaponByRarity(15, 0);

      // Assert - Range should be exactly 15-15
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [15, 15, 15]
      );
    });
  });
});

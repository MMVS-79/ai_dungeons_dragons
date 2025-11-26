/**
 * Unit Tests for Backend Service - Inventory Operations
 * =======================================================
 * Tests for inventory management including:
 * - Getting inventory for a character
 * - Adding items to inventory (with stacking)
 * - Removing items from inventory (single instance only)
 * - Rarity-based item selection
 * 
 * CRITICAL: Tests verify item stacking behavior where:
 * - Same item added multiple times creates multiple rows
 * - Removal deletes ONLY ONE instance (not all)
 */

import { pool } from '../lib/db';
import {
  getInventory,
  addItemToInventory,
  removeItemFromInventory,
  getItemByRarity,
} from '../lib/services/backend.service';
import { ResultSetHeader } from 'mysql2';

// Mock the database connection
jest.mock('../lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Backend Service - Inventory Operations', () => {
  // Test item data
  const testItems = {
    items: [
      {
        id: 5,
        name: 'Health Potion',
        rarity: 10,
        stat_modified: 'health',
        stat_value: 20,
        description: 'Restores health',
        sprite_path: null,
      },
      {
        id: 6,
        name: 'Attack Elixir',
        rarity: 15,
        stat_modified: 'attack',
        stat_value: 5,
        description: 'Boosts attack',
        sprite_path: null,
      },
      {
        id: 7,
        name: 'Defense Potion',
        rarity: 12,
        stat_modified: 'defense',
        stat_value: 3,
        description: 'Boosts defense',
        sprite_path: null,
      },
      {
        id: 8,
        name: 'Rare Elixir',
        rarity: 50,
        stat_modified: 'attack',
        stat_value: 10,
        description: 'Very rare',
        sprite_path: null,
      },
    ],
  };

  const characterId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventory()', () => {
    it('should retrieve all items for a character', async () => {
      // Arrange - Character has 2 different items
      const mockInventory = [testItems.items[0], testItems.items[1]];
      (pool.query as jest.Mock).mockResolvedValueOnce([mockInventory]);

      // Act
      const result = await getInventory(characterId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Health Potion');
      expect(result[1].name).toBe('Attack Elixir');
    });

    it('should return empty array if character has no items', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      // Act
      const result = await getInventory(characterId);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should correctly map database fields to camelCase', async () => {
      // Arrange
      const mockInventory = [testItems.items[0]];
      (pool.query as jest.Mock).mockResolvedValueOnce([mockInventory]);

      // Act
      const result = await getInventory(characterId);

      // Assert - Verify field mapping
      expect(result[0]).toHaveProperty('statModified'); // not stat_modified
      expect(result[0]).toHaveProperty('statValue'); // not stat_value
      expect(result[0]).toHaveProperty('spritePath'); // not sprite_path
    });

    it('should include all item properties', async () => {
      // Arrange
      const mockInventory = [testItems.items[0]];
      (pool.query as jest.Mock).mockResolvedValueOnce([mockInventory]);

      // Act
      const result = await getInventory(characterId);

      // Assert
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('rarity');
      expect(result[0]).toHaveProperty('statModified');
      expect(result[0]).toHaveProperty('statValue');
      expect(result[0]).toHaveProperty('description');
    });
  });

  describe('addItemToInventory()', () => {
    it('should successfully add item to inventory', async () => {
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
      (pool.query as jest.Mock).mockResolvedValueOnce([mockInsertResult]);

      // Act
      await addItemToInventory(characterId, 5);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO character_items'),
        [characterId, 5]
      );
    });

    it('should create new row each time same item is added', async () => {
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
        .mockResolvedValueOnce([mockInsertResult]) // First add
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 2 }]) // Second add
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 3 }]); // Third add

      // Act - Add same item 3 times
      await addItemToInventory(characterId, 5);
      await addItemToInventory(characterId, 5);
      await addItemToInventory(characterId, 5);

      // Assert - Should be called 3 times (not updating count)
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('should throw error if item does not exist', async () => {
      // Arrange - FK constraint error
      (pool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Foreign key constraint fails')
      );

      // Act & Assert
      await expect(addItemToInventory(characterId, 999)).rejects.toThrow();
    });

    it('should throw error if character does not exist', async () => {
      // Arrange
      (pool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Foreign key constraint fails')
      );

      // Act & Assert
      await expect(addItemToInventory(999, 5)).rejects.toThrow();
    });
  });

  describe('removeItemFromInventory()', () => {
    it('should remove only ONE item instance', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Act
      await removeItemFromInventory(characterId, 5);

      // Assert - Check query includes LIMIT 1
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
        [characterId, 5]
      );
    });

    it('should handle character with no items gracefully', async () => {
      // Arrange - No rows affected
      (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Act & Assert - Should not throw
      await expect(removeItemFromInventory(characterId, 5)).resolves.not.toThrow();
    });

    it('should handle removing non-existent item gracefully', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Act & Assert
      await expect(removeItemFromInventory(characterId, 999)).resolves.not.toThrow();
    });

    it('should delete from character_items table', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Act
      await removeItemFromInventory(characterId, 5);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM character_items'),
        expect.any(Array)
      );
    });
  });

  describe('Item Stacking Behavior', () => {
    it('should support item stacking (multiple rows for same item)', async () => {
      // Arrange - Setup: Add potion 3 times
      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };

      const itemId = 5; // Health Potion

      // Mock for adding items
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockInsertResult])
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 2 }])
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 3 }])
        // Mock for getting inventory - 3 copies of same item
        .mockResolvedValueOnce([
          [
            testItems.items[0], // Health Potion #1
            testItems.items[0], // Health Potion #2
            testItems.items[0], // Health Potion #3
          ],
        ]);

      // Act - Add potion 3 times
      await addItemToInventory(characterId, itemId);
      await addItemToInventory(characterId, itemId);
      await addItemToInventory(characterId, itemId);

      // Get inventory to verify
      const inventory = await getInventory(characterId);
      const potionCount = inventory.filter((i) => i.id === itemId).length;

      // Assert - Expected: 3 rows in character_items with same item_id
      expect(potionCount).toBe(3);
      expect(inventory).toHaveLength(3);
    });

    it('should remove only ONE item instance when character has multiple', async () => {
      // Arrange - Setup: Character has 3 health potions
      const itemId = 5;

      // Mock removal of one potion
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Remove one
        // Mock inventory check - now has 2 potions
        .mockResolvedValueOnce([
          [
            testItems.items[0], // Health Potion #1
            testItems.items[0], // Health Potion #2
          ],
        ]);

      // Act - Remove one potion
      await removeItemFromInventory(characterId, itemId);

      // Verify remaining count
      const inventory = await getInventory(characterId);
      const remaining = inventory.filter((i) => i.id === itemId).length;

      // Assert - Should have 2 potions left (not 0!)
      expect(remaining).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
        expect.any(Array)
      );
    });

    it('should allow removing last instance of stacked item', async () => {
      // Arrange - Character has only 1 potion left
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Remove last one
        .mockResolvedValueOnce([[]]); // Inventory now empty

      // Act
      await removeItemFromInventory(characterId, 5);
      const inventory = await getInventory(characterId);

      // Assert
      expect(inventory).toHaveLength(0);
    });

    it('should handle mixed stacked and unique items', async () => {
      // Arrange - Character has:
      // - 3x Health Potion (id: 5)
      // - 1x Attack Elixir (id: 6)
      // - 2x Defense Potion (id: 7)
      const mockInventory = [
        testItems.items[0], // Health Potion #1
        testItems.items[0], // Health Potion #2
        testItems.items[0], // Health Potion #3
        testItems.items[1], // Attack Elixir
        testItems.items[2], // Defense Potion #1
        testItems.items[2], // Defense Potion #2
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockInventory]);

      // Act
      const inventory = await getInventory(characterId);

      // Assert
      expect(inventory).toHaveLength(6); // 6 total rows
      expect(inventory.filter((i) => i.id === 5)).toHaveLength(3); // 3 health potions
      expect(inventory.filter((i) => i.id === 6)).toHaveLength(1); // 1 attack elixir
      expect(inventory.filter((i) => i.id === 7)).toHaveLength(2); // 2 defense potions
    });
  });

  describe('getItemByRarity()', () => {
    it('should return item within rarity range', async () => {
      // Arrange
      const targetRarity = 15;
      const variance = 5;
      // Expected range: 10-20 (should match items 5, 6, 7)
      (pool.query as jest.Mock).mockResolvedValueOnce([[testItems.items[1]]]);

      // Act
      const item = await getItemByRarity(targetRarity, variance);

      // Assert
      expect(item.rarity).toBeGreaterThanOrEqual(10);
      expect(item.rarity).toBeLessThanOrEqual(20);
      expect([5, 6, 7]).toContain(item.id);
    });

    it('should fallback to closest rarity when no match in range', async () => {
      // Arrange
      const targetRarity = 100;
      const variance = 5;
      // Expected range: 95-105 (no matches, should fallback to item 8 with rarity 50)
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[]]) // No matches in range
        .mockResolvedValueOnce([[testItems.items[3]]]); // Fallback

      // Act
      const item = await getItemByRarity(targetRarity, variance);

      // Assert
      expect(item.id).toBe(8);
      expect(item.name).toBe('Rare Elixir');
      expect(item.rarity).toBe(50);
    });

    it('should randomize selection when multiple matches exist', async () => {
      // Arrange - Items 5, 6, 7 all in range 10-20
      (pool.query as jest.Mock).mockResolvedValueOnce([[testItems.items[0]]]);

      // Act
      const item = await getItemByRarity(15, 5);

      // Assert
      expect([10, 12, 15]).toContain(item.rarity);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('RAND()'),
        expect.any(Array)
      );
    });

    it('should throw error if no items in database', async () => {
      // Arrange
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[]]) // No match in range
        .mockResolvedValueOnce([[]]); // No fallback either

      // Act & Assert
      await expect(getItemByRarity(50, 5)).rejects.toThrow('No items found in database');
    });

    it('should use default variance of 5 if not specified', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[testItems.items[0]]]);

      // Act
      await getItemByRarity(15);

      // Assert - Check query was called with ±5 range
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([10, 20, 15]) // min, max, target
      );
    });

    it('should clamp negative rarity to 0', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValueOnce([[testItems.items[0]]]);

      // Act
      await getItemByRarity(-10, 5);

      // Assert - minRarity should be 0
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0, expect.any(Number), -10])
      );
    });
  });

  describe('Integration: Full Inventory Workflow', () => {
    it('should handle complete add -> stack -> remove workflow', async () => {
      // This test demonstrates the complete inventory lifecycle
      const itemId = 5;
      const mockInsertResult: ResultSetHeader = {
        insertId: 1,
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0,
      };

      // Mock sequence:
      // 1. Add item twice
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockInsertResult]) // Add #1
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 2 }]) // Add #2
        // 2. Check inventory (2 items)
        .mockResolvedValueOnce([[testItems.items[0], testItems.items[0]]])
        // 3. Remove one
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        // 4. Check inventory (1 item left)
        .mockResolvedValueOnce([[testItems.items[0]]]);

      // Act
      await addItemToInventory(characterId, itemId);
      await addItemToInventory(characterId, itemId);

      let inventory = await getInventory(characterId);
      expect(inventory).toHaveLength(2);

      await removeItemFromInventory(characterId, itemId);

      inventory = await getInventory(characterId);
      expect(inventory).toHaveLength(1);
    });

    it('should maintain inventory integrity after multiple operations', async () => {
      // Arrange - Complex scenario
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
        // Add 2 health potions
        .mockResolvedValueOnce([mockInsertResult])
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 2 }])
        // Add 1 attack elixir
        .mockResolvedValueOnce([{ ...mockInsertResult, insertId: 3 }])
        // Remove 1 health potion
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        // Final inventory: 1 health potion + 1 attack elixir
        .mockResolvedValueOnce([[testItems.items[0], testItems.items[1]]]);

      // Act
      await addItemToInventory(characterId, 5); // Health Potion
      await addItemToInventory(characterId, 5); // Health Potion
      await addItemToInventory(characterId, 6); // Attack Elixir
      await removeItemFromInventory(characterId, 5); // Remove 1 Health Potion

      const finalInventory = await getInventory(characterId);

      // Assert
      expect(finalInventory).toHaveLength(2);
      expect(finalInventory.filter((i) => i.id === 5)).toHaveLength(1);
      expect(finalInventory.filter((i) => i.id === 6)).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      (pool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(getInventory(characterId)).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed item data', async () => {
      // Arrange - Missing required fields
      const malformedItem = {
        id: 1,
        // Missing name, rarity, etc.
      };
      (pool.query as jest.Mock).mockResolvedValueOnce([[malformedItem]]);

      // Act
      const inventory = await getInventory(characterId);

      // Assert - Should still return array, even with bad data
      expect(Array.isArray(inventory)).toBe(true);
    });
  });
});

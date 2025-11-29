/**
 * Unit Tests for Backend Service - Equipment Operations
 */

import { pool } from "../lib/db";
import {
  getWeapon,
  getArmour,
  getShield,
  equipWeapon,
  equipArmour,
  equipShield,
  getWeaponByRarity,
  getArmourByRarity,
  getShieldByRarity,
} from "../lib/services/backend.service";
import { ResultSetHeader } from "mysql2";

jest.mock("../lib/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("Backend Service - Equipment Operations", () => {
  const testData = {
    weapons: [
      { id: 1, name: "Rusty Sword", rarity: 5, attack: 3 },
      { id: 2, name: "Iron Sword", rarity: 15, attack: 7 },
      { id: 3, name: "Steel Sword", rarity: 25, attack: 12 },
      { id: 4, name: "Legendary Blade", rarity: 50, attack: 20 },
    ],
    armours: [
      { id: 1, name: "Leather Armour", rarity: 10, health: 5 },
      { id: 2, name: "Chainmail", rarity: 20, health: 10 },
      { id: 3, name: "Plate Armour", rarity: 30, health: 15 },
    ],
    shields: [
      { id: 1, name: "Wooden Shield", rarity: 8, defense: 2 },
      { id: 2, name: "Iron Shield", rarity: 18, defense: 5 },
      { id: 3, name: "Steel Shield", rarity: 28, defense: 8 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Get Operations", () => {
    describe("getWeapon()", () => {
      it("should return a weapon by ID", async () => {
        (pool.query as jest.Mock).mockResolvedValue([
          [testData.weapons[0]],
          [],
        ]);

        const result = await getWeapon(1);

        expect(result).toEqual(testData.weapons[0]);
      });

      it("should throw error if weapon not found", async () => {
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        await expect(getWeapon(999)).rejects.toThrow("Weapon 999 not found");
      });
    });

    describe("getArmour()", () => {
      it("should return armour by ID", async () => {
        (pool.query as jest.Mock).mockResolvedValue([
          [testData.armours[0]],
          [],
        ]);

        const result = await getArmour(1);

        expect(result).toEqual(testData.armours[0]);
      });

      it("should throw error if armour not found", async () => {
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        await expect(getArmour(999)).rejects.toThrow("Armour 999 not found");
      });
    });

    describe("getShield()", () => {
      it("should return shield by ID", async () => {
        (pool.query as jest.Mock).mockResolvedValue([
          [testData.shields[0]],
          [],
        ]);

        const result = await getShield(1);

        expect(result).toEqual(testData.shields[0]);
      });

      it("should throw error if shield not found", async () => {
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        await expect(getShield(999)).rejects.toThrow("Shield 999 not found");
      });
    });
  });

  describe("Equip Operations", () => {
    describe("equipWeapon()", () => {
      it("should successfully equip non-legendary weapon", async () => {
        
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[testData.weapons[0]], []])
          .mockResolvedValueOnce([[{ id: 1, weapon_id: null }], []])
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]);

        await equipWeapon(1, 1);

        expect(pool.query).toHaveBeenCalledTimes(3);
      });

      it("should not replace legendary weapon with non-legendary", async () => {
        const legendaryWeapon = {
          id: 99,
          name: "Zeus Lightning",
          rarity: 700,
          attack: 50,
        };

        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[testData.weapons[0]], []])
          .mockResolvedValueOnce([[{ id: 1, weapon_id: 99 }], []])
          .mockResolvedValueOnce([[legendaryWeapon], []]);

        await equipWeapon(1, 1);

        expect(pool.query).toHaveBeenCalledTimes(3);
        expect(pool.query).not.toHaveBeenCalledWith(
          expect.stringContaining("UPDATE characters SET weapon_id"),
          expect.anything()
        );
      });

      it("should allow equipping legendary weapon", async () => {
        const legendaryWeapon = {
          id: 99,
          name: "Zeus Lightning",
          rarity: 700,
          attack: 50,
        };

        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[legendaryWeapon], []])
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]);

        await equipWeapon(1, 99);

        expect(pool.query).toHaveBeenCalledTimes(2);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE characters SET weapon_id"),
          [99, 1]
        );
      });
    });

    describe("equipArmour()", () => {
      it("should successfully equip non-legendary armour", async () => {
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[testData.armours[0]], []])
          .mockResolvedValueOnce([[{ id: 1, armour_id: null }], []])
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]);

        await equipArmour(1, 1);

        expect(pool.query).toHaveBeenCalledTimes(3);
      });

      it("should not replace legendary armour with non-legendary", async () => {
        const legendaryArmour = {
          id: 99,
          name: "Santa's Robe",
          rarity: 300,
          health: 250,
        };

        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[testData.armours[0]], []])
          .mockResolvedValueOnce([[{ id: 1, armour_id: 99 }], []])
          .mockResolvedValueOnce([[legendaryArmour], []]);

        await equipArmour(1, 1);

        expect(pool.query).toHaveBeenCalledTimes(3);
        expect(pool.query).not.toHaveBeenCalledWith(
          expect.stringContaining("UPDATE characters SET armour_id"),
          expect.anything()
        );
      });
    });

    describe("equipShield()", () => {
      it("should successfully equip non-legendary shield", async () => {
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[testData.shields[0]], []])
          .mockResolvedValueOnce([[{ id: 1, shield_id: null }], []])
          .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []]);

        await equipShield(1, 1);

        expect(pool.query).toHaveBeenCalledTimes(3);
      });

      it("should not replace legendary shield with non-legendary", async () => {
        const legendaryShield = {
          id: 99,
          name: "Genie's Shield",
          rarity: 500,
          defense: 50,
        };

        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[testData.shields[0]], []])
          .mockResolvedValueOnce([[{ id: 1, shield_id: 99 }], []])
          .mockResolvedValueOnce([[legendaryShield], []]);

        await equipShield(1, 1);

        expect(pool.query).toHaveBeenCalledTimes(3);
        expect(pool.query).not.toHaveBeenCalledWith(
          expect.stringContaining("UPDATE characters SET shield_id"),
          expect.anything()
        );
      });
    });
  });

  describe("Rarity-Based Equipment Selection", () => {
    describe("getWeaponByRarity()", () => {
      it("should return weapon within rarity range", async () => {
        (pool.query as jest.Mock).mockResolvedValue([
          [testData.weapons[1]],
          [],
        ]);

        const result = await getWeaponByRarity(20, 10);

        expect(result).toBeDefined();
        expect(result!.rarity).toBeGreaterThanOrEqual(10);
        expect(result!.rarity).toBeLessThanOrEqual(30);
      });

      it("should fall back to closest weapon if none in range", async () => {
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[], []]) // No weapons in range
          .mockResolvedValueOnce([[testData.weapons[3]], []]); // Fallback query

        const result = await getWeaponByRarity(100, 5);

        expect(result).toEqual(testData.weapons[3]);
      });

      it("should throw error if no weapons exist", async () => {
        (pool.query as jest.Mock).mockResolvedValue([[], []]);

        await expect(getWeaponByRarity(20, 10)).rejects.toThrow(
          "No weapons found in database"
        );
      });
    });

    describe("getArmourByRarity()", () => {
      it("should return armour within rarity range", async () => {
        (pool.query as jest.Mock).mockResolvedValue([
          [testData.armours[1]],
          [],
        ]);

        const result = await getArmourByRarity(20, 10);

        expect(result).toBeDefined();
      });

      it("should fall back to closest armour if none in range", async () => {
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[], []])
          .mockResolvedValueOnce([[testData.armours[2]], []]);

        const result = await getArmourByRarity(100, 5);

        expect(result).toEqual(testData.armours[2]);
      });
    });

    describe("getShieldByRarity()", () => {
      it("should return shield within rarity range", async () => {
        (pool.query as jest.Mock).mockResolvedValue([
          [testData.shields[1]],
          [],
        ]);

        const result = await getShieldByRarity(18, 10);

        expect(result).toBeDefined();
      });

      it("should fall back to closest shield if none in range", async () => {
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[], []])
          .mockResolvedValueOnce([[testData.shields[2]], []]);

        const result = await getShieldByRarity(100, 5);

        expect(result).toEqual(testData.shields[2]);
      });
    });
  });
});

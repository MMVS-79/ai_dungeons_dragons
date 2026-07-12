import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type {
  ItemRow,
  WeaponRow,
  ArmourRow,
  ShieldRow,
  EnemyRow,
} from "@/lib/types/db.types";

/**
 * GET /api/wiki
 *
 * Returns all items, weapons, armours, shields, and enemies from the database
 * for the wiki display page
 */
export async function GET() {
  try {
    // Fetch all data in parallel
    const [
      itemsResult,
      weaponsResult,
      armoursResult,
      shieldsResult,
      enemiesResult,
    ] = await Promise.all([
      pool.query<ItemRow[]>(
        "SELECT * FROM items ORDER BY rarity ASC, name ASC",
      ),
      pool.query<WeaponRow[]>(
        "SELECT * FROM weapons ORDER BY rarity ASC, name ASC",
      ),
      pool.query<ArmourRow[]>(
        "SELECT * FROM armours ORDER BY rarity ASC, name ASC",
      ),
      pool.query<ShieldRow[]>(
        "SELECT * FROM shields ORDER BY rarity ASC, name ASC",
      ),
      pool.query<EnemyRow[]>(
        "SELECT * FROM enemies ORDER BY difficulty ASC, name ASC",
      ),
    ]);

    const items = itemsResult[0];
    const weapons = weaponsResult[0];
    const armours = armoursResult[0];
    const shields = shieldsResult[0];
    const enemies = enemiesResult[0];

    return NextResponse.json({
      success: true,
      data: {
        items,
        weapons,
        armours,
        shields,
        enemies,
      },
    });
  } catch (error) {
    console.error("[Wiki API] Error fetching wiki data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch wiki data",
      },
      { status: 500 },
    );
  }
}

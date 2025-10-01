import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET dragon stats
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM dragon WHERE id = 1");
    const dragon = (rows as any[])[0];

    return NextResponse.json({
      success: true,
      dragon
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dragon" },
      { status: 500 }
    );
  }
}

// POST to attack (reduce HP)
export async function POST(request: NextRequest) {
  try {
    const { damage } = await request.json();

    // Get current dragon HP
    const [rows] = await pool.query("SELECT hp FROM dragon WHERE id = 1");
    const currentHp = (rows as any[])[0].hp;

    // Calculate new HP (don't go below 0)
    const newHp = Math.max(0, currentHp - damage);

    // Update in database
    await pool.query("UPDATE dragon SET hp = ? WHERE id = 1", [newHp]);

    // Fetch updated dragon
    const [updatedRows] = await pool.query("SELECT * FROM dragon WHERE id = 1");
    const dragon = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      dragon,
      damageDelt: damage
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to attack dragon" },
      { status: 500 }
    );
  }
}

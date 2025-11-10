import { NextRequest, NextResponse } from "next/server";
import type { Enemy } from "@/lib/types/game.types";

/**
 * GET /api/enemies/[id]
 * 
 * TODO: Get specific enemy details
 * 
 * Purpose: View detailed information about a specific enemy
 * 
 * Response:
 * {
 *   success: boolean;
 *   enemy: Enemy;
 * }
 * 
 * Implementation Steps:
 * 1. Extract enemy ID from URL params
 * 2. Call BackendService.getEnemy(id)
 * 3. Return enemy data
 * 4. Return 404 if enemy not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enemyId = parseInt(params.id);

    if (isNaN(enemyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid enemy ID" },
        { status: 400 }
      );
    }

    // Step 1: Query enemy from database
    // Step 2: Return 404 if enemy not found

    console.log(`[API] GET /api/enemies/${enemyId}`);

    // MOCK DATA - Replace with actual database query
    return NextResponse.json({
      success: true,
      enemy: {
        id: enemyId,
        name: "Mock Dragon",
        health: 100,
        attack: 15,
        defense: 8,
        spritePath: "/characters/enemy/boss/dragon.png"
      } as Enemy
    });

  } catch (error) {
    console.error("[API] Get enemy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch enemy" },
      { status: 500 }
    );
  }
}


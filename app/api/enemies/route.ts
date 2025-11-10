import { NextRequest, NextResponse } from "next/server";
import type { Enemy } from "@/lib/types/game.types";

/**
 * GET /api/enemies
 * 
 * TODO: List all enemies in the game catalog
 * 
 * Purpose: Browse available enemies for admin panel or enemy reference
 * 
 * Query Parameters:
 * - difficulty?: "easy" | "medium" | "hard" | "boss" (filter by difficulty)
 * - limit?: number (default 100)
 * - offset?: number (default 0)
 * 
 * Response:
 * {
 *   success: boolean;
 *   enemies: Enemy[];
 *   total: number;
 * }
 * 
 * Implementation Steps:
 * 1. Parse query parameters (difficulty, limit, offset)
 * 2. Call BackendService.getAllEnemies({ difficulty, limit, offset })
 * 3. Get total count for pagination
 * 4. Return enemies array with total
 * 5. Order by difficulty then name for consistent browsing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Step 1: Query enemies from database with optional difficulty filter
    // Step 2: Apply limit and offset for pagination
    // Step 3: Get total count for pagination
    // Step 4: Order by difficulty then name

    console.log(`[API] GET /api/enemies - difficulty: ${difficulty}, limit: ${limit}, offset: ${offset}`);

    // MOCK DATA - Replace with actual database query
    return NextResponse.json({
      success: true,
      enemies: [] as Enemy[],
      total: 0
    });

  } catch (error) {
    console.error("[API] List enemies error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch enemies" },
      { status: 500 }
    );
  }
}


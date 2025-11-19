import { NextRequest, NextResponse } from "next/server";
import type { Item } from "@/lib/types/game.types";

/**
 * GET /api/items
 * 
 * TODO: List all items in the game catalog
 * 
 * Purpose: Browse available items for admin panel or item reference
 * 
 * Query Parameters:
 * - type?: "potion" | "weapon" | "armour" | "shield" (filter by type)
 * - limit?: number (default 100)
 * - offset?: number (default 0)
 * 
 * Response:
 * {
 *   success: boolean;
 *   items: Item[];
 *   total: number;
 * }
 * 
 * Implementation Steps:
 * 1. Parse query parameters (type, limit, offset)
 * 2. Call BackendService.getAllItems({ type, limit, offset })
 * 3. Get total count for pagination
 * 4. Return items array with total
 * 5. Order by item type then name for consistent browsing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Step 1: Query items from database with optional type filter
    // Step 2: Apply limit and offset for pagination
    // Step 3: Get total count for pagination
    // Step 4: Order by item type then name

    console.log(`[API] GET /api/items - type: ${typeFilter}, limit: ${limit}, offset: ${offset}`);

    // MOCK DATA - Replace with actual database query
    return NextResponse.json({
      success: true,
      items: [] as Item[],
      total: 0
    });

  } catch (error) {
    console.error("[API] List items error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}


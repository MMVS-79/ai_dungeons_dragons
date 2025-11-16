import { NextRequest, NextResponse } from "next/server";
import type { Item } from "@/lib/types/game.types";

/**
 * GET /api/characters/[id]/inventory
 *
 * TODO: Get character's inventory
 *
 * Purpose: Fetch all items in character's inventory for display
 *
 * Query Parameters:
 * - type?: "potion" | "weapon" | "armor" | "shield" (optional filter)
 *
 * Response:
 * {
 *   success: boolean;
 *   inventory: Item[];
 * }
 *
 * Implementation Steps:
 * 1. Extract character ID from URL params
 * 2. Get optional type filter from query params
 * 3. Call BackendService.getInventory(characterId)
 * 4. Apply type filter if provided
 * 5. Return array of items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const characterId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid character ID" },
        { status: 400 }
      );
    }

    // Step 1: Query character inventory from database
    // Step 2: Apply type filter if provided

    console.log(
      `[API] GET /api/characters/${characterId}/inventory - type: ${typeFilter}`
    );

    // MOCK DATA - Replace with actual database query
    return NextResponse.json({
      success: true,
      inventory: [] as Item[]
    });
  } catch (error) {
    console.error("[API] Get inventory error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/characters/[id]/inventory
 *
 * TODO: Add item to character's inventory (admin/debug endpoint)
 *
 * Purpose: Manually grant items for testing or admin purposes
 *
 * Request Body:
 * {
 *   itemId: number;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   item: Item;
 * }
 *
 * Implementation Steps:
 * 1. Extract character ID from URL params
 * 2. Parse itemId from request body
 * 3. Verify item exists via BackendService.getItem(itemId)
 * 4. Call BackendService.addItemToInventory(characterId, itemId)
 * 5. Return the added item
 * 6. Return 404 if item not found
 *
 * Note: In production, this should require admin authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const characterId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid character ID" },
        { status: 400 }
      );
    }

    if (!body.itemId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId" },
        { status: 400 }
      );
    }

    // Step 1: Verify item exists in database
    // Step 2: Return 404 if item not found
    // Step 3: Add item to character_items join table

    console.log(
      `[API] POST /api/characters/${characterId}/inventory - itemId: ${body.itemId}`
    );

    // MOCK DATA - Replace with actual database operations
    return NextResponse.json({
      success: true,
      item: {
        id: body.itemId,
        name: "Mock Item",
        type: "potion",
        description: "A mock item"
      } as Item
    });
  } catch (error) {
    console.error("[API] Add inventory item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to inventory" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/characters/[id]/inventory
 *
 * TODO: Remove item from character's inventory
 *
 * Purpose: Discard items from inventory
 *
 * Query Parameters:
 * - itemId: number (required)
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 *
 * Implementation Steps:
 * 1. Extract character ID from URL params
 * 2. Get itemId from query params
 * 3. Call BackendService.removeItemFromInventory(characterId, itemId)
 * 4. Return success message
 * 5. Return 404 if item not in inventory
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const characterId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid character ID" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId parameter" },
        { status: 400 }
      );
    }

    // Step 1: Remove item from character_items join table
    // Step 2: Return 404 if item not in inventory

    console.log(
      `[API] DELETE /api/characters/${characterId}/inventory - itemId: ${itemId}`
    );

    // MOCK DATA - Replace with actual database delete
    return NextResponse.json({
      success: true,
      message: `Item ${itemId} removed from inventory`
    });
  } catch (error) {
    console.error("[API] Remove inventory item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove item from inventory" },
      { status: 500 }
    );
  }
}

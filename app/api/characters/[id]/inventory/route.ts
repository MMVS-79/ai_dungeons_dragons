import { NextRequest, NextResponse } from "next/server";
import type { Item } from "@/lib/types/game.types";

/**
 * POST /api/characters/[id]/inventory
 *
 * TODO: Add item to character's inventory
 *
 * Purpose: Equip or acquire new items
 *
 * Request Body:
 * {
 *   itemId: number;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   inventory: Item[];
 * }
 *
 * Implementation Steps:
 * 1. Extract character ID from URL params
 * 2. Parse itemId from request body
 * 3. Verify item exists via BackendService.getItem(itemId)
 * 4. Call BackendService.addItemToInventory(characterId, itemId)
 * 5. Call BackendService.getInventory(characterId) to get updated list
 * 6. Return the updated inventory
 * 7. Return 404 if item not found
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
    // Step 4: Query full inventory

    console.log(
      `[API] POST /api/characters/${characterId}/inventory - itemId: ${body.itemId}`
    );

    // MOCK DATA - Replace with actual database operations
    return NextResponse.json({
      success: true,
      inventory: [
        {
          id: body.itemId,
          name: "Mock Item",
          health: 10,
          description: "A mock item"
        }
      ] as Item[]
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
 *   inventory: Item[];
 * }
 *
 * Implementation Steps:
 * 1. Extract character ID from URL params
 * 2. Get itemId from query params
 * 3. Call BackendService.removeItemFromInventory(characterId, itemId)
 * 4. Call BackendService.getInventory(characterId) to get updated list
 * 5. Return updated inventory
 * 6. Return 404 if item not in inventory
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
    // Step 3: Query full inventory

    console.log(
      `[API] DELETE /api/characters/${characterId}/inventory - itemId: ${itemId}`
    );

    // MOCK DATA - Replace with actual database delete
    return NextResponse.json({
      success: true,
      inventory: [] as Item[]
    });
  } catch (error) {
    console.error("[API] Remove inventory item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove item from inventory" },
      { status: 500 }
    );
  }
}

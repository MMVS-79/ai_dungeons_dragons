import { NextRequest, NextResponse } from "next/server";
import type { Character } from "@/lib/types/game.types";

/**
 * PUT /api/characters/[id]
 *
 * TODO: Update character stats
 *
 * Purpose: Adjust character attributes such as maxHealth, attack, defense
 *
 * Request Body:
 * {
 *   currentHealth?: number;
 *   maxHealth?: number;
 *   attack?: number;
 *   defense?: number;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   character: Character;
 * }
 *
 * Implementation Steps:
 * 1. Extract character ID from URL params
 * 2. Parse request body
 * 3. Validate values (no negative stats, currentHealth <= maxHealth)
 * 4. Call BackendService.updateCharacter(id, updates)
 * 5. Return updated character
 * 6. Return 404 if character not found
 *
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }, // ✅ Updated for Next.js 15
) {
  try {
    const { id } = await context.params; // Must await Promise
    const characterId = parseInt(id);
    const body = await request.json();

    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid character ID" },
        { status: 400 },
      );
    }

    if (body.currentHealth !== undefined && body.currentHealth < 0) {
      return NextResponse.json(
        { success: false, error: "Health cannot be negative" },
        { status: 400 },
      );
    }

    if (body.maxHealth !== undefined && body.currentHealth > body.maxHealth) {
      return NextResponse.json(
        { success: false, error: "Current health cannot exceed max health" },
        { status: 400 },
      );
    }

    // Step 1: Update character record with provided stat changes
    // Step 2: Return 404 if character not found

    console.log(`[API] PUT /api/characters/${characterId}`, body);

    // MOCK DATA - Replace with actual database update
    return NextResponse.json({
      success: true,
      character: {
        id: characterId,
        name: "Mock Hero",
        currentHealth: body.currentHealth || 50,
        maxHealth: body.maxHealth || 20,
        attack: body.attack || 10,
        defense: body.defense || 5,
        raceId: 1,
        classId: 1,
        campaignId: 1,
      } as Character,
    });
  } catch (error) {
    console.error("[API] Update character error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update character" },
      { status: 500 },
    );
  }
}

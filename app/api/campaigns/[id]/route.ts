import { NextRequest, NextResponse } from "next/server";
import type { Campaign, Character, GameEvent } from "@/lib/types/game.types";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";

/**
 * GET /api/campaigns/[id]
 *
 * TODO: Get full campaign details with character and recent events
 *
 * Purpose: Load all data needed for the campaign page
 *
 * Response:
 * {
 *   success: boolean;
 *   campaign: Campaign;
 *   character: Character;
 *   recentEvents: GameEvent[];
 *   inventory: Item[];
 * }
 *
 * Implementation Steps:
 * 1. Extract campaign ID from URL params
 * 2. Call BackendService.getCampaign(id)
 * 3. Call BackendService.getCharacterByCampaign(id)
 * 4. Call BackendService.getRecentEvents(id, limit=10)
 * 5. Call BackendService.getInventory(character.id)
 * 6. Return all data in single response
 * 7. Return 404 if campaign not found
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15 requires params to be async
) {
  try {
    const { id } = await context.params; // Must await the Promise
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    // Step 1: Query campaign from database
    // Step 2: Return 404 if campaign not found
    // Step 3: Query character for campaign
    // Step 4: Query recent events (limit 10)
    // Step 5: Query character inventory

    console.log(`[API] GET /api/campaigns/${campaignId}`);

    // MOCK DATA - Replace with actual database queries
    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        accountId: 1,
        name: "Mock Campaign",
        description: "Mock campaign description",
        state: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      } as Campaign,
      character: {
        id: 1,
        name: "Mock Hero",
        currentHealth: 50,
        maxHealth: 20,
        attack: 10,
        defense: 5,
        raceId: 1,
        classId: 1,
        campaignId: campaignId,
        spritePath: "/characters/player/warrior.png"
      } as Character,
      recentEvents: [] as GameEvent[],
      inventory: []
    });
  } catch (error) {
    console.error("[API] Get campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/campaigns/[id]
 *
 * TODO: Sync database with backend game state
 *
 * Purpose: Update database to match current backend game state
 * This endpoint syncs campaign state, character stats, and other game state
 * from the backend services to ensure database consistency.
 *
 * Request Body: None (only campaign ID from URL)
 *
 * Response:
 * {
 *   success: boolean;
 *   campaign: Campaign;
 *   character: Character;
 * }
 *
 * Implementation Steps:
 * 1. Extract campaign ID from URL params
 * 2. Call GameService.getGameState(campaignId) to get current state
 * 3. Update campaign record with state from gameState.campaign (preserve createdAt)
 * 4. Update character record with stats from gameState.character
 * 5. Return updated campaign and character
 * 6. Return 404 if campaign not found
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15 route signature
) {
  try {
    const { id } = await context.params; // Await params
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    // Step 1: Initialize GameService
    // Step 2: Get current game state
    // Step 3: Get existing campaign to preserve createdAt
    // Step 4: Update campaign record (preserve createdAt, update updatedAt)
    // Step 5: Update character record with current stats
    // Step 6: Return 404 if campaign not found

    console.log(
      `[API] PUT /api/campaigns/${campaignId} - Syncing database with game state`
    );

    // Initialize GameService
    const gameService = new GameService(process.env.GEMINI_API_KEY || "");

    // Get current game state from GameService
    const gameState = await gameService.getGameState(campaignId);

    // Get existing campaign to preserve createdAt
    const existingCampaign = await BackendService.getCampaign(campaignId);

    // Update campaign record (preserve createdAt, never update it)
    const updatedCampaign = await BackendService.updateCampaign(campaignId, {
      state: gameState.campaign.state,
      description: gameState.campaign.description,
      updatedAt: new Date()
      // Note: createdAt is preserved automatically by updateCampaign
    });

    // Update character stats
    const updatedCharacter = await BackendService.updateCharacter(
      gameState.character.id,
      {
        currentHealth: gameState.character.currentHealth,
        maxHealth: gameState.character.maxHealth,
        attack: gameState.character.attack,
        defense: gameState.character.defense,
        weaponId: gameState.character.weaponId,
        armourId: gameState.character.armourId,
        shieldId: gameState.character.shieldId
      }
    );

    return NextResponse.json({
      success: true,
      campaign: {
        ...updatedCampaign,
        createdAt: existingCampaign.createdAt // Ensure createdAt is preserved
      },
      character: updatedCharacter
    });
  } catch (error) {
    console.error("[API] Sync campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync campaign state" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 *
 * TODO: Delete campaign and all associated data
 *
 * Purpose: Remove campaign permanently (with cascade to character, logs, inventory)
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 *
 * Implementation Steps:
 * 1. Extract campaign ID from URL params
 * 2. Start database transaction
 * 3. Delete inventory records for campaign's character
 * 4. Delete event logs for campaign
 * 5. Delete character for campaign
 * 6. Delete campaign record
 * 7. Commit transaction
 * 8. Return success message
 * 9. Rollback on error
 *
 * Note: Consider soft delete (state="deleted") instead of hard delete for data recovery
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15 signature
) {
  try {
    const { id } = await context.params; // Await params
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    // Step 1: Begin database transaction
    // Step 2: Get character for campaign
    // Step 3: Delete inventory records
    // Step 4: Delete event logs
    // Step 5: Delete character record
    // Step 6: Delete campaign record (or soft delete via state="deleted")
    // Step 7: Commit transaction (rollback on error)

    console.log(`[API] DELETE /api/campaigns/${campaignId}`);

    // MOCK DATA - Replace with actual database delete
    return NextResponse.json({
      success: true,
      message: `Campaign ${campaignId} deleted successfully`
    });
  } catch (error) {
    console.error("[API] Delete campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

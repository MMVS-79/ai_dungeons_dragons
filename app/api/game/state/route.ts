import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";
import {
  getCombatSnapshot,
  clearCombatSnapshot,
  createCombatSnapshot
} from "@/lib/utils/combatSnapshot";
import type { CombatSnapshot } from "@/lib/types/game.types";
import type { CombatEncounterEventData } from "@/lib/types/db.types";

const gameService = new GameService(process.env.GEMINI_API_KEY!);

/**
 * GET /api/game/state
 * Load current game state without triggering new events
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get database account ID from session email
    const accountId = await BackendService.getOrCreateAccount(
      session.user.email
    );

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Missing campaignId parameter" },
        { status: 400 }
      );
    }

    const id = parseInt(campaignId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaignId - must be a number" },
        { status: 400 }
      );
    }

    // Verify campaign exists and belongs to authenticated user
    await BackendService.verifyCampaignOwnership(id, accountId);

    // Single check and creation logic
    let shouldRecreateCombat = false;
    let combatEnemyId: number | null = null;

    // Check if there's a snapshot in memory
    const existingSnapshot = getCombatSnapshot(id);

    if (existingSnapshot) {
      // Snapshot exists in memory - reset it
      shouldRecreateCombat = true;
      combatEnemyId = existingSnapshot.enemy.id;
      clearCombatSnapshot(id);
    } else {
      // No snapshot in memory - check database for incomplete combat
      const recentEvents = await BackendService.getRecentEvents(id, 10);
      const lastEvent = recentEvents[0];

      if (
        lastEvent &&
        lastEvent.eventType === "Combat" &&
        lastEvent.eventData
      ) {
        // Type guard to check if event data is a combat encounter
        const eventData = lastEvent.eventData as CombatEncounterEventData;

        if (eventData.phase === "encounter" && eventData.enemyId) {
          shouldRecreateCombat = true;
          combatEnemyId = eventData.enemyId;
        }
      }
    }

    // If need to recreate combat, do it once here
    if (shouldRecreateCombat && combatEnemyId) {
      const { character, equipment, inventory } =
        await BackendService.getCharacterWithFullData(id);
      const enemy = await BackendService.getEnemy(combatEnemyId);

      const freshSnapshot: CombatSnapshot = {
        campaignId: id,
        enemy,
        enemyCurrentHp: enemy.health,
        characterSnapshot: {
          id: character.id,
          currentHealth: character.currentHealth,
          maxHealth: character.maxHealth,
          baseAttack: character.attack,
          baseDefense: character.defense
        },
        equipment: equipment,
        inventorySnapshot: [...inventory],
        originalInventoryIds: inventory.map((item) => item.id),
        temporaryBuffs: {
          attack: 0,
          defense: 0
        },
        combatLog: [],
        createdAt: new Date()
      };

      createCombatSnapshot(freshSnapshot);
    }

    const gameState = await gameService.getGameState(id);

    return NextResponse.json({
      ...gameState,
      success: true
    });
  } catch (error) {
    console.log("[API] Game state fetch error:", error);

    // Check if it's an ownership/not found error
    if (
      error instanceof Error &&
      error.message === "Campaign not found or access denied"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found or access denied"
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch game state"
      },
      { status: 500 }
    );
  }
}

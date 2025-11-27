import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";
import {
  getCombatSnapshot,
  clearCombatSnapshot,
  createCombatSnapshot,
} from "@/lib/utils/combatSnapshot";
import type { CombatSnapshot } from "@/lib/types/game.types";
import type { CombatEncounterEventData } from "@/lib/types/db.types";

/**
 * Game State API Route
 * =====================
 *
 * GET /api/game/state
 * -------------------
 * Load current game state without triggering any new events.
 * Used on page load/refresh to initialize the UI.
 *
 * Query Parameters:
 *   campaignId: number (required) - ID of the campaign to load
 *
 * Response:
 *   {
 *     success: boolean;
 *     gameState: GameState;     // Complete game state
 *     message: string;          // Current event message
 *     choices: string[];        // Available actions for current phase
 *     error?: string;           // Present if load fails
 *   }
 *
 * What This Endpoint Does:
 *   1. Validates campaignId parameter
 *   2. Checks for existing combat snapshot in memory
 *      - If found: Clears and recreates (fresh combat state)
 *      - If not found but combat in DB: Recreates from database
 *   3. Loads complete game state:
 *      - Campaign info
 *      - Character with equipment
 *      - Inventory items
 *      - Recent events (up to 1000)
 *   4. Determines current game phase:
 *      - exploration: Normal gameplay
 *      - investigation_prompt: Awaiting investigate/decline
 *      - combat: Active combat encounter
 *      - victory: Campaign completed (boss defeated)
 *      - game_over: Character defeated
 *   5. Returns appropriate message and choices for phase
 *
 * Combat Snapshot Recovery:
 *   If last event is a Combat encounter without conclusion:
 *   - Loads enemy from database by ID
 *   - Recreates combat snapshot with current character state
 *   - Restores combat phase (temporary buffs are reset)
 *
 * Investigation Prompt Handling:
 *   Investigation prompts are stored in memory and lost on:
 *   - Server restart
 *   - Page refresh
 *   When lost, the investigation is auto-declined and a new event
 *   is generated on next continue action.
 *
 * Error Responses:
 *   400 - Missing campaignId parameter
 *   400 - Invalid campaignId format (not a number)
 *   404 - Campaign not found in database
 *   500 - Server error during state loading
 *
 * Use Cases:
 *   - Initial page load: Load campaign state
 *   - Page refresh: Restore game state
 *   - Combat recovery: Resume combat after server restart
 *   - State validation: Check current game phase
 */

const gameService = new GameService();

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
        { status: 401 },
      );
    }

    // Get database account ID from session email
    const accountId = await BackendService.getOrCreateAccount(
      session.user.email,
    );

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Missing campaignId parameter" },
        { status: 400 },
      );
    }

    const id = parseInt(campaignId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaignId - must be a number" },
        { status: 400 },
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
          baseDefense: character.defense,
        },
        equipment: equipment,
        inventorySnapshot: [...inventory],
        originalInventoryIds: inventory.map((item) => item.id),
        temporaryBuffs: {
          attack: 0,
          defense: 0,
        },
        combatLog: [],
        createdAt: new Date(),
      };

      createCombatSnapshot(freshSnapshot);
    }

    const gameState = await gameService.getGameState(id);

    return NextResponse.json({
      ...gameState,
      success: true,
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
          error: "Campaign not found or access denied",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch game state",
      },
      { status: 500 },
    );
  }
}

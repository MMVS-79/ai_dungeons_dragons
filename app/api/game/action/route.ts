// app/api/game/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";
import type { PlayerAction, GameServiceResponse } from "@/lib/types/game.types";

/**
 * Game Action API Route
 * ======================
 *
 * Main game loop endpoint that processes all player actions during gameplay.
 *
 * POST /api/game/action
 * ---------------------
 * Process a player action and return updated game state.
 *
 * Request Body:
 *   {
 *     campaignId: number;
 *     actionType: "continue" | "investigate" | "decline" | "attack" | "flee" | "use_item_combat";
 *     actionData?: {
 *       itemId?: number;  // Required for "use_item_combat" action
 *     };
 *   }
 *
 * Response:
 *   {
 *     success: boolean;
 *     gameState: GameState;          // Complete current game state
 *     message: string;               // Narrative text for the event
 *     choices: string[];             // Available action buttons
 *     combatResult?: CombatResult;   // Present during combat
 *     itemFound?: Item | Equipment;  // Present when loot is found
 *     error?: string;                // Present if action fails
 *   }
 *
 * Game Phases and Valid Actions:
 *   - exploration: ["continue"]
 *   - investigation_prompt: ["investigate", "decline"]
 *   - combat: ["attack", "flee", "use_item_combat"]
 *   - victory: [] (no actions, campaign completed)
 *   - game_over: [] (no actions, player defeated)
 *
 * Action Details:
 *
 *   continue:
 *     - Advances to next event (increments event number)
 *     - Triggers boss fight at event 48+
 *     - Calls LLM to generate event type and description
 *     - May present investigation prompt for Environmental/Item_Drop events
 *     - May start combat encounter
 *
 *   investigate:
 *     - Resolves pending investigation prompt
 *     - Grants stat boost for Environmental events
 *     - Grants loot for Item_Drop events
 *     - Returns to exploration phase after resolution
 *
 *   decline:
 *     - Skips pending investigation prompt without benefits
 *     - Generates new event immediately
 *     - Returns to exploration phase
 *
 *   attack:
 *     - Attacks enemy in combat
 *     - Damage = max(playerAttack - enemyDefense, 1)
 *     - Enemy counterattacks if still alive
 *     - Victory if enemy HP reaches 0 (generates loot)
 *     - Defeat if player HP reaches 0 (game over)
 *
 *   flee:
 *     - Attempts to escape from combat (50% chance)
 *     - Success: Returns to exploration, generates new event
 *     - Failure: Enemy counterattacks
 *
 *   use_item_combat:
 *     - Uses item from inventory during combat
 *     - Grants temporary buff for remainder of combat
 *     - Item removed from inventory after use
 *     - Requires itemId in actionData
 *
 * Special Features:
 *   - Combat Snapshots: Preserves combat state across server restarts
 *   - Investigation Prompts: Lost on page refresh (auto-declined)
 *   - Boss Encounters: Forced at event 48 with difficulty >= 1000
 *   - Loot Scaling: Rarity based on enemy difficulty and dice rolls
 *   - Two-Phase Combat Logging: Separate logs for encounter and conclusion
 *
 * Error Responses:
 *   400 - Missing or invalid campaignId
 *   400 - Invalid action for current game phase
 *   500 - Server error during action processing
 *
 * Implementation:
 *   All game logic handled by GameService.processPlayerAction()
 *   which orchestrates LLM calls, database updates, and state transitions.
 */

const gameService = new GameService();

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    if (!body.campaignId || !body.actionType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: campaignId and actionType",
        },
        { status: 400 },
      );
    }

    const campaignId = Number(body.campaignId);

    // Verify campaign exists and belongs to authenticated user
    const campaign = await BackendService.verifyCampaignOwnership(
      campaignId,
      accountId,
    );

    if (campaign.state === "game_over" || campaign.state === "completed") {
      const gameState = await gameService.getGameState(campaignId);

      return NextResponse.json({
        success: true,
        gameState,
        message:
          campaign.state === "game_over"
            ? "You have been defeated..."
            : "🎉 Victory is yours!",
        choices: [],
      });
    }

    // If actionType is "continue" but there's an investigation prompt in memory,
    // convert it to "decline" to skip the lost prompt
    if (body.actionType === "continue") {
      const storedPrompt = gameService.getStoredInvestigationPrompt(campaignId);
      if (storedPrompt) {
        body.actionType = "decline";
      }
    }

    // Normal action processing
    const action: PlayerAction = {
      campaignId,
      actionType: body.actionType,
      actionData: body.actionData || {},
    };

    // Validate actionType
    const validActionTypes = [
      "continue",
      "investigate",
      "decline",
      "attack",
      "flee",
      "use_item_combat",
    ];

    if (!validActionTypes.includes(action.actionType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid actionType: ${action.actionType}`,
        },
        { status: 400 },
      );
    }

    const result: GameServiceResponse =
      await gameService.processPlayerAction(action);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process game action",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/game/action
 * Get current game state without performing an action
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

    const validation = await gameService.validateGameState(id);

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
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

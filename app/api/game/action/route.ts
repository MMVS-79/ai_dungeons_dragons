import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import type { PlayerAction, GameServiceResponse } from "@/lib/types/game.types";

// Initialize GameService with API key
const gameService = new GameService(process.env.GEMINI_API_KEY!);

/**
 * POST /api/game/action
 * Main game action endpoint - processes player actions through GameService
 * 
 * Request body: PlayerAction
 * {
 *   campaignId: number;
 *   actionType: "continue" | "search" | "attack" | "flee" | "use_item" | etc;
 *   actionData?: { itemId?: number; targetId?: number };
 * }
 * 
 * Response: GameServiceResponse
 * {
 *   success: boolean;
 *   gameState: GameState;
 *   message: string;
 *   choices?: string[];
 *   combatResult?: CombatResult;
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.campaignId || !body.actionType) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: campaignId and actionType" 
        },
        { status: 400 }
      );
    }

    // Construct PlayerAction
    const action: PlayerAction = {
      campaignId: body.campaignId,
      actionType: body.actionType,
      actionData: body.actionData || {},
    };

    // Validate actionType
    const validActionTypes = [
      "continue",
      "search",
      "attack",
      "flee",
      "use_item",
      "pickup_item",
      "reject_item",
      "equip_item",
      "accept_event",
      "reject_event",
    ];

    if (!validActionTypes.includes(action.actionType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid actionType: ${action.actionType}` 
        },
        { status: 400 }
      );
    }

    console.log(`[API] Processing action: ${action.actionType} for campaign ${action.campaignId}`);

    // Call GameService
    const result: GameServiceResponse = await gameService.processPlayerAction(action);

    // Log result for debugging
    console.log(`[API] Action result: success=${result.success}, phase=${result.gameState.currentPhase}`);

    // Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });

  } catch (error) {
    console.error("[API] Game action error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process game action" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game/action
 * Optional: Get current game state without performing an action
 * Useful for refreshing the UI or recovering from errors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Missing campaignId parameter" },
        { status: 400 }
      );
    }

    // Validate campaign state
    const validation = await gameService.validateGameState(parseInt(campaignId));

    return NextResponse.json({
      success: true,
      validation,
    });

  } catch (error) {
    console.error("[API] Game state fetch error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch game state" 
      },
      { status: 500 }
    );
  }
}


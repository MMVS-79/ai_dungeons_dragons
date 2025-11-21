import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import type { PlayerAction, GameServiceResponse } from "@/lib/types/game.types";

const gameService = new GameService(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.campaignId || !body.actionType) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: campaignId and actionType" 
        },
        { status: 400 }
      );
    }

    const action: PlayerAction = {
      campaignId: body.campaignId,
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
          error: `Invalid actionType: ${action.actionType}` 
        },
        { status: 400 }
      );
    }

    console.log(`[API] Processing action: ${action.actionType} for campaign ${action.campaignId}`);

    const result: GameServiceResponse = await gameService.processPlayerAction(action);

    console.log(`[API] Action result: success=${result.success}, phase=${result.gameState.currentPhase}`);

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
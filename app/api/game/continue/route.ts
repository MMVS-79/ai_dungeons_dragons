import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import type { 
  PlayerAction, 
  GameServiceResponse 
} from "@/lib/types/game.types";

interface ContinueActionRequest {
  campaignId: number;
}

// Initialize GameService with API key
const gameService = new GameService(process.env.GEMINI_API_KEY!);

/**
 * POST /api/game/continue
 * Handle exploration continuation action
 * 
 * Request body: ContinueActionRequest
 * {
 *   campaignId: number;
 * }
 * 
 * Response: GameServiceResponse
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContinueActionRequest = await request.json();
    
    // Validate required fields
    if (!body.campaignId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required field: campaignId" 
        },
        { status: 400 }
      );
    }

    // Construct PlayerAction for continue
    const action: PlayerAction = {
      campaignId: body.campaignId,
      actionType: "continue",
      actionData: {}
    };

    console.log(`[API Continue] Processing continue action for campaign ${body.campaignId}`);

    // Call GameService orchestrator
    const result: GameServiceResponse = await gameService.processPlayerAction(action);

    // Log result for debugging
    console.log(`[API Continue] Result: success=${result.success}, phase=${result.gameState.currentPhase}`);

    // Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });

  } catch (error) {
    console.error("[API Continue] Error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process continue action" 
      },
      { status: 500 }
    );
  }
}


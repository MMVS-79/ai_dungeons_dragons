import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import type { 
  CombatActionRequest,
  PlayerAction, 
  GameServiceResponse 
} from "@/lib/types/game.types";

// Initialize GameService with API key
const gameService = new GameService(process.env.GEMINI_API_KEY!);

/**
 * POST /api/game/combat
 * Handle combat actions (attack or use item)
 * 
 * Request body: CombatActionRequest
 * {
 *   campaignId: number;
 *   actionType: "attack" | "use_item";
 *   itemId?: number; // Required for use_item
 * }
 * 
 * Response: GameServiceResponse
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CombatActionRequest = await request.json();
    
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

    // Validate actionType
    if (!["attack", "use_item"].includes(body.actionType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid actionType: ${body.actionType}. Must be "attack" or "use_item"` 
        },
        { status: 400 }
      );
    }

    // Validate use_item requires itemId
    if (body.actionType === "use_item" && !body.itemId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "itemId is required for use_item actions" 
        },
        { status: 400 }
      );
    }

    // Construct PlayerAction
    const action: PlayerAction = {
      campaignId: body.campaignId,
      actionType: body.actionType,
      actionData: body.itemId ? { itemId: body.itemId } : {}
    };

    console.log(`[API Combat] Processing ${body.actionType} action for campaign ${body.campaignId}`);

    // Call GameService orchestrator
    const result: GameServiceResponse = await gameService.processPlayerAction(action);

    // Log result for debugging
    console.log(`[API Combat] Result: success=${result.success}, phase=${result.gameState.currentPhase}`);

    // Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });

  } catch (error) {
    console.error("[API Combat] Error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process combat action" 
      },
      { status: 500 }
    );
  }
}


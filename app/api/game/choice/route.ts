import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import type { PlayerAction, GameServiceResponse } from "@/lib/types/game.types";

interface ChoiceActionRequest {
  campaignId: number;
  choiceType: "event" | "item" | "equipment";
  choice: boolean;
  itemId?: number;
}

// Initialize GameService with API key
const gameService = new GameService(process.env.GEMINI_API_KEY!);

/**
 * POST /api/game/choice
 * Handle binary choice actions for events, items, and equipment
 *
 * Request body: ChoiceActionRequest
 * {
 *   campaignId: number;
 *   choiceType: "event" | "item" | "equipment";
 *   choice: boolean; // true = accept/pickup/equip, false = reject/leave
 *   itemId?: number; // Required for equipment choices
 * }
 *
 * Response: GameServiceResponse
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChoiceActionRequest = await request.json();

    // Validate required fields
    if (!body.campaignId || !body.choiceType || body.choice === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: campaignId, choiceType, and choice",
        },
        { status: 400 },
      );
    }

    // Validate choiceType
    if (!["event", "item", "equipment"].includes(body.choiceType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid choiceType: ${body.choiceType}. Must be "event", "item", or "equipment"`,
        },
        { status: 400 },
      );
    }

    // Validate equipment requires itemId
    if (body.choiceType === "equipment" && !body.itemId) {
      return NextResponse.json(
        {
          success: false,
          error: "itemId is required for equipment choices",
        },
        { status: 400 },
      );
    }

    // Map ChoiceActionRequest to PlayerAction
    let action: PlayerAction;

    switch (body.choiceType) {
      case "event":
        action = {
          campaignId: body.campaignId,
          actionType: body.choice ? "investigate" : "decline", // Fixed
          actionData: {},
        };
        break;

      case "item":
        action = {
          campaignId: body.campaignId,
          actionType: body.choice ? "investigate" : "decline", // Fixed
          actionData: body.itemId ? { itemId: body.itemId } : {},
        };
        break;

      case "equipment":
        action = {
          campaignId: body.campaignId,
          actionType: "continue", // Fixed - or use appropriate action
          actionData: { itemId: body.itemId },
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid choiceType",
          },
          { status: 400 },
        );
    }

    console.log(
      `[API Choice] Processing ${body.choiceType} choice (${body.choice}) for campaign ${body.campaignId}`,
    );

    // Call GameService orchestrator
    const result: GameServiceResponse =
      await gameService.processPlayerAction(action);

    // Log result for debugging
    console.log(
      `[API Choice] Result: success=${result.success}, phase=${result.gameState.currentPhase}`,
    );

    // Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error("[API Choice] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process choice action",
      },
      { status: 500 },
    );
  }
}

// app/api/game/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";
import type { PlayerAction, GameServiceResponse } from "@/lib/types/game.types";

const gameService = new GameService(process.env.GEMINI_API_KEY!);

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

import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";

const gameService = new GameService(process.env.GEMINI_API_KEY!);

/**
 * GET /api/game/state
 * Load current game state without triggering new events
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

    const id = parseInt(campaignId);
    const gameState = await gameService.getGameState(id);

    return NextResponse.json({
      ...gameState,
      success: true,
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
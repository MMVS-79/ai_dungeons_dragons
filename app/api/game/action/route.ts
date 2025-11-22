// app/api/game/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/services/game.service";
import * as BackendService from "@/lib/services/backend.service";
import type { PlayerAction, GameServiceResponse, CombatSnapshot } from "@/lib/types/game.types";

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

    const campaignId = Number(body.campaignId);

    console.log(`[API] Processing action: ${body.actionType} for campaign ${campaignId}`);

    // CHECK: Is campaign completed or game over?
    const campaign = await BackendService.getCampaign(campaignId);
    
    if (campaign.state === "game_over" || campaign.state === "completed") {
      console.log(`[API] Campaign ${campaignId} is ${campaign.state}, loading final state`);
      
      const gameState = await gameService.getGameState(campaignId);
      
      return NextResponse.json({
        success: true,
        gameState,
        message: campaign.state === "game_over" 
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
        console.log(`[API] Investigation prompt detected, auto-declining on refresh`);
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
          error: `Invalid actionType: ${action.actionType}` 
        },
        { status: 400 }
      );
    }

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
    
    // 🔥 NEW: Check for active combat snapshot on page load
    const existingSnapshot = getCombatSnapshot(id);
    if (existingSnapshot) {
      console.log(`[API] Found active combat snapshot on page load, resetting combat to start`);
      
      // Get the most recent combat event from database
      const recentEvents = await BackendService.getRecentEvents(id, 10);
      const lastCombatEvent = recentEvents.find(e => e.eventType === "Combat");
      
      if (lastCombatEvent && lastCombatEvent.eventData) {
        const eventData = lastCombatEvent.eventData as any;
        
        // Only reset if it's an encounter (not a conclusion)
        if (eventData.phase === "encounter" && eventData.enemyId) {
          console.log(`[API] Resetting combat encounter with enemy ID ${eventData.enemyId}`);
          
          // Clear old snapshot
          clearCombatSnapshot(id);
          
          // Get fresh data
          const { character, equipment, inventory } = await BackendService.getCharacterWithFullData(id);
          const enemy = await BackendService.getEnemy(eventData.enemyId);
          
          // Create fresh combat snapshot with full HP
          const freshSnapshot: CombatSnapshot = {
            campaignId: id,
            enemy,
            enemyCurrentHp: enemy.health, // 🔥 Full enemy HP
            characterSnapshot: {
              id: character.id,
              currentHealth: character.currentHealth, // 🔥 Character HP from before combat
              maxHealth: character.maxHealth,
              baseAttack: character.attack,
              baseDefense: character.defense,
            },
            inventorySnapshot: [...inventory],
            originalInventoryIds: inventory.map(item => item.id),
            temporaryBuffs: {
              attack: 0,
              defense: 0,
            },
            combatLog: [],
            startedAt: new Date(),
          };
          
          createCombatSnapshot(freshSnapshot);
          console.log(`[API] Created fresh combat snapshot`);
        }
      }
    }

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
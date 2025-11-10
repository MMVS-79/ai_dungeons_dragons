/**
 * API Helper for Campaign Page
 * Bridges frontend (simple mock format) with backend (GameService format)
 */

import type { GameServiceResponse } from "@/lib/types/game.types";

// Frontend mock response format (what page.tsx expects)
interface FrontendResponse {
  type: "combat" | "item" | "equipment" | "story" | "potion_prompt";
  message: string;
  choices: string[];
  playerDamage?: number;
  enemyDamage?: number;
  enemy?: {
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    image: string;
    isBoss?: boolean;
  };
  item?: {
    id: string;
    name: string;
    type: "potion" | "weapon" | "armor" | "shield";
    image: string;
    healAmount?: number;
    attack?: number;
    defense?: number;
    hpBonus?: number;
    description: string;
  };
  equipment?: {
    id: string;
    name: string;
    type: "weapon" | "armor" | "shield";
    image: string;
    attack?: number;
    defense?: number;
    hpBonus?: number;
    description: string;
  };
  equipmentType?: string;
}

/**
 * Map frontend choice strings to backend action types
 */
function mapChoiceToActionType(choice: string): string {
  const mapping: Record<string, string> = {
    "Continue Forward": "continue",
    "Search Area": "search",
    "Attack": "attack",
    "Flee": "flee",
    "Use Potion": "use_item",
    "Pick Up": "pickup_item",
    "Leave It": "reject_item",
    "Replace Equipment": "equip_item",
    "Accept": "accept_event",
    "Reject": "reject_event",
  };

  return mapping[choice] || "continue";
}

/**
 * Transform backend GameServiceResponse to frontend mock format
 */
function transformResponse(
  backendResponse: GameServiceResponse,
  choice: string
): FrontendResponse {
  const { gameState, message, choices, combatResult } = backendResponse;

  // Determine response type based on game phase
  let type: FrontendResponse["type"] = "story";
  
  if (gameState.currentPhase === "combat") {
    type = "combat";
  } else if (gameState.currentPhase === "item_choice") {
    type = "item";
  } else if (gameState.currentPhase === "event_choice") {
    type = "story"; // Event preview
  } else if (gameState.currentPhase === "exploration") {
    type = "story";
  }

  // Base response
  const response: FrontendResponse = {
    type,
    message,
    choices: choices || ["Continue Forward", "Search Area"],
  };

  // Add combat data if present
  if (combatResult) {
    response.playerDamage = combatResult.characterDamage;
    response.enemyDamage = combatResult.enemyDamage;
    
    // If combat just started, include enemy data
    if (gameState.enemy) {
      response.type = "combat";
      response.enemy = {
        name: gameState.enemy.name,
        hp: gameState.enemy.health,
        maxHp: gameState.enemy.health, // TODO: Backend should provide maxHealth
        attack: gameState.enemy.attack,
        defense: gameState.enemy.defense,
        image: gameState.enemy.spritePath || "/characters/enemy/low/goblin.png",
        isBoss: false, // TODO: Backend should indicate boss status
      };
    }
  } else if (gameState.enemy && gameState.currentPhase === "combat") {
    // Enemy exists but no combat result yet (new encounter)
    response.type = "combat";
    response.enemy = {
      name: gameState.enemy.name,
      hp: gameState.enemy.health,
      maxHp: gameState.enemy.health,
      attack: gameState.enemy.attack,
      defense: gameState.enemy.defense,
      image: gameState.enemy.spritePath || "/characters/enemy/low/goblin.png",
      isBoss: false,
    };
  }

  return response;
}

/**
 * Call the game API endpoint
 * @param choice - Frontend choice string (e.g., "Continue Forward")
 * @param campaignId - Campaign ID from route params
 * @param diceRoll - Dice roll result (optional, for future use)
 * @returns Frontend-formatted response
 */
export async function callGameAPI(
  choice: string,
  campaignId: string | string[],
  diceRoll?: number
): Promise<FrontendResponse> {
  try {
    // Convert campaignId to number
    const id = typeof campaignId === "string" ? parseInt(campaignId) : parseInt(campaignId[0]);

    // Map choice to action type
    const actionType = mapChoiceToActionType(choice);

    console.log(`[API Helper] Calling /api/game/action`, {
      campaignId: id,
      actionType,
      choice,
      diceRoll,
    });

    // Call backend API
    const response = await fetch("/api/game/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: id,
        actionType,
        actionData: diceRoll ? { diceRoll } : {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const backendResponse: GameServiceResponse = await response.json();

    console.log(`[API Helper] Backend response:`, backendResponse);

    // Transform to frontend format
    const frontendResponse = transformResponse(backendResponse, choice);

    console.log(`[API Helper] Transformed response:`, frontendResponse);

    return frontendResponse;
  } catch (error) {
    console.error("[API Helper] Error calling game API:", error);
    
    // Return fallback response
    return {
      type: "story",
      message: "An error occurred. The dungeon walls seem to shimmer strangely...",
      choices: ["Continue Forward", "Search Area"],
    };
  }
}


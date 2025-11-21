/**
 * Game Service (GameEngine Orchestrator)
 * ----------------------------------------
 * Main orchestrator for all game logic. This class contains MINIMAL logic itself
 * and delegates to backend services, LLM service, and utility functions.
 *
 * Responsibilities:
 * 1. Process player actions (continue, attack, use item, etc.)
 * 2. Generate events by calling LLM service
 * 3. Orchestrate combat by delegating to combat utilities
 * 4. Apply event effects by calling backend services
 * 5. Validate game state (win/loss conditions)
 * 6. Update frontend with game state changes
 *
 * This service is a pure orchestrator - it coordinates between:
 * - Backend services (database operations)
 * - LLM service (event generation)
 * - Utility functions (dice rolls, stat calculations, event formatting)
 *
 * COMBAT SYSTEM NOTE:
 * - Implementation approach needs team discussion
 * -Turn-based combat with attack actions or Instant combat
 */

import { LLMService } from "@/lib/services/llm.service";
import { EventType } from "@/lib/services/Event_type";
import { Dice_Roll } from "@/lib/services/dice_roll";
import { Stat_Calc, StatType } from "@/lib/services/Stat_calc";
import type {
  LLMGameContext,
  EventHistoryEntry,
  EventTypeString
} from "@/lib/types/llm.types";
import type {
  PlayerAction,
  GameState,
  GameServiceResponse,
  CombatResult,
  GameValidation,
  Character,
  Unit
} from "@/lib/types/game.types";
import * as BackendService from "@/lib/services/backend.service";
import { HEALTH_PER_VITALITY } from "../contants";
// TODO: Import utility functions when implemented
// import { rollD20WithDetails } from "@/lib/utils/diceRoll";
// import { calculateDamage, applyStatEffects } from "@/lib/utils/statCalc";
// import { validateEventType, convertLLMEventToGameEvent } from "@/lib/utils/eventUtils";

/**
 * GameService class - Main game engine orchestrator
 */
export class GameService {
  private llmService: LLMService;

  constructor(llmApiKey: string) {
    // Initialize LLM service for event generation
    this.llmService = new LLMService({
      apiKey: llmApiKey,
      model: "gemini-2.5-flash-lite",
      temperature: 0.8
    });
  }

  // ==========================================================================
  // MAIN ORCHESTRATION METHODS
  // ==========================================================================

  /**
   * Main entry point for processing player actions
   * Orchestrates the entire game flow for a single action
   *
   * @param action - Player action with campaign ID and action type
   * @returns Game state response with updated state and messages
   */
  async processPlayerAction(
    action: PlayerAction
  ): Promise<GameServiceResponse> {
    try {
      // 1. Get current game state from backend
      const gameState = await this.getGameState(action.campaignId);

      // 2. Validate action is allowed in current game phase
      const validation = this.validateAction(action, gameState);
      if (!validation.isValid) {
        return {
          success: false,
          gameState,
          message: validation.errors.join(", "),
          error: "Invalid action"
        };
      }

      // 3. Route to appropriate handler based on action type
      switch (action.actionType) {
        case "continue":
        case "search":
          return await this.handleExplorationAction(action, gameState);

        case "attack":
          // TODO: Combat implementation needs further discussion - see handleCombatAction
          return await this.handleCombatAction(action, gameState);

        case "use_item":
          return await this.handleUseItem(action, gameState);

        // Both route to handleItemChoice
        case "pickup_item":
        case "reject_item":
          return await this.handleItemChoice(action, gameState);

        case "equip_item":
          return await this.handleEquipItem(action, gameState);

        //Both route to handleEventChoice
        case "accept_event":
        case "reject_event":
          return await this.handleEventChoice(action, gameState);

        default:
          return {
            success: false,
            gameState,
            message: "Unknown action type",
            error: "Invalid action type"
          };
      }
    } catch (error) {
      console.error("Error processing player action:", error);

      // Get current state for error response
      const gameState = await this.getGameState(action.campaignId);

      return {
        success: false,
        gameState,
        message: "An error occurred processing your action",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Validate current game state and check win/loss conditions
   * Contains business rule validation logic
   *
   * @param campaignId - Campaign ID
   * @returns Validation result with game state info
   */
  async validateGameState(campaignId: number): Promise<GameValidation> {
    const gameState = await this.getGameState(campaignId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check character health
    const isGameOver = gameState.character.currentHealth <= 0;
    if (isGameOver) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        gameState: {
          isGameOver: true,
          isVictory: false,
          reason: "Character has been defeated"
        }
      };
    }

    // Check victory condition (no more enemies and campaign complete)
    const isVictory =
      gameState.campaign.state === "completed" && gameState.enemy === null;

    if (isVictory) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        gameState: {
          isGameOver: false,
          isVictory: true,
          reason: "Campaign completed successfully"
        }
      };
    }

    // Check for invalid states
    if (gameState.character.currentHealth > gameState.character.vitality * HEALTH_PER_VITALITY) {
      warnings.push("Character health exceeds maximum");
    }

    if (gameState.currentPhase === "combat" && !gameState.enemy) {
      errors.push("Combat phase but no active enemy");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      gameState: {
        isGameOver,
        isVictory
      }
    };
  }

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  /**
   * Handle exploration actions (continue, search)
   * Generate event type only, present to user for Accept/Reject
   * Effects are NOT applied until user accepts
   */
  private async handleExplorationAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    // Step 1: Build LLM context
    const context = await this.buildLLMContext(gameState);

    // Step 2: Generate ONLY event type from LLM (not full description yet)
    let eventType = await this.llmService.generateEventType(context);

    // Step 3: Check descriptive counter to avoid too many boring events
    // If more than 1 consecutive Descriptive event, regenerate
    let attempts = 0;
    while (
      eventType === "Descriptive" &&
      this.getDescriptiveCount() > 1 &&
      attempts < 3
    ) {
      console.log("Too many Descriptive events, regenerating...");
      eventType = await this.llmService.generateEventType(context);
      attempts++;
    }

    // Step 4: Store pending event (DON'T apply effects yet)
    await BackendService.setPendingEvent(action.campaignId, eventType);

    // Step 5: Create preview message for user
    const displayMessage = this.getEventPreviewMessage(eventType);

    // Get updated game state with pending event
    const updatedState = await this.getGameState(action.campaignId);
    updatedState.pendingEvent = { eventType, displayMessage };
    updatedState.currentPhase = "event_choice";

    return {
      success: true,
      gameState: updatedState,
      message: displayMessage,
      choices: ["Accept", "Reject"] // Let player decide
    };
  }

  /**
   *
   * TODO: Combat system implementation needs team discussion
   * Options:
   * - Turn-based combat with attack actions (this approach) or instant combat resolution
   *
   * Orchestrates combat by calling dice roll and damage calculation utilities
   */
  private async handleCombatAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log("[GameService] handleCombatAction - NOT YET IMPLEMENTED");

    return {
      success: false,
      gameState,
      message: "Combat system not yet implemented",
      error: "Combat pending implementation"
    };
  }

  /**
   * Handle using an item from inventory
   */
  private async handleUseItem(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    const itemId = action.actionData?.itemId;
    if (!itemId) {
      return {
        success: false,
        gameState,
        message: "No item specified",
        error: "Missing item ID"
      };
    }

    const item = await BackendService.getItem(itemId);

    // Apply item effects (basic implementation)
    if (item.health) {
      const newHealth = Math.min(
        gameState.character.vitality * HEALTH_PER_VITALITY,
        gameState.character.currentHealth + item.health
      );
      await BackendService.BackendService.updateCharacter(gameState.character.id, {
        currentHealth: newHealth
      });
    }

    // Remove item from inventory
    await BackendService.removeItemFromInventory(
      gameState.character.id,
      itemId
    );

    const message = `You used ${item.name}!`;
    await BackendService.saveEvent(action.campaignId, message, "Item_Drop", {
      itemId,
      action: "use_item"
    });

    const updatedState = await this.getGameState(action.campaignId);

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: this.getChoicesForPhase(updatedState.currentPhase)
    };
  }

  /**
   * Handle item pickup/reject choice
   */
  private async handleItemChoice(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    const itemId = action.actionData?.itemId;

    if (action.actionType === "pickup_item" && itemId) {
      await BackendService.assignItemToCharacter(gameState.character.id, itemId);
      const item = await BackendService.getItem(itemId);

      const message = `You picked up ${item.name}!`;
      await BackendService.saveEvent(action.campaignId, message, "Item_Drop", {
        itemId,
        action: "pickup"
      });

      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward", "Search Area"]
      };
    } else {
      const message = "You left the item behind.";
      await BackendService.saveEvent(
        action.campaignId,
        message,
        "Descriptive",
        { action: "reject_item" }
      );

      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward", "Search Area"]
      };
    }
  }

  /**
   * Handle equipping an item
   */
  private async handleEquipItem(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    const itemId = action.actionData?.itemId;
    if (!itemId) {
      return {
        success: false,
        gameState,
        message: "No item specified",
        error: "Missing item ID"
      };
    }

    const item = await BackendService.getItem(itemId);

    let slot: "weapon" | "armor" | "shield";

    if ("attack" in item) slot = "weapon";
    else if ("vitality" in item) slot = "armor";
    else if ("defense" in item) slot = "shield";
    else {
      return {
        success: false,
        gameState,
        message: "Item cannot be equipped",
        error: "Invalid item type for equipment"
      };
    }

    // Backend handles all stat calculations and equipment replacement
    await BackendService.equipItem(gameState.character.id, itemId, slot);

    const message = `You equipped ${item.name}!`;
    await BackendService.saveEvent(action.campaignId, message, "Item_Drop", {
      itemId,
      action: "equip"
    });

    const updatedState = await this.getGameState(action.campaignId);

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: this.getChoicesForPhase(updatedState.currentPhase)
    };
  }

  /**
   * Handle Accept/Reject event choice
   * Implements the two-phase event system:
   * - User is presented with event preview
   * - On Accept: Delegates to EventType.trigger() which handles all event logic
   * - On Reject: Skips event and generates new one
   */
  private async handleEventChoice(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    const pendingEvent = gameState.pendingEvent;

    if (!pendingEvent) {
      return {
        success: false,
        gameState,
        message: "No pending event to accept or reject",
        error: "No pending event"
      };
    }

    // REJECT - Clear pending event and generate new one
    if (action.actionType === "reject_event") {
      await BackendService.clearPendingEvent(action.campaignId);

      // Immediately generate next event
      return this.handleExplorationAction(action, gameState);
    }

    // ACCEPT - Trigger EventType handler
    if (action.actionType === "accept_event") {
      const eventType = pendingEvent.eventType as EventTypeString;

      // EventType.trigger() handles everything internally:
      // - Descriptive: increments counter
      // - Environmental: calls LLM_Service.RequestStatBoost() → Dice_Roll → Stat_Calc → Backend_Service
      // - Combat: calls CombatUI.InitializeCombat() → if won: Dice_Roll → RequestStatBoost/ItemDrop → Backend_Service
      //   NOTE: Combat handling needs team discussion - see COMBAT SYSTEM NOTE in file header
      // - Item_Drop: calls LLM_Service.RequestItemDrop() → Backend_Service
      await this.triggerEventType(gameState, eventType);

      // Clear pending event
      await BackendService.clearPendingEvent(action.campaignId);

      // TODO: Phase handling needs discussion based on combat system approach
      // - Set phase to "combat" for turn-based battles
      if (eventType === "Combat") {
        gameState.currentPhase = "combat";
      } else {
        gameState.currentPhase = "exploration";
      }

      // Get updated game state (EventType will have already saved changes to database)
      const updatedState = await this.getGameState(action.campaignId);
      updatedState.pendingEvent = undefined;

      // Validate state
      await this.validateGameState(action.campaignId);

      return {
        success: true,
        gameState: updatedState,
        message: "Event completed successfully",
        choices: this.getChoicesForPhase(updatedState.currentPhase)
      };
    }

    return {
      success: false,
      gameState,
      message: "Invalid event choice action",
      error: "Unknown action type"
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get current game state from backend services
   * Public method for syncing game state to database
   */
  public async getGameState(campaignId: number): Promise<GameState> {
    const campaign = await BackendService.getCampaign(campaignId);
    const character = await BackendService.getCharacterByCampaign(campaignId);
    const enemy = await BackendService.getCurrentEnemy(campaignId);
    const recentEvents = await BackendService.getRecentEvents(campaignId, 10);
    const pendingEventType = await BackendService.getPendingEvent(campaignId);

    // Determine current phase based on game state
    let currentPhase: GameState["currentPhase"] = "exploration";
    if (campaign.state === "game_over") currentPhase = "game_over";
    else if (campaign.state === "completed") currentPhase = "victory";
    else if (enemy) currentPhase = "combat";
    else if (pendingEventType) currentPhase = "event_choice";

    // Build pendingEvent object if one exists
    let pendingEvent: GameState["pendingEvent"] = undefined;
    if (pendingEventType) {
      pendingEvent = {
        eventType: pendingEventType,
        displayMessage: this.getEventPreviewMessage(pendingEventType)
      };
    }

    return {
      campaign,
      character,
      enemy,
      recentEvents,
      currentPhase,
      pendingEvent
    };
  }

  /**
   * Build LLM context from current game state
   */
  private async buildLLMContext(gameState: GameState): Promise<LLMGameContext> {
    // Convert game events to LLM event history format
    const recentEvents: EventHistoryEntry[] = gameState.recentEvents.map(
      (event) => ({
        description: event.message,
        type: event.eventType as EventHistoryEntry["type"],
        effects: (event.eventData?.effects as EventHistoryEntry["effects"]) || {
          health: 0,
          attack: 0,
          defense: 0
        }
      })
    );

    // Use placeholder enemy if none exists
    const enemy = gameState.enemy || {
      name: "Unknown Creature",
      vitality: 10,
      attack: 10,
      defense: 5
    };

    return {
      character: {
        name: gameState.character.name,
        health: gameState.character.currentHealth,
        vitality: gameState.character.vitality,
        attack: gameState.character.attack,
        defense: gameState.character.defense
      },
      enemy: {
        name: enemy.name,
        health: enemy.vitality * HEALTH_PER_VITALITY,
        attack: enemy.attack,
        defense: enemy.defense
      },
      recentEvents
    };
  }

  /**
   * Build combat-specific LLM context, to hand over to LLM after combat round.
   */
  private buildCombatContext(
    gameState: GameState,
    combatResult: CombatResult
  ): LLMGameContext {
    const enemy = gameState.enemy!;

    return {
      character: {
        name: gameState.character.name,
        health: combatResult.characterHealth,
        vitality: gameState.character.vitality,
        attack: gameState.character.attack,
        defense: gameState.character.defense
      },
      enemy: {
        name: enemy.name,
        health: combatResult.enemyHealth,
        attack: enemy.attack,
        defense: enemy.defense
      },
      recentEvents: [],
      trigger: `combat round - dice roll: ${combatResult.diceRoll}${
        combatResult.isCritical ? " (CRITICAL!)" : ""
      }`
    };
  }

  /**
   * Resolve a combat round
   *
   * TODO: Combat implementation needs further discussion
   * This is part of turn-based combat approach
   * Uses Dice_Roll service and applies critical hit range (16-20)
   *
   * TODO: Post-combat rewards should use Stat_Calc for three-tier system
   */
  private async resolveCombat(
    character: LLMGameContext["character"],
    enemy: LLMGameContext["enemy"]
  ): Promise<CombatResult> {
    // TODO: Uncomment when Dice_Roll is available
    // const diceRoll = Dice_Roll.roll();
    // const isCritical = diceRoll >= 16 && diceRoll <= 20;

    // Temporary placeholders until Dice_Roll is available
    const diceRoll = Math.floor(Math.random() * 20) + 1;
    const isCritical = diceRoll >= 16 && diceRoll <= 20;

    // Basic damage calculation
    // Note: Combat damage uses simple 2× multiplier, not three-tier system
    const characterDamageToEnemy = Math.max(
      1,
      character.attack - enemy.defense
    );

    // if (isCritical) characterDamageToEnemy *= 2;

    const enemyDamageToCharacter = Math.max(
      1,
      enemy.attack - character.defense
    );

    // Apply damage
    const newEnemyHealth = Math.max(0, enemy.health - characterDamageToEnemy);
    const newCharacterHealth = Math.max(
      0,
      character.health - enemyDamageToCharacter
    );

    // Determine outcome
    let outcome: CombatResult["outcome"] = "ongoing";
    if (newCharacterHealth <= 0) outcome = "character_defeated";
    else if (newEnemyHealth <= 0) outcome = "enemy_defeated";

    return {
      characterDamage: enemyDamageToCharacter,
      enemyDamage: characterDamageToEnemy,
      characterHealth: newCharacterHealth,
      enemyHealth: newEnemyHealth,
      diceRoll,
      isCritical,
      outcome,
      narrative: "" // Will be filled by LLM
    };
  }

  /**
   * Validate if action is allowed in current game state
   */
  private validateAction(
    action: PlayerAction,
    gameState: GameState
  ): GameValidation {
    const errors: string[] = [];

    // Can't take actions if game is over
    if (gameState.currentPhase === "game_over") {
      errors.push("Game is over");
    }

    if (gameState.currentPhase === "victory") {
      errors.push("Campaign already completed");
    }

    // Combat actions only valid in combat
    if (action.actionType === "attack" && gameState.currentPhase !== "combat") {
      errors.push("Not in combat");
    }

    // Exploration actions not valid in combat
    if (
      (action.actionType === "continue" || action.actionType === "search") &&
      gameState.currentPhase === "combat"
    ) {
      errors.push("Cannot explore during combat");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Get available choices based on current game phase
   */
  private getChoicesForPhase(phase: GameState["currentPhase"]): string[] {
    switch (phase) {
      case "combat":
        return ["Attack", "Use Item"];
      case "exploration":
        return ["Continue Forward", "Search Area"];
      case "event_choice":
        return ["Accept", "Reject"];
      case "item_choice":
        return ["Pick Up", "Leave It"];
      case "game_over":
        return ["Start New Game"];
      case "victory":
        return ["View Stats", "Start New Game"];
      default:
        return ["Continue"];
    }
  }

  /**
   * Apply stat changes to character (used in new event flow)
   */
  private async applyStatChanges(
    campaignId: number,
    changes: { health: number; attack: number; defense: number }
  ): Promise<void> {
    const character = await BackendService.getCharacterByCampaign(campaignId);

    const newHealth = Math.max(
      0,
      Math.min(character.vitality * HEALTH_PER_VITALITY, character.currentHealth + changes.health)
    );
    const newAttack = Math.max(0, character.attack + changes.attack);
    const newDefense = Math.max(0, character.defense + changes.defense);

    await BackendService.BackendService.updateCharacter(character.id, {
      currentHealth: newHealth,
      attack: newAttack,
      defense: newDefense
    });
  }

  /**
   * Get preview message for event type (before acceptance)
   */
  private getEventPreviewMessage(eventType: string): string {
    const messages: Record<string, string> = {
      Descriptive: "You notice something interesting in your surroundings...",
      Environmental: "The environment around you begins to shift...",
      Combat: "You sense danger approaching...",
      Item_Drop: "Something catches your eye nearby..."
    };

    return messages[eventType] || `A ${eventType} event is about to occur...`;
  }

  // ==========================================================================
  // EVENTTYPE INTEGRATION
  // ==========================================================================

  /**
   * Trigger EventType handler based on event type
   * Delegates to EventType class which manages:
   * - Descriptive counter (prevents consecutive boring events)
   * - Environmental stat boosts
   * - Combat initialization
   * - Item drop handling
   */
  private async triggerEventType(gameState: GameState, eventType: EventTypeString): Promise<void> {
    const eventTypeInstance = new EventType(eventType);
    await eventTypeInstance.trigger(await this.buildLLMContext(gameState));
  }

  /**
   * Get current descriptive event counter
   * Used to prevent multiple consecutive descriptive (flavor-only) events
   * Returns number of consecutive descriptive events that have occurred
   */
  private getDescriptiveCount(): number {
    return EventType.getDescriptiveCount();
  }

  /**
   * Reset descriptive event counter
   * Called after significant game events (e.g., boss defeats)
   * to allow descriptive events to occur again
   */
  private resetDescriptiveCount(): void {
    EventType.resetDescriptiveCount();
  }
}

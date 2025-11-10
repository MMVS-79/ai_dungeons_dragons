/**
 * Game Service (GameEngine Orchestrator)
 * ----------------------------------------
 * Main orchestrator for all game logic. This class contains MINIMAL logic itself
 * and delegates to backend services, LLM service, and utility functions.
 *
 * Responsibilities:
 * 1. Process player actions (continue, attack, flee, use item, etc.)
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
 */

import { LLMService } from "@/lib/services/llm.service";
// TODO: Uncomment when Event_type, Dice_Roll, Stat_Calc PR merges
// import { EventType } from "@/lib/services/Event_type";
// import { Dice_Roll } from "@/lib/services/dice_roll";
// import { Stat_Calc, StatType } from "@/lib/services/Stat_calc";

// Temporary type definition until Stat_Calc is available
type StatType = "VIT" | "ATK" | "DEF";

import type {
  LLMGameContext,
  LLMEvent,
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
  Enemy
} from "@/lib/types/game.types";
import * as BackendService from "@/lib/services/backend.service";
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
      model: "gemini-2.0-flash-lite",
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
          return await this.handleCombatAction(action, gameState, "attack");

        case "flee":
          return await this.handleCombatAction(action, gameState, "flee");

        case "use_item":
          return await this.handleUseItem(action, gameState);

        case "pickup_item":
        case "reject_item":
          return await this.handleItemChoice(action, gameState);

        case "equip_item":
          return await this.handleEquipItem(action, gameState);

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
    if (gameState.character.currentHealth > gameState.character.maxHealth) {
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
   * NEW FLOW: Generate event type only, present to user for Accept/Reject
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
   * Handle combat actions (attack, flee)
   * Orchestrates combat by calling dice roll and damage calculation utilities
   */
  private async handleCombatAction(
    action: PlayerAction,
    gameState: GameState,
    combatType: "attack" | "flee"
  ): Promise<GameServiceResponse> {
    if (!gameState.enemy) {
      return {
        success: false,
        gameState,
        message: "No enemy to fight",
        error: "No active enemy"
      };
    }

    if (combatType === "flee") {
      return await this.handleFlee(action, gameState);
    }

    // Handle attack
    const combatResult = await this.resolveCombat(
      gameState.character,
      gameState.enemy
    );

    // Generate combat narrative via LLM
    const combatContext = this.buildCombatContext(gameState, combatResult);
    const narrativeDescription = await this.llmService.generateDescription(
      "Combat",
      combatContext
    );

    // Save combat event
    await BackendService.saveEvent(
      action.campaignId,
      narrativeDescription,
      "Combat",
      {
        combatResult,
        characterDamage: combatResult.characterDamage,
        enemyDamage: combatResult.enemyDamage
      }
    );

    // Update character and enemy health via backend
    await BackendService.updateCharacter(gameState.character.id, {
      currentHealth: combatResult.characterHealth
    });

    // Check combat outcome
    if (combatResult.outcome === "enemy_defeated") {
      await BackendService.setCurrentEnemy(action.campaignId, null);

      // TODO: Uncomment when handlePostCombatRewards is implemented
      // await this.handlePostCombatRewards(action.campaignId, gameState);

      gameState.currentPhase = "exploration";

      // Reset descriptive counter after enemy defeat
      // Allows descriptive events to occur again after combat
      // TODO: Only reset for boss defeats when enemy.isBoss field is available in database
      // REQUIRED: Add isBoss boolean field to enemies table and Enemy type
      // THEN: Change condition to: if (enemy.isBoss) this.resetDescriptiveCount();
      this.resetDescriptiveCount();
    } else if (combatResult.outcome === "character_defeated") {
      await BackendService.updateCampaign(action.campaignId, {
        state: "game_over"
      });
      gameState.currentPhase = "game_over";
    }

    // Get updated game state
    const updatedState = await this.getGameState(action.campaignId);

    // Validate state
    const validation = await this.validateGameState(action.campaignId);

    return {
      success: true,
      gameState: updatedState,
      message: narrativeDescription,
      combatResult,
      choices: this.getChoicesForPhase(updatedState.currentPhase)
    };
  }

  /**
   * Handle flee attempt
   */
  private async handleFlee(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    // TODO: Use diceRoll utility when implemented
    // For now, 50% chance to flee
    const fleeSuccess = Math.random() > 0.5;

    if (fleeSuccess) {
      // Clear enemy and return to exploration
      await BackendService.setCurrentEnemy(action.campaignId, null);

      const message = "You successfully fled from combat!";
      await BackendService.saveEvent(
        action.campaignId,
        message,
        "Descriptive",
        { action: "flee_success" }
      );

      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward", "Search Area"]
      };
    } else {
      // Failed to flee, enemy gets free attack
      const message = "You failed to flee! The enemy strikes!";

      // TODO: Use combat utility when implemented
      const damage = Math.max(
        0,
        (gameState.enemy?.attack || 0) - gameState.character.defense
      );
      const newHealth = Math.max(0, gameState.character.currentHealth - damage);

      await BackendService.updateCharacter(gameState.character.id, {
        currentHealth: newHealth
      });

      await BackendService.saveEvent(action.campaignId, message, "Combat", {
        action: "flee_failed",
        damage
      });

      const updatedState = await this.getGameState(action.campaignId);

      // Check if character died
      if (newHealth <= 0) {
        await BackendService.updateCampaign(action.campaignId, {
          state: "game_over"
        });
        updatedState.currentPhase = "game_over";
      }

      return {
        success: true,
        gameState: updatedState,
        message: `${message} You took ${damage} damage!`,
        choices: this.getChoicesForPhase(updatedState.currentPhase)
      };
    }
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

    // TODO: Get item from backend and apply effects
    const item = await BackendService.getItem(itemId);

    // Apply item effects (basic implementation)
    if (item.healAmount) {
      const newHealth = Math.min(
        gameState.character.maxHealth,
        gameState.character.currentHealth + item.healAmount
      );
      await BackendService.updateCharacter(gameState.character.id, {
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
      await BackendService.addItemToInventory(gameState.character.id, itemId);
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

    // Determine slot based on item type
    let slot: "weapon" | "armor" | "shield";
    if (item.type === "weapon") slot = "weapon";
    else if (item.type === "armor") slot = "armor";
    else if (item.type === "shield") slot = "shield";
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
   * - On Accept: Executes multi-call LLM flow (description + stat boost + dice roll)
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

    // ACCEPT - Execute multi-call LLM flow
    if (action.actionType === "accept_event") {
      const context = await this.buildLLMContext(gameState);
      const eventType = pendingEvent.eventType as EventTypeString;

      // Step 1: Trigger EventType handler
      // Increments descriptive counter or executes type-specific logic
      await this.triggerEventType(eventType);

      // Step 2: Generate event description via LLM
      const description = await this.llmService.generateDescription(
        eventType,
        context
      );

      let finalMessage = description;
      const statChanges = { health: 0, attack: 0, defense: 0 };
      let diceRoll = 0;
      let rollClassification:
        | "critical_failure"
        | "regular"
        | "critical_success"
        | undefined;

      // Step 3: For stat-affecting events, get LLM stat boost + apply three-tier dice formula
      if (eventType === "Environmental" || eventType === "Combat") {
        const statBoost = await this.llmService.requestStatBoost(
          context,
          eventType
        );

        // TODO: Uncomment when Dice_Roll is available
        // Roll dice using Dice_Roll service (d20)
        // diceRoll = Dice_Roll.roll();
        // rollClassification = Dice_Roll.classifyRoll(diceRoll);
        diceRoll = Math.floor(Math.random() * 20) + 1; // Temporary: random d20
        rollClassification =
          diceRoll >= 16
            ? "critical_success"
            : diceRoll <= 4
            ? "critical_failure"
            : "regular";

        // Map stat types: health→VIT, attack→ATK, defense→DEF
        const statTypeMap: Record<string, StatType> = {
          health: "VIT",
          attack: "ATK",
          defense: "DEF"
        };

        // TODO: Uncomment when Stat_Calc is available
        // Apply three-tier dice system via Stat_Calc
        // 1-4: Critical failure = 0 gain
        // 5-15: Regular = scaled by formula
        // 16-20: Critical success = 2× base value
        // const finalValue = Math.round(
        //   Stat_Calc.applyRoll(
        //     diceRoll,
        //     statTypeMap[statBoost.statType],
        //     statBoost.baseValue
        //   )
        // );
        // Temporary implementation until Stat_Calc is available:
        let finalValue: number;
        if (diceRoll >= 1 && diceRoll <= 4) {
          finalValue = 0; // Critical failure
        } else if (diceRoll >= 5 && diceRoll <= 15) {
          finalValue = Math.round(
            statBoost.baseValue * (1 + (diceRoll - 10) / 10)
          ); // Regular
        } else {
          finalValue = statBoost.baseValue * 2; // Critical success
        }

        statChanges[statBoost.statType] = finalValue;

        // Display message with roll classification icons
        const rollIcon =
          rollClassification === "critical_failure"
            ? "💀"
            : rollClassification === "critical_success"
            ? "✨"
            : "🎲";
        const statSign = finalValue > 0 ? "+" : "";
        finalMessage += ` [${rollIcon} ${diceRoll}] ${statBoost.statType.toUpperCase()} ${statSign}${finalValue}`;

        // On critical success, apply bonus stat
        if (rollClassification === "critical_success") {
          // TODO: Implement bonusStatRequest flow
          // REQUIREMENTS:
          // - Call llmService.bonusStatRequest() to get bonus stat type and value
          // - Add bonus value to statChanges object: statChanges[bonusStat.statType] += bonusStat.value
          // - Append to finalMessage: ` + BONUS ${bonusStat.statType.toUpperCase()} +${bonusStat.value}!`
          // - Include in event data for logging
          console.log(
            "[GameService] Critical success bonus stat - NOT YET IMPLEMENTED"
          );
        }
      }

      // Step 3.5: Handle Item_Drop events
      if (eventType === "Item_Drop") {
        // TODO: Implement Item_Drop event handling
        // REQUIREMENTS:
        // - Call llmService.RequestItemDrop() to generate item
        // - Create item in database via BackendService.createItem()
        // - Present choice to user: [Pick Up] [Leave It]
        // - Store itemId in actionData for pickup_item/reject_item handlers
        console.log("[GameService] Item_Drop event - NOT YET IMPLEMENTED");
      }

      // Step 4: Apply stat changes to database
      await this.applyStatChanges(action.campaignId, statChanges);

      // Step 5: Save event to logs
      await BackendService.saveEvent(
        action.campaignId,
        finalMessage,
        eventType,
        { statChanges, diceRoll }
      );

      // Step 6: Clear pending event
      await BackendService.clearPendingEvent(action.campaignId);

      // Step 7: Check if Combat event spawns enemy
      if (eventType === "Combat") {
        const enemy = await BackendService.getRandomEnemy();
        await BackendService.setCurrentEnemy(action.campaignId, enemy.id);
        gameState.currentPhase = "combat";
      } else {
        gameState.currentPhase = "exploration";
      }

      // Get updated game state
      const updatedState = await this.getGameState(action.campaignId);
      updatedState.pendingEvent = undefined; // Clear pending event

      // Validate state
      await this.validateGameState(action.campaignId);

      return {
        success: true,
        gameState: updatedState,
        message: finalMessage,
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
   */
  private async getGameState(campaignId: number): Promise<GameState> {
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
      health: 50,
      attack: 10,
      defense: 5
    };

    return {
      character: {
        name: gameState.character.name,
        health: gameState.character.currentHealth,
        maxHealth: gameState.character.maxHealth,
        attack: gameState.character.attack,
        defense: gameState.character.defense
      },
      enemy: {
        name: enemy.name,
        health: enemy.health,
        attack: enemy.attack,
        defense: enemy.defense
      },
      recentEvents
    };
  }

  /**
   * Build combat-specific LLM context
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
        maxHealth: gameState.character.maxHealth,
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
   * Uses Dice_Roll service and applies critical hit range (16-20)
   * TODO: Post-combat rewards should use Stat_Calc for three-tier system
   */
  private async resolveCombat(
    character: Character,
    enemy: Enemy
  ): Promise<CombatResult> {
    // Use Dice_Roll service for combat rolls
    // TODO: Uncomment when Dice_Roll is available
    // const diceRoll = Dice_Roll.roll();
    const diceRoll = Math.floor(Math.random() * 20) + 1; // Temporary: random d20
    const isCritical = diceRoll >= 16 && diceRoll <= 20; // Critical range per spec

    // Basic damage calculation
    // Note: Combat damage uses simple 2× multiplier, not three-tier system
    let characterDamageToEnemy = Math.max(1, character.attack - enemy.defense);
    if (isCritical) characterDamageToEnemy *= 2;

    const enemyDamageToCharacter = Math.max(
      1,
      enemy.attack - character.defense
    );

    // Apply damage
    const newEnemyHealth = Math.max(0, enemy.health - characterDamageToEnemy);
    const newCharacterHealth = Math.max(
      0,
      character.currentHealth - enemyDamageToCharacter
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
   * Handle post-combat rewards based on dice roll
   * Called after enemy is defeated to determine loot/stat rewards
   *
   * TODO: Implement full post-combat reward system
   * REQUIREMENTS:
   * - Roll dice to determine reward tier (critical_failure, regular, critical_success)
   * - Critical Success (16-20): Call both RequestItemDrop() AND bonusStatRequest()
   * - Regular (5-15): Call requestStatBoost() with Combat event type
   * - Critical Failure (1-4): No rewards
   * - Apply rewards to character using applyStatChanges()
   * - Save reward event to logs with appropriate message
   *
   * @param campaignId - Campaign ID for context
   * @param gameState - Current game state
   */
  private async handlePostCombatRewards(
    campaignId: number,
    gameState: GameState
  ): Promise<void> {
    // TODO: Implement post-combat reward logic
    console.log("[GameService] Post-combat rewards - NOT YET IMPLEMENTED");
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
    if (
      (action.actionType === "attack" || action.actionType === "flee") &&
      gameState.currentPhase !== "combat"
    ) {
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
        return ["Attack", "Flee", "Use Item"];
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
      Math.min(character.maxHealth, character.currentHealth + changes.health)
    );
    const newAttack = Math.max(0, character.attack + changes.attack);
    const newDefense = Math.max(0, character.defense + changes.defense);

    await BackendService.updateCharacter(character.id, {
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
   *
   * TODO: Uncomment when EventType is available
   */
  private async triggerEventType(eventType: EventTypeString): Promise<void> {
    // const eventTypeInstance = new EventType(eventType);
    // await eventTypeInstance.trigger();
    console.log(
      `[GameService] EventType.trigger(${eventType}) - Waiting for Event_type PR`
    );
  }

  /**
   * Get current descriptive event counter
   * Used to prevent multiple consecutive descriptive (flavor-only) events
   * Returns number of consecutive descriptive events that have occurred
   *
   * TODO: Uncomment when EventType is available
   */
  private getDescriptiveCount(): number {
    // return EventType.getDescriptiveCount();
    return 0; // Temporary: always allow descriptive events until EventType is available
  }

  /**
   * Reset descriptive event counter
   * Called after significant game events (e.g., boss defeats)
   * to allow descriptive events to occur again
   *
   * TODO: Uncomment when EventType is available
   */
  private resetDescriptiveCount(): void {
    // EventType.resetDescriptiveCount();
    console.log(
      "[GameService] EventType.resetDescriptiveCount() - Waiting for Event_type PR"
    );
    // TODO: Only reset for boss defeats when enemy.isBoss field is available in database
    // REQUIRED: Add isBoss boolean field to enemies table and Enemy type
    // THEN: Change condition to: if (enemy.isBoss) this.resetDescriptiveCount();
  }
}

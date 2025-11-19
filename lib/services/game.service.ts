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

import { LLMService } from "./llm.service.ts";
// TODO: Uncomment these imports when Event_type, Dice_Roll, Stat_Calc PR merges
import { Dice_Roll } from "../utils/diceRoll";
import { Stat_Calc } from "../utils/statCalc";
import { EventType } from "../utils/eventType";

import type {
  LLMGameContext,
  EventHistoryEntry,
  EventTypeString,
} from "../types/llm.types";
import type {
  PlayerAction,
  GameState,
  GameServiceResponse,
  CombatResult,
  GameValidation,
  Character,
  Enemy,
} from "../types/game.types";
import * as BackendService from "./backend.service.ts";

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
      temperature: 0.8,
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
          error: "Invalid action",
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
            error: "Invalid action type",
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
        error: error instanceof Error ? error.message : "Unknown error",
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
          reason: "Character has been defeated",
        },
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
          reason: "Campaign completed successfully",
        },
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
        isVictory,
      },
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
    // Build LLM context
    const context = await this.buildLLMContext(gameState);

    // Generate event type from LLM
    let eventType = await this.llmService.generateEventType(context);

    // Check descriptive counter to avoid too many boring events
    let attempts = 0;
    while (
      eventType === "Descriptive" &&
      EventType.getDescriptiveCount() > 1 && // Use EventType static method
      attempts < 3
    ) {
      console.log(
        `[GameService] Too many Descriptive events (${EventType.getDescriptiveCount()}), regenerating...`
      );
      eventType = await this.llmService.generateEventType(context);
      attempts++;
    }

    // Store pending event
    await BackendService.setPendingEvent(action.campaignId, eventType);

    // Create preview message
    const displayMessage = this.getEventPreviewMessage(eventType);

    // Get updated game state
    const updatedState = await this.getGameState(action.campaignId);
    updatedState.pendingEvent = { eventType, displayMessage };
    updatedState.currentPhase = "event_choice";

    return {
      success: true,
      gameState: updatedState,
      message: displayMessage,
      choices: ["Accept", "Reject"],
    };
  }

  /**
   * Handle combat action (attack or flee)
   * Combat is resolved as a single event/turn:
   * - Attack: Both character and enemy exchange blows
   * - Flee: Dice roll to escape (>10 succeeds, ≤10 fails and enemy attacks)
   */
  private async handleCombatAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] handleCombatAction - ${action.actionType}`);

    // Validate we're in combat
    if (!gameState.enemy) {
      return {
        success: false,
        gameState,
        message: "No enemy to fight!",
        error: "Not in combat",
      };
    }

    const character = gameState.character;
    const enemy = gameState.enemy;

    // Handle FLEE action
    if (action.actionType === "flee") {
      // Roll dice for flee attempt
      const fleeRoll = Dice_Roll.roll();

      if (fleeRoll > 10) {
        // SUCCESS: Escaped!
        await BackendService.setCurrentEnemy(action.campaignId, null);

        const message = `You rolled ${fleeRoll}! You successfully fled from the ${enemy.name}! 🏃`;

        await BackendService.saveEvent(action.campaignId, message, "Combat", {
          action: "flee",
          success: true,
          diceRoll: fleeRoll,
        });

        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "exploration";

        return {
          success: true,
          gameState: updatedState,
          message,
          choices: ["Continue Forward", "Search Area"],
        };
      } else {
        // FAILURE: Can't escape, enemy attacks!
        const enemyDamage = Math.max(1, enemy.attack - character.defense);
        const newCharacterHealth = Math.max(
          0,
          character.currentHealth - enemyDamage
        );

        // Update character HP
        await BackendService.updateCharacter(character.id, {
          currentHealth: newCharacterHealth,
        });

        const message = `You rolled ${fleeRoll}! Failed to flee! The ${enemy.name} strikes you for ${enemyDamage} damage! 💥`;

        await BackendService.saveEvent(action.campaignId, message, "Combat", {
          action: "flee",
          success: false,
          diceRoll: fleeRoll,
          damageDealt: 0,
          damageTaken: enemyDamage,
        });

        // Check if character died
        if (newCharacterHealth <= 0) {
          await BackendService.updateCampaign(action.campaignId, {
            state: "game_over",
          });

          const updatedState = await this.getGameState(action.campaignId);
          updatedState.currentPhase = "game_over";

          return {
            success: true,
            gameState: updatedState,
            message: `${message}\n\nYou have been defeated... 💀`,
            choices: [],
          };
        }

        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "combat";

        return {
          success: true,
          gameState: updatedState,
          message,
          choices: ["Attack", "Flee"],
        };
      }
    }

    // Handle ATTACK action
    if (action.actionType === "attack") {
      // Roll dice for attack
      const attackRoll = Dice_Roll.roll();
      const rollClassification = Dice_Roll.classifyRoll(attackRoll);

      // Calculate damage dealt to enemy
      let characterDamageToEnemy = Math.max(
        1,
        character.attack - enemy.defense
      );

      // Apply critical hit multiplier
      if (rollClassification === "critical_success") {
        characterDamageToEnemy *= 2; // Double damage on crit
      } else if (rollClassification === "critical_failure") {
        characterDamageToEnemy = 0; // Miss on critical failure
      }

      // Calculate damage taken from enemy (enemy always attacks back unless dead)
      const enemyDamageToCharacter = Math.max(
        1,
        enemy.attack - character.defense
      );

      // Apply damage to enemy
      const newEnemyHealth = Math.max(0, enemy.health - characterDamageToEnemy);

      // Build combat message
      let combatMessage = `You rolled ${attackRoll}! `;

      if (rollClassification === "critical_success") {
        combatMessage += `⚡ CRITICAL HIT! You strike the ${enemy.name} for ${characterDamageToEnemy} damage! `;
      } else if (rollClassification === "critical_failure") {
        combatMessage += `💀 CRITICAL MISS! Your attack fails! `;
      } else {
        combatMessage += `You hit the ${enemy.name} for ${characterDamageToEnemy} damage! `;
      }

      // Check if enemy is defeated
      if (newEnemyHealth <= 0) {
        // ENEMY DEFEATED!
        combatMessage += `The ${enemy.name} has been defeated! 🎉`;

        // Clear current enemy
        await BackendService.setCurrentEnemy(action.campaignId, null);

        // Process combat rewards
        await BackendService.processCombatRewards(
          action.campaignId,
          character.id,
          rollClassification,
          {
            characterName: character.name,
            characterStats: {
              health: character.currentHealth,
              maxHealth: character.maxHealth,
              attack: character.attack,
              defense: character.defense,
            },
            enemyDefeated: enemy.name,
          }
        );

        // Save combat event
        await BackendService.saveEvent(
          action.campaignId,
          combatMessage,
          "Combat",
          {
            action: "attack",
            victory: true,
            diceRoll: attackRoll,
            classification: rollClassification,
            damageDealt: characterDamageToEnemy,
            damageTaken: 0,
          }
        );

        // Reset descriptive counter after combat
        EventType.resetDescriptiveCount();

        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "exploration";

        return {
          success: true,
          gameState: updatedState,
          message: combatMessage,
          choices: ["Continue Forward", "Search Area"],
        };
      }

      // Enemy still alive - it attacks back
      combatMessage += `The ${enemy.name} strikes back for ${enemyDamageToCharacter} damage! ⚔️`;

      // Apply damage to character
      const newCharacterHealth = Math.max(
        0,
        character.currentHealth - enemyDamageToCharacter
      );

      // Update character HP
      await BackendService.updateCharacter(character.id, {
        currentHealth: newCharacterHealth,
      });

      // Update enemy HP (via setCurrentEnemy with updated data)
      // Note: We need to update the in-memory enemy state
      // For now, we'll rely on frontend to track enemy HP changes

      // Save combat event
      await BackendService.saveEvent(
        action.campaignId,
        combatMessage,
        "Combat",
        {
          action: "attack",
          victory: false,
          diceRoll: attackRoll,
          classification: rollClassification,
          damageDealt: characterDamageToEnemy,
          damageTaken: enemyDamageToCharacter,
          enemyHealthRemaining: newEnemyHealth,
        }
      );

      // Check if character died
      if (newCharacterHealth <= 0) {
        await BackendService.setCurrentEnemy(action.campaignId, null);
        await BackendService.updateCampaign(action.campaignId, {
          state: "game_over",
        });

        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "game_over";

        return {
          success: true,
          gameState: updatedState,
          message: `${combatMessage}\n\nYou have been defeated... 💀`,
          choices: [],
        };
      }

      // Build combat result for frontend
      const combatResult: CombatResult = {
        characterDamage: enemyDamageToCharacter,
        enemyDamage: characterDamageToEnemy,
        characterHealth: newCharacterHealth,
        enemyHealth: newEnemyHealth,
        diceRoll: attackRoll,
        isCritical: rollClassification === "critical_success",
        outcome: "ongoing",
        narrative: combatMessage,
      };

      // Get updated game state (but enemy HP won't reflect in DB)
      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "combat";

      // IMPORTANT: Update enemy health in game state for frontend
      if (updatedState.enemy) {
        updatedState.enemy.health = newEnemyHealth;
      }

      return {
        success: true,
        gameState: updatedState,
        message: combatMessage,
        choices: ["Attack", "Flee"],
        combatResult,
      };
    }

    // Unknown combat action
    return {
      success: false,
      gameState,
      message: "Invalid combat action",
      error: "Unknown action type",
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
        error: "Missing item ID",
      };
    }

    const item = await BackendService.getItem(itemId);

    // Apply item effects (basic implementation)
    if (item.healAmount) {
      const newHealth = Math.min(
        gameState.character.maxHealth,
        gameState.character.currentHealth + item.healAmount
      );
      await BackendService.updateCharacter(gameState.character.id, {
        currentHealth: newHealth,
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
      action: "use_item",
    });

    const updatedState = await this.getGameState(action.campaignId);

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: this.getChoicesForPhase(updatedState.currentPhase),
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
        action: "pickup",
      });

      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward", "Search Area"],
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
        choices: ["Continue Forward", "Search Area"],
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
        error: "Missing item ID",
      };
    }

    const item = await BackendService.getItem(itemId);

    // Determine slot based on item type
    let slot: "weapon" | "armour" | "shield";
    if (item.type === "weapon") slot = "weapon";
    else if (item.type === "armour") slot = "armour";
    else if (item.type === "shield") slot = "shield";
    else {
      return {
        success: false,
        gameState,
        message: "Item cannot be equipped",
        error: "Invalid item type for equipment",
      };
    }

    // Backend handles all stat calculations and equipment replacement
    await BackendService.equipItem(gameState.character.id, itemId, slot);

    const message = `You equipped ${item.name}!`;
    await BackendService.saveEvent(action.campaignId, message, "Item_Drop", {
      itemId,
      action: "equip",
    });

    const updatedState = await this.getGameState(action.campaignId);

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: this.getChoicesForPhase(updatedState.currentPhase),
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
        error: "No pending event",
      };
    }

    // REJECT - Clear pending event and generate new one
    if (action.actionType === "reject_event") {
      await BackendService.clearPendingEvent(action.campaignId);
      return this.handleExplorationAction(action, gameState);
    }

    // ACCEPT - Process the event with full utility integration
    if (action.actionType === "accept_event") {
      const eventType = pendingEvent.eventType as EventTypeString;

      // Build context for LLM calls
      const context = await this.buildLLMContext(gameState);

      // Create EventType instance for counter management
      const eventTypeHandler = new EventType(eventType);

      let message = "";
      let newPhase: GameState["currentPhase"] = "exploration";

      switch (eventType) {
        case "Descriptive":
          // Generate narrative description
          message = await this.llmService.generateDescription(
            eventType,
            context
          );

          // Increment descriptive counter via EventType
          EventType.incrementDescriptiveCount();

          console.log(
            `[GameService] Descriptive event processed. Counter: ${EventType.getDescriptiveCount()}`
          );
          break;

        case "Environmental":
          // Step 1: Generate description
          const envDescription = await this.llmService.generateDescription(
            eventType,
            context
          );

          // Step 2: Request stat boost from LLM (which stat and base value)
          const statBoost = await this.llmService.requestStatBoost(
            context,
            eventType
          );

          // Step 3: Roll dice using Dice_Roll utility
          const diceRoll = Dice_Roll.roll();
          const rollClassification = Dice_Roll.classifyRoll(diceRoll);

          // Step 4: Apply dice roll modifier using Stat_Calc utility
          const finalValue = Stat_Calc.applyRollFlexible(
            diceRoll,
            statBoost.statType, // Can be "health", "attack", or "defense"
            statBoost.baseValue
          );

          // Step 5: Update character stats
          if (statBoost.statType === "health") {
            const newHealth = Math.min(
              gameState.character.maxHealth,
              gameState.character.currentHealth + finalValue
            );
            await BackendService.updateCharacter(gameState.character.id, {
              currentHealth: newHealth,
            });
          } else if (statBoost.statType === "attack") {
            const newAttack = gameState.character.attack + finalValue;
            await BackendService.updateCharacter(gameState.character.id, {
              attack: newAttack,
            });
          } else if (statBoost.statType === "defense") {
            const newDefense = gameState.character.defense + finalValue;
            await BackendService.updateCharacter(gameState.character.id, {
              defense: newDefense,
            });
          }

          // Step 6: Trigger EventType to reset descriptive counter
          await eventTypeHandler.trigger();

          // Step 7: Build message with roll details
          const rollEmoji =
            rollClassification === "critical_success"
              ? "🎲✨ CRITICAL! "
              : rollClassification === "critical_failure"
              ? "🎲💀 FAILURE! "
              : "🎲 ";
          message = `${envDescription}\n\n${rollEmoji}Rolled ${diceRoll}: ${
            finalValue > 0 ? "+" : ""
          }${finalValue} ${statBoost.statType}`;

          console.log(
            `[GameService] Environmental event: Roll ${diceRoll} (${rollClassification}) → ${finalValue} ${statBoost.statType}`
          );
          break;

        case "Combat":
          // Step 1: Get random enemy FIRST (so we know which enemy to describe)
          const enemy = await BackendService.getRandomEnemy();

          // Step 2: Set as current enemy
          await BackendService.setCurrentEnemy(action.campaignId, enemy.id);

          // Step 3: Build context with enemy information
          const combatContext: LLMGameContext = {
            character: {
              name: gameState.character.name,
              health: gameState.character.currentHealth,
              maxHealth: gameState.character.maxHealth,
              attack: gameState.character.attack,
              defense: gameState.character.defense,
            },
            enemy: {
              name: enemy.name, // ← Pass actual enemy name to LLM
              health: enemy.health,
              attack: enemy.attack,
              defense: enemy.defense,
            },
            recentEvents: [],
            trigger: `${enemy.name} encounter in the dungeon`,
          };

          // Step 4: Generate description FOR THIS SPECIFIC ENEMY
          const combatDescription = await this.llmService.generateDescription(
            "Combat",
            combatContext
          );

          // Step 5: Change to combat phase
          newPhase = "combat";
          message = `${combatDescription}\n\n⚔️ ${enemy.name} appears! (HP: ${enemy.health}, ATK: ${enemy.attack}, DEF: ${enemy.defense})`;

          console.log(`[GameService] Combat event: ${enemy.name} spawned`);
          break;

        case "Item_Drop":
          // Step 1: Generate description
          const itemDescription = await this.llmService.generateDescription(
            eventType,
            context
          );

          // Step 2: Request item from LLM
          const item = await this.llmService.RequestItemDrop(context);

          // Step 3: Add to inventory (routes to correct table internally)
          await BackendService.addItemToInventory(gameState.character.id, item);

          // Step 4: Trigger EventType to reset descriptive counter
          await eventTypeHandler.trigger();

          // Step 5: Build message
          message = `${itemDescription}\n\n📦 You found: ${item.itemName}!`;

          console.log(
            `[GameService] Item_Drop event: ${item.itemName} added to inventory`
          );
          break;
      }

      // Save event to database logs
      await BackendService.saveEvent(action.campaignId, message, eventType, {
        diceRoll: eventType === "Environmental" ? Dice_Roll.roll() : undefined,
        eventType: eventType,
      });

      // Clear pending event from state
      await BackendService.clearPendingEvent(action.campaignId);

      // Get updated game state from database
      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = newPhase;
      updatedState.pendingEvent = undefined;

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: this.getChoicesForPhase(newPhase),
      };
    }

    return {
      success: false,
      gameState,
      message: "Invalid event choice action",
      error: "Unknown action type",
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
        displayMessage: this.getEventPreviewMessage(pendingEventType),
      };
    }

    return {
      campaign,
      character,
      enemy,
      recentEvents,
      currentPhase,
      pendingEvent,
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
          defense: 0,
        },
      })
    );

    // Use placeholder enemy if none exists
    const enemy = gameState.enemy || {
      name: "Unknown Creature",
      health: 50,
      attack: 10,
      defense: 5,
    };

    return {
      character: {
        name: gameState.character.name,
        health: gameState.character.currentHealth,
        maxHealth: gameState.character.maxHealth,
        attack: gameState.character.attack,
        defense: gameState.character.defense,
      },
      enemy: {
        name: enemy.name,
        health: enemy.health,
        attack: enemy.attack,
        defense: enemy.defense,
      },
      recentEvents,
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
        maxHealth: gameState.character.maxHealth,
        attack: gameState.character.attack,
        defense: gameState.character.defense,
      },
      enemy: {
        name: enemy.name,
        health: combatResult.enemyHealth,
        attack: enemy.attack,
        defense: enemy.defense,
      },
      recentEvents: [],
      trigger: `combat round - dice roll: ${combatResult.diceRoll}${
        combatResult.isCritical ? " (CRITICAL!)" : ""
      }`,
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
    character: Character,
    enemy: Enemy
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
      narrative: "", // Will be filled by LLM
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
      warnings: [],
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
      Math.min(character.maxHealth, character.currentHealth + changes.health)
    );
    const newAttack = Math.max(0, character.attack + changes.attack);
    const newDefense = Math.max(0, character.defense + changes.defense);

    await BackendService.updateCharacter(character.id, {
      currentHealth: newHealth,
      attack: newAttack,
      defense: newDefense,
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
      Item_Drop: "Something catches your eye nearby...",
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
  private async triggerEventType(eventType: EventTypeString): Promise<void> {
    // TODO: Uncomment when EventType is available
    // const eventTypeInstance = new EventType(eventType);
    // await eventTypeInstance.trigger();
  }

  /**
   * Get descriptive event counter
   * Uses EventType static method
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
    // TODO: Uncomment when EventType is available
    // EventType.resetDescriptiveCount();
  }
}

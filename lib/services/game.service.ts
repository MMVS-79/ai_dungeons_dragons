/**
 * Game Service - COMPLETE REWRITE FOR NEW ARCHITECTURE
 * =====================================================
 * Key changes:
 * - Forced event engagement (no accept/reject)
 * - Investigation prompts for Environmental/Item_Drop
 * - Combat snapshot system
 * - Two-log combat system (encounter + conclusion)
 * - Temporary item buffs in combat
 * - Rarity/difficulty-based loot selection
 */

import { LLMService } from "./llm.service";
import { Dice_Roll } from "../utils/diceRoll";
import { Stat_Calc } from "../utils/statCalc";
import { EventType } from "../utils/eventType";
import {
  calculateItemRarity,
  calculateEnemyDifficulty,
  calculateCombatRewardRarity,
  getRarityRange,
  getDifficultyRange,
  BALANCE_CONFIG,
} from "../utils/lootFormulas";
import {
  createCombatSnapshot,
  getCombatSnapshot,
  updateEnemyHp,
  updateCharacterHp,
  applyTemporaryBuff,
  removeItemFromSnapshot,
  addCombatLogEntry,
  clearCombatSnapshot,
  getEffectiveAttack,
  getEffectiveDefense,
} from "../utils/combatSnapshot";

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
  Item,
  Equipment,
  CombatSnapshot,
} from "../types/game.types";
import {
  setInvestigationPrompt,
  getInvestigationPrompt,
  clearInvestigationPrompt,
} from "../utils/investigationPrompt";
import * as BackendService from "./backend.service";

export class GameService {
  private llmService: LLMService;

  constructor(llmApiKey: string) {
    this.llmService = new LLMService({
      apiKey: llmApiKey,
      model: "gemini-flash-lite-latest",
      temperature: 0.8,
    });
  }

  // ==========================================================================
  // MAIN ORCHESTRATION
  // ==========================================================================

  async processPlayerAction(
    action: PlayerAction
  ): Promise<GameServiceResponse> {
    try {
      const gameState = await this.getGameState(action.campaignId);

      // Block actions if game is over
      if (gameState.campaign.state === "game_over") {
        return {
          success: false,
          gameState,
          message: "This campaign has ended. Please start a new campaign.",
          error: "Campaign is in game_over state",
          choices: [],
        };
      }

      // Validate action
      const validation = this.validateAction(action, gameState);
      if (!validation.isValid) {
        return {
          success: false,
          gameState,
          message: validation.errors.join(", "),
          error: "Invalid action",
        };
      }

      // Route to appropriate handler
      switch (action.actionType) {
        case "continue":
          return await this.handleContinue(action, gameState);

        case "investigate":
          return await this.handleInvestigate(action, gameState);

        case "decline":
          return await this.handleDecline(action, gameState);

        case "attack":
          return await this.handleCombatAction(action, gameState, "attack");

        case "flee":
          return await this.handleCombatAction(action, gameState, "flee");

        case "use_item_combat":
          return await this.handleUseItemInCombat(action, gameState);

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
      const gameState = await this.getGameState(action.campaignId);
      return {
        success: false,
        gameState,
        message: "An error occurred processing your action",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ==========================================================================
  // CONTINUE (Generate Next Event)
  // ==========================================================================

  private async handleContinue(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] handleContinue - Generating next event`);

    // Check if this is a forced boss encounter
    const currentEventNumber =
      gameState.recentEvents.length > 0
        ? gameState.recentEvents[0].eventNumber
        : 0;

    const nextEventNumber = currentEventNumber + 1;

    // Force boss encounter after event 48
    if (nextEventNumber >= BALANCE_CONFIG.BOSS_FORCED_EVENT_START) {
      console.log(
        `[GameService] Forced boss encounter at event ${nextEventNumber}`
      );
      return await this.generateBossEncounter(
        action.campaignId,
        gameState,
        nextEventNumber
      );
    }

    // Generate random event type
    const context = await this.buildLLMContext(gameState);
    let eventType = await this.llmService.generateEventType(context);

    console.log(`[GameService] Generated event type: ${eventType}`);

    // Check descriptive counter
    let attempts = 0;
    while (
      eventType === "Descriptive" &&
      EventType.getDescriptiveCount() >= 2 &&
      attempts < 3
    ) {
      console.log(`[GameService] Too many Descriptive events, regenerating...`);
      eventType = await this.llmService.generateEventType(context);
      attempts++;
    }

    // Route to appropriate event handler
    switch (eventType) {
      case "Descriptive":
        return await this.handleDescriptiveEvent(
          action.campaignId,
          gameState,
          context
        );

      case "Environmental":
        return await this.handleEnvironmentalPrompt(
          action.campaignId,
          gameState
        );

      case "Combat":
        return await this.handleCombatPrompt(
          action.campaignId,
          gameState,
          nextEventNumber
        );

      case "Item_Drop":
        return await this.handleItemDropPrompt(action.campaignId, gameState);

      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }

  // ==========================================================================
  // DESCRIPTIVE EVENT (No investigation needed)
  // ==========================================================================

  private async handleDescriptiveEvent(
    campaignId: number,
    gameState: GameState,
    context: LLMGameContext
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] Processing Descriptive event`);

    // Generate description
    const description = await this.llmService.generateDescription(
      "Descriptive",
      context
    );

    // Increment descriptive counter
    EventType.incrementDescriptiveCount();

    // Save to logs
    await BackendService.saveEvent(campaignId, description, "Descriptive", {
      eventType: "Descriptive",
    });

    // Get updated state
    const updatedState = await this.getGameState(campaignId);
    updatedState.currentPhase = "exploration";

    return {
      success: true,
      gameState: updatedState,
      message: description,
      choices: ["Continue Forward"],
    };
  }

  // ==========================================================================
  // ENVIRONMENTAL EVENT (Investigation Prompt)
  // ==========================================================================

  private async handleEnvironmentalPrompt(
    campaignId: number,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] Environmental investigation prompt`);

    const message =
      "The environment around you begins to shift... Do you want to investigate?";

    // Store in memory
    setInvestigationPrompt(campaignId, "Environmental", message);

    const updatedState = await this.getGameState(campaignId);
    updatedState.currentPhase = "investigation_prompt";
    updatedState.investigationPrompt = {
      eventType: "Environmental",
      message,
    };

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: ["Investigate", "Decline"],
    };
  }

  // ==========================================================================
  // ITEM DROP EVENT (Investigation Prompt)
  // ==========================================================================

  private async handleItemDropPrompt(
    campaignId: number,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] Item Drop investigation prompt`);

    const message =
      "You notice something shiny nearby... Do you want to investigate?";

    // Store in memory
    setInvestigationPrompt(campaignId, "Item_Drop", message);

    const updatedState = await this.getGameState(campaignId);
    updatedState.currentPhase = "investigation_prompt";
    updatedState.investigationPrompt = {
      eventType: "Item_Drop",
      message,
    };

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: ["Investigate", "Decline"],
    };
  }

  // ==========================================================================
  // COMBAT EVENT (Investigation Prompt)
  // ==========================================================================

  private async handleCombatPrompt(
    campaignId: number,
    gameState: GameState,
    eventNumber: number
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] Combat investigation prompt`);

    const message = "You sense danger nearby... Do you want to investigate?";

    // Store in memory
    setInvestigationPrompt(campaignId, "Combat", message);

    const updatedState = await this.getGameState(campaignId);
    updatedState.currentPhase = "investigation_prompt";
    updatedState.investigationPrompt = {
      eventType: "Combat",
      message,
    };

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: ["Investigate", "Decline"],
    };
  }

  // ==========================================================================
  // INVESTIGATE (Accept Investigation)
  // ==========================================================================

  private async handleInvestigate(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] handleInvestigate - START`);

    // Get stored investigation prompt
    const storedPrompt = getInvestigationPrompt(action.campaignId);

    if (!storedPrompt) {
      console.error("[GameService] No investigation prompt found");
      return {
        success: false,
        gameState,
        message: "No investigation prompt active",
        error: "Invalid state - no stored prompt",
      };
    }

    const eventType = storedPrompt.eventType;
    console.log(`[GameService] Investigating ${eventType} event`);

    try {
      const diceRoll = action.actionData?.diceRoll || Dice_Roll.roll();
      console.log(`[GameService] Dice roll: ${diceRoll}`);

      let result: GameServiceResponse;

      switch (eventType) {
        case "Environmental":
          console.log("[GameService] Processing Environmental event...");
          result = await this.processEnvironmentalEvent(
            action.campaignId,
            gameState,
            diceRoll
          );
          break;

        case "Item_Drop":
          console.log("[GameService] Processing Item_Drop event...");
          result = await this.processItemDropEvent(
            action.campaignId,
            gameState,
            diceRoll
          );
          break;

        case "Combat":
          console.log("[GameService] Processing Combat event...");
          result = await this.processCombatEvent(
            action.campaignId,
            gameState,
            diceRoll
          );
          break;

        default:
          console.error(
            `[GameService] Unknown investigation type: ${eventType}`
          );
          throw new Error(`Unknown investigation type: ${eventType}`);
      }

      // Clear the stored prompt after processing
      clearInvestigationPrompt(action.campaignId);

      return result;
    } catch (error) {
      console.error("[GameService] Error in handleInvestigate:", error);
      console.error(
        "[GameService] Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );
      throw error;
    }
  }

  // ==========================================================================
  // DECLINE (Generate New Event)
  // ==========================================================================

  private async handleDecline(
    action: PlayerAction,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] handleDecline - Player declined investigation`);

    // Clear the stored prompt
    clearInvestigationPrompt(action.campaignId);

    try {
      // Generate a new event
      return await this.handleContinue(action, gameState);
    } catch (error) {
      console.error("[GameService] Error in handleDecline:", error);
      throw error;
    }
  }

  // ==========================================================================
  // PROCESS ENVIRONMENTAL EVENT
  // ==========================================================================

  private async processEnvironmentalEvent(
    campaignId: number,
    gameState: GameState,
    diceRoll: number
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] processEnvironmentalEvent - START`);
    console.log(`[GameService] Campaign: ${campaignId}, Dice: ${diceRoll}`);

    try {
      const context = await this.buildLLMContext(gameState);
      console.log(`[GameService] LLM context built`);

      // Generate description
      console.log(`[GameService] Generating description...`);
      const description = await this.llmService.generateDescription(
        "Environmental",
        context
      );
      console.log(
        `[GameService] Description generated: ${description.substring(
          0,
          50
        )}...`
      );

      // Request stat boost from LLM
      console.log(`[GameService] Requesting stat boost...`);
      const statBoost = await this.llmService.requestStatBoost(
        context,
        "Environmental"
      );
      console.log(
        `[GameService] Stat boost: ${statBoost.statType} ${statBoost.baseValue}`
      );

      // Apply dice roll modifier
      const rollClassification = Dice_Roll.classifyRoll(diceRoll);
      console.log(`[GameService] Roll classification: ${rollClassification}`);

      const finalValue = Stat_Calc.applyRoll(
        diceRoll,
        statBoost.statType.toUpperCase() as any,
        statBoost.baseValue
      );
      console.log(`[GameService] Final value: ${finalValue}`);

      // Update character stats
      console.log(`[GameService] Updating character stats...`);
      if (statBoost.statType === "health") {
        const newHealth = Math.min(
          gameState.character.maxHealth,
          gameState.character.currentHealth + finalValue
        );
        await BackendService.updateCharacter(gameState.character.id, {
          currentHealth: newHealth,
        });
        console.log(
          `[GameService] Health updated: ${gameState.character.currentHealth} -> ${newHealth}`
        );
      } else if (statBoost.statType === "attack") {
        const newAttack = gameState.character.attack + finalValue;
        await BackendService.updateCharacter(gameState.character.id, {
          attack: newAttack,
        });
        console.log(
          `[GameService] Attack updated: ${gameState.character.attack} -> ${newAttack}`
        );
      } else if (statBoost.statType === "defense") {
        const newDefense = gameState.character.defense + finalValue;
        await BackendService.updateCharacter(gameState.character.id, {
          defense: newDefense,
        });
        console.log(
          `[GameService] Defense updated: ${gameState.character.defense} -> ${newDefense}`
        );
      }

      // Reset descriptive counter
      EventType.resetDescriptiveCount();

      // Build message
      const rollEmoji =
        rollClassification === "critical_success"
          ? "🎲✨ CRITICAL! "
          : rollClassification === "critical_failure"
          ? "🎲💀 FAILURE! "
          : "🎲 ";

      const message = `${description}\n\n${rollEmoji}Rolled ${diceRoll}: ${
        finalValue > 0 ? "+" : ""
      }${finalValue} ${statBoost.statType}!`;

      // Save event
      console.log(`[GameService] Saving event...`);
      await BackendService.saveEvent(campaignId, message, "Environmental", {
        diceRoll,
        statType: statBoost.statType,
        statChange: finalValue,
      });

      // Get updated state
      console.log(`[GameService] Getting updated game state...`);
      const updatedState = await this.getGameState(campaignId);
      updatedState.currentPhase = "exploration";
      updatedState.investigationPrompt = undefined;

      console.log(`[GameService] processEnvironmentalEvent - SUCCESS`);
      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward"],
      };
    } catch (error) {
      console.error("[GameService] Error in processEnvironmentalEvent:", error);
      console.error(
        "[GameService] Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );
      throw error;
    }
  }

  // ==========================================================================
  // PROCESS ITEM DROP EVENT
  // ==========================================================================

  private async processItemDropEvent(
    campaignId: number,
    gameState: GameState,
    diceRoll: number
  ): Promise<GameServiceResponse> {
    console.log(
      `[GameService] Processing Item_Drop event with dice roll ${diceRoll}`
    );

    const context = await this.buildLLMContext(gameState);
    const eventNumber = gameState.recentEvents.length + 1;

    // Calculate target rarity using formula
    const targetRarity = calculateItemRarity(eventNumber, diceRoll);
    console.log(`[GameService] Target item rarity: ${targetRarity}`);

    // Get item from database by rarity
    const item = await BackendService.getItemByRarity(targetRarity);

    console.log(
      `[GameService] Selected item: ${item.name} (rarity ${item.rarity})`
    );

    // Generate description
    const description = await this.llmService.generateDescription(
      "Item_Drop",
      context
    );

    // Add item to inventory
    await BackendService.addItemToInventory(gameState.character.id, item.id);

    // Reset descriptive counter
    EventType.resetDescriptiveCount();

    // Build message
    const message = `${description}\n\n📦 You found: ${item.name}! (${item.description})`;

    // Save event
    await BackendService.saveEvent(campaignId, message, "Item_Drop", {
      diceRoll,
      itemId: item.id,
      itemName: item.name,
      itemRarity: item.rarity,
    });

    // Get updated state
    const updatedState = await this.getGameState(campaignId);
    updatedState.currentPhase = "exploration";
    updatedState.investigationPrompt = undefined;

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: ["Continue Forward"],
      itemFound: item,
    };
  }

  // ==========================================================================
  // PROCESS COMBAT EVENT (Initial Encounter)
  // ==========================================================================

  private async processCombatEvent(
    campaignId: number,
    gameState: GameState,
    diceRoll: number
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] processCombatEvent - START`);
    console.log(`[GameService] Campaign: ${campaignId}, Dice: ${diceRoll}`);

    try {
      const eventNumber = gameState.recentEvents.length + 1;
      console.log(`[GameService] Event number: ${eventNumber}`);

      // Calculate target difficulty using formula
      const targetDifficulty = calculateEnemyDifficulty(eventNumber, diceRoll);
      console.log(`[GameService] Target enemy difficulty: ${targetDifficulty}`);

      // Get enemy from database by difficulty
      console.log(`[GameService] Fetching enemy from database...`);
      const enemy = await BackendService.getEnemyByDifficulty(
        targetDifficulty,
        3,
        true
      );
      console.log(
        `[GameService] Selected enemy: ${enemy.name} (difficulty ${enemy.difficulty})`
      );

      // Generate encounter description
      console.log(`[GameService] Building LLM context...`);
      const context = await this.buildLLMContext(gameState);
      console.log(`[GameService] Generating encounter description...`);

      const encounterDescription = await this.llmService.generateDescription(
        "Combat",
        {
          ...context,
          enemy: {
            name: enemy.name,
            health: enemy.health,
            attack: enemy.attack,
            defense: enemy.defense,
          },
        }
      );
      console.log(
        `[GameService] Description generated: ${encounterDescription.substring(
          0,
          50
        )}...`
      );

      // Reset descriptive counter
      EventType.resetDescriptiveCount();

      // Build encounter message
      const encounterMessage = `${encounterDescription}\n\n⚔️ ${enemy.name} appears! (HP: ${enemy.health}, ATK: ${enemy.attack}, DEF: ${enemy.defense})`;

      // LOG #1: Combat encounter
      console.log(`[GameService] Saving combat encounter event...`);
      await BackendService.saveEvent(campaignId, encounterMessage, "Combat", {
        phase: "encounter",
        enemyId: enemy.id,
        enemyName: enemy.name,
        enemyDifficulty: enemy.difficulty,
        diceRoll,
      });

      // Create combat snapshot
      console.log(`[GameService] Creating combat snapshot...`);
      const snapshot: CombatSnapshot = {
        campaignId,
        enemy,
        enemyCurrentHp: enemy.health,
        characterSnapshot: {
          id: gameState.character.id,
          currentHealth: gameState.character.currentHealth,
          maxHealth: gameState.character.maxHealth,
          baseAttack: gameState.character.attack,
          baseDefense: gameState.character.defense,
        },
        inventorySnapshot: [...gameState.inventory],
        temporaryBuffs: {
          attack: 0,
          defense: 0,
        },
        combatLog: [],
        startedAt: new Date(),
      };

      createCombatSnapshot(snapshot);
      console.log(`[GameService] Combat snapshot created`);

      // Get updated state
      console.log(`[GameService] Getting updated game state...`);
      const updatedState = await this.getGameState(campaignId);
      updatedState.currentPhase = "combat";
      updatedState.investigationPrompt = undefined;
      updatedState.enemy = enemy;
      updatedState.combatState = {
        enemyCurrentHp: enemy.health,
        temporaryBuffs: {
          attack: 0,
          defense: 0,
        },
      };

      console.log(`[GameService] processCombatEvent - SUCCESS`);
      return {
        success: true,
        gameState: updatedState,
        message: encounterMessage,
        choices: ["Attack", "Flee", "Use Item"],
      };
    } catch (error) {
      console.error("[GameService] Error in processCombatEvent:", error);
      console.error(
        "[GameService] Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );
      throw error;
    }
  }
  // ==========================================================================
  // FORCED BOSS ENCOUNTER
  // ==========================================================================

  private async generateBossEncounter(
    campaignId: number,
    gameState: GameState,
    eventNumber: number
  ): Promise<GameServiceResponse> {
    console.log(
      `[GameService] Generating forced boss encounter at event ${eventNumber}`
    );

    // Get random boss
    const boss = await BackendService.getBossEnemy();

    console.log(
      `[GameService] Selected boss: ${boss.name} (difficulty ${boss.difficulty})`
    );

    // Generate encounter description
    const context = await this.buildLLMContext(gameState);
    const encounterDescription = await this.llmService.generateDescription(
      "Combat",
      {
        ...context,
        enemy: {
          name: boss.name,
          health: boss.health,
          attack: boss.attack,
          defense: boss.defense,
        },
      }
    );

    // Build encounter message
    const encounterMessage = `${encounterDescription}\n\n🔥 BOSS ENCOUNTER: ${boss.name}! (HP: ${boss.health}, ATK: ${boss.attack}, DEF: ${boss.defense})`;

    // LOG #1: Boss encounter
    await BackendService.saveEvent(campaignId, encounterMessage, "Combat", {
      phase: "encounter",
      enemyId: boss.id,
      enemyName: boss.name,
      enemyDifficulty: boss.difficulty,
      isBoss: true,
    });

    // Create combat snapshot
    const snapshot: CombatSnapshot = {
      campaignId,
      enemy: boss,
      enemyCurrentHp: boss.health,
      characterSnapshot: {
        id: gameState.character.id,
        currentHealth: gameState.character.currentHealth,
        maxHealth: gameState.character.maxHealth,
        baseAttack: gameState.character.attack,
        baseDefense: gameState.character.defense,
      },
      inventorySnapshot: [...gameState.inventory],
      temporaryBuffs: {
        attack: 0,
        defense: 0,
      },
      combatLog: [],
      startedAt: new Date(),
    };

    createCombatSnapshot(snapshot);

    // Get updated state
    const updatedState = await this.getGameState(campaignId);
    updatedState.currentPhase = "combat";
    updatedState.investigationPrompt = undefined;
    updatedState.enemy = boss;
    updatedState.combatState = {
      enemyCurrentHp: boss.health,
      temporaryBuffs: {
        attack: 0,
        defense: 0,
      },
    };

    return {
      success: true,
      gameState: updatedState,
      message: encounterMessage,
      choices: ["Attack", "Flee", "Use Item"],
    };
  }

  // ==========================================================================
  // COMBAT ACTION (Attack or Flee)
  // ==========================================================================

  private async handleCombatAction(
    action: PlayerAction,
    gameState: GameState,
    combatAction: "attack" | "flee"
  ): Promise<GameServiceResponse> {
    const snapshot = getCombatSnapshot(action.campaignId);

    if (!snapshot) {
      return {
        success: false,
        gameState,
        message: "No active combat session",
        error: "Missing combat snapshot",
      };
    }

    const diceRoll = action.actionData?.diceRoll || Dice_Roll.roll();
    const rollClassification = Dice_Roll.classifyRoll(diceRoll);

    // FLEE ACTION
    if (combatAction === "flee") {
      if (diceRoll > 10) {
        // Successful flee
        const message = `You rolled ${diceRoll}! You successfully fled from the ${snapshot.enemy.name}! 🏃`;

        // LOG #2: Combat conclusion (fled)
        await BackendService.saveEvent(action.campaignId, message, "Combat", {
          phase: "conclusion",
          outcome: "fled",
          diceRoll,
        });

        // Commit snapshot changes to database
        await this.commitCombatSnapshot(snapshot);

        // Clear snapshot
        clearCombatSnapshot(action.campaignId);

        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "exploration";

        return {
          success: true,
          gameState: updatedState,
          message,
          choices: ["Continue Forward"],
        };
      } else {
        // Failed flee - enemy attacks
        const enemyDamage = Math.max(
          1,
          snapshot.enemy.attack - getEffectiveDefense(snapshot)
        );
        const newCharacterHp = Math.max(
          0,
          snapshot.characterSnapshot.currentHealth - enemyDamage
        );

        updateCharacterHp(action.campaignId, newCharacterHp);

        const message = `You rolled ${diceRoll}! Failed to flee! The ${snapshot.enemy.name} strikes you for ${enemyDamage} damage! 💥`;

        addCombatLogEntry(action.campaignId, message);

        // Check if character died
        if (newCharacterHp <= 0) {
          // Character died
          const defeatMessage = `${message}\n\nYou have been defeated... 💀`;

          // LOG #2: Combat conclusion (defeat)
          await BackendService.saveEvent(
            action.campaignId,
            defeatMessage,
            "Combat",
            {
              phase: "conclusion",
              outcome: "character_defeated",
              diceRoll,
            }
          );

          // Commit snapshot (character death)
          await this.commitCombatSnapshot(snapshot);

          // Clear snapshot
          clearCombatSnapshot(action.campaignId);

          // Update campaign state
          await BackendService.updateCampaign(action.campaignId, {
            state: "game_over",
          });

          const updatedState = await this.getGameState(action.campaignId);
          updatedState.currentPhase = "game_over";

          return {
            success: true,
            gameState: updatedState,
            message: defeatMessage,
            choices: [],
          };
        }

        // Combat continues
        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "combat";
        updatedState.combatState = {
          enemyCurrentHp: snapshot.enemyCurrentHp,
          temporaryBuffs: snapshot.temporaryBuffs,
        };

        return {
          success: true,
          gameState: updatedState,
          message,
          choices: ["Attack", "Flee", "Use Item"],
        };
      }
    }

    // ATTACK ACTION
    let characterDamage = Math.max(
      1,
      getEffectiveAttack(snapshot) - snapshot.enemy.defense
    );

    // Apply critical modifiers
    if (rollClassification === "critical_success") {
      characterDamage *= 2;
    } else if (rollClassification === "critical_failure") {
      characterDamage = 0;
    }

    const enemyDamage = Math.max(
      1,
      snapshot.enemy.attack - getEffectiveDefense(snapshot)
    );

    // Apply damage
    const newEnemyHp = Math.max(0, snapshot.enemyCurrentHp - characterDamage);
    updateEnemyHp(action.campaignId, newEnemyHp);

    // Build message
    let combatMessage = `You rolled ${diceRoll}! `;

    if (rollClassification === "critical_success") {
      combatMessage += `⚡ CRITICAL HIT! You strike the ${snapshot.enemy.name} for ${characterDamage} damage! `;
    } else if (rollClassification === "critical_failure") {
      combatMessage += `💀 CRITICAL MISS! Your attack fails! `;
    } else {
      combatMessage += `You hit the ${snapshot.enemy.name} for ${characterDamage} damage! `;
    }

    addCombatLogEntry(action.campaignId, combatMessage);

    // Check if enemy defeated
    if (newEnemyHp <= 0) {
      combatMessage += `The ${snapshot.enemy.name} has been defeated! 🎉`;

      // Process combat rewards
      const rewardRarity = calculateCombatRewardRarity(
        snapshot.enemy.difficulty,
        diceRoll
      );
      const rewardMessage = await this.processCombatRewards(
        action.campaignId,
        snapshot,
        rewardRarity,
        diceRoll
      );

      const finalMessage = `${combatMessage}\n\n${rewardMessage}`;

      // LOG #2: Combat conclusion (victory)
      await BackendService.saveEvent(
        action.campaignId,
        finalMessage,
        "Combat",
        {
          phase: "conclusion",
          outcome: "enemy_defeated",
          diceRoll,
          rewardRarity,
        }
      );

      // Commit snapshot changes
      await this.commitCombatSnapshot(snapshot);

      // Clear snapshot
      clearCombatSnapshot(action.campaignId);

      // Reset descriptive counter
      EventType.resetDescriptiveCount();

      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message: finalMessage,
        choices: ["Continue Forward"],
        itemFound: rewardEquipment,
      };
    }

    // Enemy counterattack
    combatMessage += `The ${snapshot.enemy.name} strikes back for ${enemyDamage} damage! ⚔️`;

    const newCharacterHp = Math.max(
      0,
      snapshot.characterSnapshot.currentHealth - enemyDamage
    );

    updateCharacterHp(action.campaignId, newCharacterHp);

    addCombatLogEntry(action.campaignId, combatMessage);

    // Check if character died
    if (newCharacterHp <= 0) {
      const defeatMessage = `${combatMessage}\n\nYou have been defeated... 💀`;

      // LOG #2: Combat conclusion (defeat)
      await BackendService.saveEvent(
        action.campaignId,
        defeatMessage,
        "Combat",
        {
          phase: "conclusion",
          outcome: "character_defeated",
          diceRoll,
        }
      );

      // Commit snapshot
      await this.commitCombatSnapshot(snapshot);

      // Clear snapshot
      clearCombatSnapshot(action.campaignId);

      // Update campaign state
      await BackendService.updateCampaign(action.campaignId, {
        state: "game_over",
      });

      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "game_over";

      return {
        success: true,
        gameState: updatedState,
        message: defeatMessage,
        choices: [],
      };
    }

    // Combat continues
    const combatResult: CombatResult = {
      characterDamage: enemyDamage,
      enemyDamage: characterDamage,
      characterHealth: newCharacterHp,
      enemyHealth: newEnemyHp,
      diceRoll,
      isCritical: rollClassification === "critical_success",
      outcome: "ongoing",
      narrative: combatMessage,
    };

    const updatedState = await this.getGameState(action.campaignId);
    updatedState.currentPhase = "combat";
    updatedState.combatState = {
      enemyCurrentHp: newEnemyHp,
      temporaryBuffs: snapshot.temporaryBuffs,
    };

    return {
      success: true,
      gameState: updatedState,
      message: combatMessage,
      choices: ["Attack", "Flee", "Use Item"],
      combatResult,
    };
  }

  // ==========================================================================
  // USE ITEM IN COMBAT
  // ==========================================================================

  private async handleUseItemInCombat(
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

    const snapshot = getCombatSnapshot(action.campaignId);

    if (!snapshot) {
      return {
        success: false,
        gameState,
        message: "No active combat session",
        error: "Missing combat snapshot",
      };
    }

    // Find item in snapshot inventory
    const item = snapshot.inventorySnapshot.find((i) => i.id === itemId);

    if (!item) {
      return {
        success: false,
        gameState,
        message: "Item not found in inventory",
        error: "Invalid item ID",
      };
    }

    console.log(`[GameService] Using item ${item.name} in combat`);

    // Apply item effect
    let message = "";

    if (item.statModified === "health") {
      // Heal character
      const newHp = Math.min(
        snapshot.characterSnapshot.maxHealth,
        snapshot.characterSnapshot.currentHealth + item.statValue
      );
      updateCharacterHp(action.campaignId, newHp);
      message = `You used ${item.name} and restored ${item.statValue} HP!`;
    } else if (item.statModified === "attack") {
      // Temporary attack buff
      applyTemporaryBuff(action.campaignId, "attack", item.statValue);
      message = `You used ${item.name} and gained ${
        item.statValue > 0 ? "+" : ""
      }${item.statValue} attack for this battle!`;
    } else if (item.statModified === "defense") {
      // Temporary defense buff
      applyTemporaryBuff(action.campaignId, "defense", item.statValue);
      message = `You used ${item.name} and gained ${
        item.statValue > 0 ? "+" : ""
      }${item.statValue} defense for this battle!`;
    }

    // Remove item from snapshot
    removeItemFromSnapshot(action.campaignId, itemId);

    // Add to combat log
    addCombatLogEntry(action.campaignId, message);

    // Get updated snapshot
    const updatedSnapshot = getCombatSnapshot(action.campaignId);

    if (!updatedSnapshot) {
      return {
        success: false,
        gameState,
        message: "Combat snapshot lost",
        error: "Snapshot error",
      };
    }

    // Get updated state
    const updatedState = await this.getGameState(action.campaignId);
    updatedState.currentPhase = "combat";
    updatedState.combatState = {
      enemyCurrentHp: updatedSnapshot.enemyCurrentHp,
      temporaryBuffs: updatedSnapshot.temporaryBuffs,
    };

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: ["Attack", "Flee", "Use Item"],
    };
  }

  // ==========================================================================
  // COMBAT REWARDS
  // ==========================================================================

  private async processCombatRewards(
    campaignId: number,
    snapshot: CombatSnapshot,
    rewardRarity: number,
    diceRoll: number
  ): Promise<{
    message: string;
    equipment: Weapon | Armour | Shield;
  }> {
    console.log(
      `[GameService] Processing combat rewards with rarity ${rewardRarity}`
    );

    // Determine reward type randomly (weighted)
    const rewardRoll = Math.random();

    let rewardMessage = "💰 Victory Rewards:\n";

    if (rewardRoll < 0.33) {
      // WEAPON REWARD
      const weapon = await BackendService.getWeaponByRarity(rewardRarity);
      await BackendService.equipWeapon(
        snapshot.characterSnapshot.id,
        weapon.id
      );
      rewardMessage += `You found: ${weapon.name}! (+${weapon.attack} ATK)`;
    } else if (rewardRoll < 0.66) {
      // ARMOUR REWARD
      const armour = await BackendService.getArmourByRarity(rewardRarity);
      await BackendService.equipArmour(
        snapshot.characterSnapshot.id,
        armour.id
      );
      rewardMessage += `You found: ${armour.name}! (+${armour.health} Max HP)`;
    } else {
      // SHIELD REWARD
      const shield = await BackendService.getShieldByRarity(rewardRarity);
      await BackendService.equipShield(
        snapshot.characterSnapshot.id,
        shield.id
      );
      rewardMessage += `You found: ${shield.name}! (+${shield.defense} DEF)`;
    }

    return { message: rewardMessage, equipment };
  }

  // ==========================================================================
  // COMMIT COMBAT SNAPSHOT TO DATABASE
  // ==========================================================================

  private async commitCombatSnapshot(snapshot: CombatSnapshot): Promise<void> {
    console.log(
      `[GameService] Committing combat snapshot for campaign ${snapshot.campaignId}`
    );

    // Update character HP (temp buffs are NOT saved - they reset after combat)
    await BackendService.updateCharacter(snapshot.characterSnapshot.id, {
      currentHealth: snapshot.characterSnapshot.currentHealth,
    });

    // Update inventory (remove used items)
    const originalInventory = await BackendService.getInventory(
      snapshot.characterSnapshot.id
    );
    const usedItems = originalInventory.filter(
      (item) =>
        !snapshot.inventorySnapshot.some((snapItem) => snapItem.id === item.id)
    );

    for (const item of usedItems) {
      await BackendService.removeItemFromInventory(
        snapshot.characterSnapshot.id,
        item.id
      );
    }

    console.log(`[GameService] Combat snapshot committed successfully`);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getGameState(campaignId: number): Promise<GameState> {
    const campaign = await BackendService.getCampaign(campaignId);
    const { character, equipment, inventory } =
      await BackendService.getCharacterWithFullData(campaignId);
    const recentEvents = await BackendService.getRecentEvents(campaignId, 10);

    // Check if in combat
    const snapshot = getCombatSnapshot(campaignId);

    let currentPhase: GameState["currentPhase"] = "exploration";
    let enemy: Enemy | null = null;
    let combatState: GameState["combatState"] = undefined;
    let investigationPrompt: GameState["investigationPrompt"] = undefined;

    if (campaign.state === "game_over") {
      currentPhase = "game_over";
    } else if (campaign.state === "completed") {
      currentPhase = "victory";
    } else if (snapshot) {
      currentPhase = "combat";
      enemy = snapshot.enemy;
      combatState = {
        enemyCurrentHp: snapshot.enemyCurrentHp,
        temporaryBuffs: snapshot.temporaryBuffs,
      };
    } else {
      // Check for investigation prompt
      const storedPrompt = getInvestigationPrompt(campaignId);
      if (storedPrompt) {
        currentPhase = "investigation_prompt";
        investigationPrompt = storedPrompt;
      }
    }

    return {
      campaign,
      character,
      inventory,
      equipment,
      enemy,
      recentEvents,
      currentPhase,
      investigationPrompt,
      combatState,
    };
  }

  private async buildLLMContext(gameState: GameState): Promise<LLMGameContext> {
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

  private validateAction(
    action: PlayerAction,
    gameState: GameState
  ): GameValidation {
    const errors: string[] = [];

    if (gameState.currentPhase === "game_over") {
      errors.push("Game is over");
    }

    if (gameState.currentPhase === "victory") {
      errors.push("Campaign already completed");
    }

    // Combat actions only valid in combat
    if (
      (action.actionType === "attack" ||
        action.actionType === "flee" ||
        action.actionType === "use_item_combat") &&
      gameState.currentPhase !== "combat"
    ) {
      errors.push("Not in combat");
    }

    // Continue only valid in exploration
    if (
      action.actionType === "continue" &&
      gameState.currentPhase !== "exploration"
    ) {
      errors.push("Cannot continue during active event");
    }

    // Investigation actions only valid during investigation prompt
    if (
      (action.actionType === "investigate" ||
        action.actionType === "decline") &&
      gameState.currentPhase !== "investigation_prompt"
    ) {
      errors.push("No investigation prompt active");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  async validateGameState(campaignId: number): Promise<GameValidation> {
    const gameState = await this.getGameState(campaignId);
    const errors: string[] = [];
    const warnings: string[] = [];

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

    const isVictory = gameState.campaign.state === "completed";

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

    if (gameState.character.currentHealth > gameState.character.maxHealth) {
      warnings.push("Character health exceeds maximum");
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
}

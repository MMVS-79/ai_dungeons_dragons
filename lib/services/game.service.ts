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
  Weapon,
  Armour,
  Shield,
} from "../types/game.types";
import {
  setInvestigationPrompt,
  getInvestigationPrompt,
  clearInvestigationPrompt,
} from "../utils/investigationPrompt";
import * as BackendService from "./backend.service";
import pool from "../db";

export class GameService {
  private llmService: LLMService;

  constructor(llmApiKey: string) {
    this.llmService = new LLMService({
      apiKey: llmApiKey,
      model: "gemini-flash-lite-latest",
      temperature: 0.8,
    });
  }

  /**
   * Expose investigation prompt check for API route
   */
  public getStoredInvestigationPrompt(campaignId: number) {
    return getInvestigationPrompt(campaignId);
  }

  private async generateCampaignIntroduction(
    campaignId: number,
    gameState: GameState
  ): Promise<GameServiceResponse> {
    console.log(`[GameService] Generating campaign introduction`);

    // Get character race and class names from database
    const [raceRows] = await pool.query<any[]>(
      "SELECT name FROM races WHERE id = ?",
      [gameState.character.raceId]
    );
    const [classRows] = await pool.query<any[]>(
      "SELECT name FROM classes WHERE id = ?",
      [gameState.character.classId]
    );

    const raceName = raceRows[0]?.name || "adventurer";
    const className = classRows[0]?.name || "warrior";

    const introPrompt = `You are a D&D dungeon master starting a new 48-turn campaign. Create an epic introduction.

Character:
- Name: ${gameState.character.name}
- Race: ${raceName}
- Class: ${className}

Create a compelling introduction (3-4 sentences) that:
- Sets the dark, dangerous atmosphere of an ancient dungeon
- Explains that a legendary dragon boss threatens the world
- Describes why ${gameState.character.name} has ventured into this perilous place
- Builds anticipation and heroic purpose

Make it epic and immersive.

Your introduction:`;

    try {
      const result = await this.llmService.model.generateContent(introPrompt);
      const response = await result.response;
      const introduction = response.text().trim();

      console.log(
        `[GameService] Generated introduction: ${introduction.substring(
          0,
          100
        )}...`
      );

      // Save as first event
      await BackendService.saveEvent(campaignId, introduction, "Descriptive", {
        campaignIntro: true,
      });

      const updatedState = await this.getGameState(campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message: introduction,
        choices: ["Continue Forward"],
      };
    } catch (error) {
      console.error("[GameService] Error generating introduction:", error);

      // Fallback introduction
      const fallback = `${gameState.character.name}, a brave ${raceName} ${className}, stands at the entrance of an ancient dungeon. Deep within these cursed halls, a legendary dragon threatens the realm. Only by venturing into the darkness and facing unimaginable dangers can you hope to save the world from destruction.`;

      await BackendService.saveEvent(campaignId, fallback, "Descriptive", {
        campaignIntro: true,
      });

      const updatedState = await this.getGameState(campaignId);
      updatedState.currentPhase = "exploration";

      return {
        success: true,
        gameState: updatedState,
        message: fallback,
        choices: ["Continue Forward"],
      };
    }
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

    const currentEventNumber =
      gameState.recentEvents.length > 0
        ? gameState.recentEvents[0].eventNumber
        : 0;
    const nextEventNumber = currentEventNumber + 1;

    console.log(
      `[GameService] Recent events count: ${gameState.recentEvents.length}`
    );
    console.log(
      `[GameService] Current event number from DB: ${currentEventNumber}`
    );
    console.log(`[GameService] Next event number: ${nextEventNumber}`);

    // First event is campaign introduction
    if (nextEventNumber === 1) {
      return await this.generateCampaignIntroduction(
        action.campaignId,
        gameState
      );
    }

    // Check boss encounter (event 48)
    if (nextEventNumber >= BALANCE_CONFIG.BOSS_FORCED_EVENT_START) {
      console.log(
        `[GameService] Boss encounter triggered at event ${nextEventNumber}`
      );
      return await this.generateBossEncounter(
        action.campaignId,
        gameState,
        nextEventNumber
      );
    }

    // Build context
    const context = await this.buildLLMContext(gameState);

    // Count event types in recent history
    const recentEventTypes = gameState.recentEvents
      .slice(0, 5)
      .map((e) => e.eventType);
    const eventTypeCounts = recentEventTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count total descriptive events
    const allEvents = await BackendService.getRecentEvents(
      action.campaignId,
      100
    );
    const totalDescriptive = allEvents.filter(
      (e) => e.eventType === "Descriptive"
    ).length;

    console.log(`[GameService] Event distribution - Recent:`, eventTypeCounts);
    console.log(`[GameService] Total Descriptive events: ${totalDescriptive}`);

    // Generate event type
    let eventType = await this.llmService.generateEventType(context);

    // Enforce distribution rules
    // Rule 1: Max 2 of same type in last 5 events
    if (eventTypeCounts[eventType] >= 2) {
      console.log(
        `[GameService] ${eventType} appears ${eventTypeCounts[eventType]} times in recent history, selecting alternative`
      );

      // Find alternative event types
      const alternatives = [
        "Descriptive",
        "Environmental",
        "Combat",
        "Item_Drop",
      ].filter(
        (type) => (eventTypeCounts[type] || 0) < 2 && type !== eventType
      );

      if (alternatives.length > 0) {
        eventType = alternatives[
          Math.floor(Math.random() * alternatives.length)
        ] as any;
        console.log(`[GameService] Selected alternative: ${eventType}`);
      }
    }

    // Rule 2: Max 10 Descriptive events total
    if (eventType === "Descriptive" && totalDescriptive >= 10) {
      console.log(
        `[GameService] Max Descriptive events (10) reached, forcing alternative`
      );
      const alternatives = ["Environmental", "Combat", "Item_Drop"];
      eventType = alternatives[
        Math.floor(Math.random() * alternatives.length)
      ] as any;
      console.log(`[GameService] Selected alternative: ${eventType}`);
    }

    console.log(`[GameService] Final event type: ${eventType}`);

    // Route to appropriate handler
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

    // Get the prompt that was declined
    const storedPrompt = getInvestigationPrompt(action.campaignId);

    // Clear the stored prompt
    clearInvestigationPrompt(action.campaignId);

    try {
      // Log the decline event
      const declineMessages = {
        Environmental:
          "You sense something unusual in the environment but decide to move on, wary of potential dangers.",
        Combat:
          "You hear threatening sounds ahead but decide not to investigate, avoiding a potential encounter.",
        Item_Drop:
          "You notice something interesting but decide to keep moving, prioritizing safety over curiosity.",
      };

      const message = storedPrompt
        ? declineMessages[storedPrompt.eventType] ||
          "You decide to continue without investigating."
        : "You continue forward cautiously.";

      // Save with ORIGINAL event type
      const eventTypeToLog = storedPrompt?.eventType || "Descriptive";

      // Save decline event to logs
      await BackendService.saveEvent(
        action.campaignId,
        message,
        eventTypeToLog as EventTypeString,
        {
          declined: true,
        }
      );

      console.log(`[GameService] Decline event logged as ${eventTypeToLog}`);

      // Get updated state
      const updatedState = await this.getGameState(action.campaignId);
      updatedState.currentPhase = "exploration";
      updatedState.investigationPrompt = undefined;

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward"],
      };
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

      // Generate description
      const description = await this.llmService.generateDescription(
        "Environmental",
        context
      );

      // Request stat boost from LLM
      const statBoost = await this.llmService.requestStatBoost(
        context,
        "Environmental"
      );
      console.log(
        `[GameService] Stat boost requested: ${statBoost.statType} ${statBoost.baseValue}`
      );

      // Ensure baseValue is not 0, use defaults if needed
      let baseValue = statBoost.baseValue;
      if (baseValue === 0) {
        console.warn(`[GameService] LLM returned 0 baseValue, using default`);
        // Default values if LLM fails
        baseValue =
          statBoost.statType === "health"
            ? 10
            : statBoost.statType === "attack"
            ? 2
            : 2;
      }

      // Apply dice roll modifier
      const rollClassification = Dice_Roll.classifyRoll(diceRoll);
      const finalValue = Stat_Calc.applyRoll(
        diceRoll,
        statBoost.statType.toUpperCase() as any,
        statBoost.baseValue
      );

      console.log(
        `[GameService] Roll ${diceRoll} (${rollClassification}): base ${statBoost.baseValue} -> final ${finalValue}`
      );

      // Update character stats
      if (statBoost.statType === "health") {
        // Calculate actual max HP (base + armour)
        const armourBonus = gameState.equipment.armour?.health || 0;
        const actualMaxHp = gameState.character.maxHealth + armourBonus;
        const currentHp = gameState.character.currentHealth;
        const newHealth = Math.min(actualMaxHp, currentHp + finalValue);

        console.log(
          `[GameService] Health calculation: current=${currentHp}, change=+${finalValue}, new=${newHealth}, trueMax=${actualMaxHp}`
        );

        await BackendService.updateCharacter(gameState.character.id, {
          currentHealth: newHealth,
        });

        console.log(`[GameService] Health updated in database`);
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
      await BackendService.saveEvent(campaignId, message, "Environmental", {
        diceRoll,
        statType: statBoost.statType,
        statChange: finalValue,
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
      };
    } catch (error) {
      console.error("[GameService] Error in processEnvironmentalEvent:", error);
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

    const MAX_INVENTORY = 10;
    if (gameState.inventory.length >= MAX_INVENTORY) {
      console.log(
        `[GameService] Inventory full (${gameState.inventory.length}/${MAX_INVENTORY})`
      );

      const message =
        "You discover a valuable item, but your inventory is full! You must leave it behind...";

      await BackendService.saveEvent(campaignId, message, "Item_Drop", {
        inventoryFull: true,
        diceRoll,
      });

      EventType.resetDescriptiveCount();

      const updatedState = await this.getGameState(campaignId);
      updatedState.currentPhase = "exploration";
      updatedState.investigationPrompt = undefined;

      return {
        success: true,
        gameState: updatedState,
        message,
        choices: ["Continue Forward"],
      };
    }

    const context = await this.buildLLMContext(gameState);
    const eventNumber =
      gameState.recentEvents.length > 0
        ? gameState.recentEvents[0].eventNumber + 1
        : 1;

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
      //  Use actual event number from most recent event, not array length
      const eventNumber =
        gameState.recentEvents.length > 0
          ? gameState.recentEvents[0].eventNumber + 1
          : 1;

      console.log(`[GameService] Event number: ${eventNumber}`);
      console.log(
        `[GameService] Recent events:`,
        gameState.recentEvents.map((e) => e.eventNumber)
      );

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
        equipment: gameState.equipment,
        inventorySnapshot: [...gameState.inventory],
        originalInventoryIds: gameState.inventory.map((item) => item.id),
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
        choices: ["Attack", "Flee"],
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
      choices: ["Attack", "Flee"],
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

    // CHECK: Is this a boss fight?
    const isBoss = snapshot.enemy.difficulty >= 1000;

    const diceRoll = action.actionData?.diceRoll || Dice_Roll.roll();
    const rollClassification = Dice_Roll.classifyRoll(diceRoll);

    if (combatAction === "flee") {
      if (isBoss) {
        console.log(
          `[GameService] Cannot flee from boss: ${snapshot.enemy.name}`
        );

        // Add to combat log
        addCombatLogEntry(
          action.campaignId,
          "You cannot escape from this powerful foe!"
        );

        // Get updated state (still in combat)
        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "combat";
        updatedState.enemy = snapshot.enemy;
        updatedState.combatState = {
          enemyCurrentHp: snapshot.enemyCurrentHp,
          temporaryBuffs: snapshot.temporaryBuffs,
        };

        return {
          success: true,
          gameState: updatedState,
          message: `You try to flee, but the ${snapshot.enemy.name}'s presence is overwhelming! There is no escape from this legendary foe!`,
          choices: ["Attack", "Flee"],
        };
      }
    }

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
          choices: ["Attack", "Flee"],
        };
      }
    }

    // ATTACK ACTION
    // FORMULA: Base damage + dice modifier
    const baseDamage = Math.max(
      0,
      getEffectiveAttack(snapshot) - snapshot.enemy.defense
    );
    const diceModifier = diceRoll - 10; // -9 to +10 range
    let characterDamage = Math.max(1, baseDamage + diceModifier);

    console.log(
      `[GameService] Damage calc: base=${baseDamage}, dice mod=${diceModifier}, final=${characterDamage}`
    );

    // Enemy counterattack damage
    const baseEnemyDamage = Math.max(
      0,
      snapshot.enemy.attack - getEffectiveDefense(snapshot)
    );
    const enemyDiceModifier = -(diceRoll - 10); // Inverse for defense (high roll = less damage taken)
    const enemyDamage = Math.max(1, baseEnemyDamage + enemyDiceModifier);

    console.log(
      `[GameService] Enemy damage calc: base=${baseEnemyDamage}, dice mod=${enemyDiceModifier}, final=${enemyDamage}`
    );

    // Apply damage to enemy
    const newEnemyHp = Math.max(0, snapshot.enemyCurrentHp - characterDamage);
    updateEnemyHp(action.campaignId, newEnemyHp);

    // Build message
    let combatMessage = `You rolled ${diceRoll}! `;

    if (rollClassification === "critical_success") {
      combatMessage += `⚡ CRITICAL HIT! You strike the ${snapshot.enemy.name} for ${characterDamage} damage! `;
    } else if (rollClassification === "critical_failure") {
      combatMessage += `💀 CRITICAL MISS! You strike the ${snapshot.enemy.name} for only ${characterDamage} damage! `;
    } else {
      combatMessage += `You hit the ${snapshot.enemy.name} for ${characterDamage} damage! `;
    }

    addCombatLogEntry(action.campaignId, combatMessage);

    // Check if enemy defeated
    if (newEnemyHp <= 0) {
      combatMessage += `The ${snapshot.enemy.name} has been defeated! 🎉`;

      // CHECK: Is this a boss?
      const isBoss = snapshot.enemy.difficulty >= 1000;

      if (isBoss) {
        // BOSS: No rewards, just victory
        console.log(`[GameService] Boss defeated! No combat rewards.`);

        // Update campaign to completed
        await BackendService.updateCampaign(action.campaignId, {
          state: "completed",
        });

        const finalMessage = `${combatMessage}\n\n🎉 You have defeated the legendary ${snapshot.enemy.name}! Victory is yours!`;

        await BackendService.saveEvent(
          action.campaignId,
          finalMessage,
          "Combat",
          {
            phase: "conclusion",
            outcome: "boss_defeated",
            diceRoll,
          }
        );

        await this.commitCombatSnapshot(snapshot);
        clearCombatSnapshot(action.campaignId);
        EventType.resetDescriptiveCount();

        const updatedState = await this.getGameState(action.campaignId);
        updatedState.currentPhase = "victory";

        return {
          success: true,
          gameState: updatedState,
          message: finalMessage,
          choices: [],
        };
      }

      // NORMAL ENEMY: Process combat rewards
      const rewardRoll = Math.random();
      let rewardEquipment: Weapon | Armour | Shield | Item | null = null;
      let rewardMessage = "💰 Victory Rewards:\n";
      let rewardRarity: number = 0;

      if (rewardRoll < 0.05) {
        // EQUIPMENT REWARD (75%)
        rewardRarity = calculateCombatRewardRarity(
          snapshot.enemy.difficulty,
          diceRoll
        );
        const { message, equipment } = await this.processCombatRewards(
          action.campaignId,
          snapshot,
          rewardRarity,
          diceRoll
        );
        rewardMessage = message;
        rewardEquipment = equipment;
      } else {
        // ITEM REWARD (25%)
        // Check snapshot inventory, not database inventory
        const MAX_INVENTORY = 10;

        // Use snapshot inventory count (reflects items used during combat)
        const currentInventoryCount = snapshot.inventorySnapshot.length;

        console.log(
          `[GameService] Inventory check: ${currentInventoryCount}/${MAX_INVENTORY} (snapshot)`
        );

        if (currentInventoryCount >= MAX_INVENTORY) {
          console.log(
            `[GameService] Inventory full, cannot add combat reward item`
          );
          rewardMessage = `💰 Victory Rewards:\nYou found an item, but your inventory is full!`;
          rewardRarity = 0;
        } else {
          const eventNumber = gameState.recentEvents.length + 1;
          rewardRarity = calculateItemRarity(eventNumber, diceRoll);
          const item = await BackendService.getItemByRarity(rewardRarity);

          await BackendService.addItemToInventory(
            snapshot.characterSnapshot.id,
            item.id
          );

          rewardMessage = `💰 Victory Rewards:\nYou found: ${item.name}! (${item.description})`;
          rewardEquipment = item;
        }
      }
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
      choices: ["Attack", "Flee"],
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

    console.log(`[GameService] Using item ${itemId} in combat`);

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
      const armourBonus = gameState.equipment.armour?.health || 0;
      const trueMaxHp = snapshot.characterSnapshot.maxHealth + armourBonus;

      const newHp = Math.min(
        trueMaxHp, // Use true max HP, not base
        snapshot.characterSnapshot.currentHealth + item.statValue
      );

      updateCharacterHp(action.campaignId, newHp);
      message = `You used ${item.name} and restored ${item.statValue} HP!`;
      console.log(
        `[GameService] Healed: ${snapshot.characterSnapshot.currentHealth} -> ${newHp} (true max: ${trueMaxHp})`
      );
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

    // Remove item from snapshot ONLY (not from database during combat)
    removeItemFromSnapshot(action.campaignId, itemId);
    console.log(`[GameService] Item ${itemId} removed from combat snapshot`);

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

    // Return state with snapshot inventory (not database inventory)
    const updatedState = await this.getGameState(action.campaignId);
    updatedState.currentPhase = "combat";
    updatedState.enemy = snapshot.enemy;
    updatedState.inventory = updatedSnapshot.inventorySnapshot; // Use snapshot inventory during combat
    updatedState.combatState = {
      enemyCurrentHp: updatedSnapshot.enemyCurrentHp,
      temporaryBuffs: updatedSnapshot.temporaryBuffs,
    };

    return {
      success: true,
      gameState: updatedState,
      message,
      choices: ["Attack", "Flee"],
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
    let equipment: Weapon | Armour | Shield;

    if (rewardRoll < 0.33) {
      // WEAPON REWARD
      const weapon = await BackendService.getWeaponByRarity(rewardRarity);
      await BackendService.equipWeapon(
        snapshot.characterSnapshot.id,
        weapon.id
      );
      rewardMessage += `You found: ${weapon.name}! (+${weapon.attack} ATK)`;
      equipment = weapon;
    } else if (rewardRoll < 0.66) {
      // ARMOUR REWARD
      const armour = await BackendService.getArmourByRarity(rewardRarity);
      await BackendService.equipArmour(
        snapshot.characterSnapshot.id,
        armour.id
      );
      rewardMessage += `You found: ${armour.name}! (+${armour.health} Max HP)`;
      equipment = armour;
    } else {
      // SHIELD REWARD
      const shield = await BackendService.getShieldByRarity(rewardRarity);
      await BackendService.equipShield(
        snapshot.characterSnapshot.id,
        shield.id
      );
      rewardMessage += `You found: ${shield.name}! (+${shield.defense} DEF)`;
      equipment = shield;
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

    try {
      // Update character health in database
      await BackendService.updateCharacter(snapshot.characterSnapshot.id, {
        currentHealth: snapshot.characterSnapshot.currentHealth,
      });

      // Handle backwards compatibility for old snapshots
      if (!snapshot.originalInventoryIds) {
        console.warn(
          `[GameService] Old snapshot format detected, no originalInventoryIds`
        );
        console.log(
          `[GameService] Combat snapshot committed successfully (legacy format)`
        );
        return;
      }

      console.log(
        `[GameService] Original inventory IDs: ${snapshot.originalInventoryIds.join(
          ", "
        )}`
      );
      console.log(
        `[GameService] Current snapshot inventory IDs: ${snapshot.inventorySnapshot
          .map((i) => i.id)
          .join(", ")}`
      );

      // Count occurrences of each item ID
      const originalCounts = snapshot.originalInventoryIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const currentCounts = snapshot.inventorySnapshot.reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      console.log(`[GameService] Original counts:`, originalCounts);
      console.log(`[GameService] Current counts:`, currentCounts);

      // Find items that were used (compare counts)
      const itemsToRemove: number[] = [];
      for (const [itemIdStr, originalCount] of Object.entries(originalCounts)) {
        const itemId = Number(itemIdStr);
        const currentCount = currentCounts[itemId] || 0;
        const usedCount = originalCount - currentCount;

        if (usedCount > 0) {
          console.log(
            `[GameService] Item ${itemId}: used ${usedCount} times (had ${originalCount}, now ${currentCount})`
          );
          // Add itemId 'usedCount' times to removal list
          for (let i = 0; i < usedCount; i++) {
            itemsToRemove.push(itemId);
          }
        }
      }

      console.log(
        `[GameService] Items to remove: ${
          itemsToRemove.length > 0 ? itemsToRemove.join(", ") : "none"
        }`
      );

      // Remove used items from database
      for (const itemId of itemsToRemove) {
        console.log(`[GameService] Removing item ${itemId} from database...`);
        await BackendService.removeItemFromInventory(
          snapshot.characterSnapshot.id,
          itemId
        );
        console.log(`[GameService] ✓ Removed item ${itemId} from database`);
      }

      // Verify items were removed
      const finalInventory = await BackendService.getInventory(
        snapshot.characterSnapshot.id
      );
      console.log(
        `[GameService] Final DB inventory after commit: ${finalInventory
          .map((i) => i.id)
          .join(", ")}`
      );

      console.log(`[GameService] Combat snapshot committed successfully`);
    } catch (error) {
      console.error(`[GameService] Error committing combat snapshot:`, error);
      throw error;
    }
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
    let activeInventory = inventory; // Track which inventory to use
    let activeCharacter = character; // Track which character stats to use

    if (campaign.state === "game_over") {
      currentPhase = "game_over";
    } else if (campaign.state === "completed") {
      currentPhase = "victory";
    } else if (snapshot) {
      // DURING COMBAT: Use snapshot data instead of database
      currentPhase = "combat";
      enemy = snapshot.enemy;
      activeInventory = snapshot.inventorySnapshot; // Use snapshot inventory

      // Use snapshot character health
      activeCharacter = {
        ...character,
        currentHealth: snapshot.characterSnapshot.currentHealth,
      };

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
      character: activeCharacter,
      inventory: activeInventory,
      equipment,
      enemy,
      recentEvents,
      currentPhase,
      investigationPrompt,
      combatState,
    };
  }

  private async buildLLMContext(gameState: GameState): Promise<LLMGameContext> {
    const recentEvents = gameState.recentEvents.slice(0, 5).map((event) => ({
      eventType: event.eventType,
      message: event.message,
      eventNumber: event.eventNumber,
    }));

    const enemy = gameState.enemy || {
      name: "Unknown Creature",
      health: 50,
      attack: 10,
      defense: 5,
    };
    return {
      character: {
        name: gameState.character.name,
        currentHealth: gameState.character.currentHealth,
        maxHealth:
          gameState.character.maxHealth +
          (gameState.equipment.armour?.health || 0),
        attack: gameState.character.attack,
        defense: gameState.character.defense,
      },
      recentEvents,
      currentEventNumber: gameState.recentEvents.length + 1,
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

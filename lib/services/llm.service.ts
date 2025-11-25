/**
 * LLM Service - Gemini Integration
 * =================================
 * Handles all AI-generated content for the game
 */

import { GoogleGenAI } from "@google/genai";
import type {
  Item,
  Weapon,
  Armour,
  Shield,
  GameState
} from "../types/game.types";
import { pool } from "../db";
import type { RaceRow, ClassRow } from "../types/db.types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type EventTypeString =
  | "Descriptive"
  | "Environmental"
  | "Combat"
  | "Item_Drop";

export interface LLMContext {
  character: {
    name: string;
    currentHealth: number;
    maxHealth: number;
    attack: number;
    defense: number;
  };
  recentEvents: Array<{
    eventType: string;
    message: string;
    eventNumber: number;
  }>;
  currentEventNumber: number;
  enemy?: {
    name: string;
    health: number;
    attack: number;
    defense: number;
  };
}

interface StatBoostResponse {
  statType: "health" | "attack" | "defense";
  baseValue: number;
}

// ============================================================================
// LLM SERVICE CLASS
// ============================================================================

export class LLMService {
  private ai: GoogleGenAI;
  protected model: string;
  private generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };

  constructor() {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = "gemini-flash-lite-latest";

    this.generationConfig = {
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    };
  }

  // ==========================================================================
  // INTRODUCTION GENERATION
  // ==========================================================================

  public async generateCampaignIntroduction(
    campaignId: number,
    gameState: GameState
  ): Promise<string> {
    // Get character race and class names from database
    const [raceRows] = await pool.query<RaceRow[]>(
      "SELECT name FROM races WHERE id = ?",
      [gameState.character.raceId]
    );
    const [classRows] = await pool.query<ClassRow[]>(
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
- Creates a background for the character based on their name, race, and class (be creative)
- Sets the dark, dangerous atmosphere of an ancient dungeon
- Explains that a legendary monster boss of unknown type threatens the world
- Describes why ${gameState.character.name} has ventured into this perilous place
- Builds anticipation and heroic purpose

Make it epic and immersive.

Your introduction:`;

    try {
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: "user", parts: [{ text: introPrompt }] }],
        config: this.generationConfig
      });

      return result?.text?.trim() || "";
    } catch (error) {
      console.error("[LLMService] Error generating introduction:", error);

      // Fallback introduction
      const fallback = `${gameState.character.name}, a brave ${raceName} ${className}, stands at the entrance of an ancient dungeon. Deep within these cursed halls, a legendary dragon threatens the realm. Only by venturing into the darkness and facing unimaginable dangers can you hope to save the world from destruction.`;

      return fallback;
    }
  }

  // ==========================================================================
  // EVENT TYPE GENERATION
  // ==========================================================================

  /**
   * Generate event type based on game context
   */
  public async generateEventType(
    context: LLMContext
  ): Promise<EventTypeString> {
    const recentEventsText =
      context.recentEvents.length > 0
        ? context.recentEvents
            .filter((e) => e.message) // Filter out events without messages
            .map(
              (e) =>
                `- Event ${e.eventNumber} (${
                  e.eventType
                }): ${e.message.substring(0, 100)}...`
            )
            .join("\n")
        : "No recent events";

    const prompt = `You are a D&D dungeon master creating a 48-turn campaign. Generate the next event type based on context.

Context:
- Current Event Number: ${context.currentEventNumber}
- Character: ${context.character.name}
  - HP: ${context.character.currentHealth}/${context.character.maxHealth}
  - Attack: ${context.character.attack}
  - Defense: ${context.character.defense}

Recent Events:
${recentEventsText}

Event Types Available:
1. **Descriptive**: Atmospheric storytelling, world-building (30% chance)
2. **Environmental**: Interactive event that modifies character stats (25% chance)
3. **Combat**: Enemy encounter requiring tactical decisions (30% chance)
4. **Item_Drop**: Discovery of consumable items like potions (15% chance)

Selection Guidelines:
- Vary event types to maintain engagement
- Combat should be frequent but not overwhelming
- Environmental events provide character progression
- Balance action with storytelling

IMPORTANT: Return ONLY ONE WORD from this list: Descriptive, Environmental, Combat, Item_Drop
Do not include explanations, punctuation, or additional text.

Your response:`;

    try {
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: this.generationConfig
      });

      const text = result?.text?.trim() ?? "";

      // Extract first word
      const eventType = text.split(/[\s\n,.:;]/)[0].trim();

      // Validate against allowed types
      const validTypes: EventTypeString[] = [
        "Descriptive",
        "Environmental",
        "Combat",
        "Item_Drop"
      ];
      if (validTypes.includes(eventType as EventTypeString)) {
        return eventType as EventTypeString;
      }

      // Fallback if invalid
      console.warn(
        `[LLMService] Invalid event type "${eventType}", defaulting to Descriptive`
      );
      return "Descriptive";
    } catch (error) {
      console.error("[LLMService] Error generating event type:", error);
      return "Descriptive";
    }
  }

  // ==========================================================================
  // EVENT DESCRIPTION GENERATION
  // ==========================================================================

  /**
   * Generate descriptive narrative text for events
   */
  public async generateDescription(
    eventType: string,
    context: LLMContext,
    lootItem?: Item | Weapon | Armour | Shield
  ): Promise<string> {
    let prompt = "";

    switch (eventType) {
      case "Descriptive":
        prompt = this.buildDescriptivePrompt(context);
        break;
      case "Environmental":
        prompt = this.buildEnvironmentalPrompt(context);
        break;
      case "Combat":
        prompt = this.buildCombatPrompt(context);
        break;
      case "Item_Drop":
        prompt = this.buildItemDropPrompt(context, lootItem);
        break;
      default:
        prompt = `Create a brief description for: ${eventType}`;
    }

    try {
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: this.generationConfig
      });

      const text = result?.text?.trim() ?? "";

      return text;
    } catch (error) {
      console.error(
        `[LLMService] Error generating ${eventType} description:`,
        error
      );
      return this.getFallbackDescription(eventType, context, lootItem);
    }
  }

  private buildDescriptivePrompt(context: LLMContext): string {
    const lastEvent = context.recentEvents[0];
    const previousContext = lastEvent
      ? `\n\nPrevious event: ${lastEvent.message.substring(0, 150)}...`
      : "";

    return `You are a D&D dungeon master. Create an atmospheric description that flows naturally from the previous events.

Character: ${context.character.name} is exploring an ancient dungeon.${previousContext}

Create a SHORT (2-3 sentences) description that:
- Builds upon or contrasts with the previous atmosphere
- Introduces new environmental details
- Maintains narrative continuity
- Creates a sense of progression deeper into the dungeon

Your description:`;
  }

  private buildEnvironmentalPrompt(context: LLMContext): string {
    const healthPercent = Math.round(
      (context.character.currentHealth / context.character.maxHealth) * 100
    );

    return `You are a D&D dungeon master. Create a description of an environmental event that will affect the character.

Character Status:
- ${context.character.name}
- HP: ${context.character.currentHealth}/${context.character.maxHealth} (${healthPercent}%)
- Attack: ${context.character.attack}
- Defense: ${context.character.defense}

Create a SHORT (2-3 sentences) description of discovering an interactive environmental feature:
- Examples: mystical fountain, ancient training grounds, blessed shrine, cursed altar, magical artifact
- Should feel meaningful and impactful
- The stat modification will be determined separately

Your description:`;
  }

  private buildCombatPrompt(context: LLMContext): string {
    const enemyName = context.enemy?.name || "an unknown creature";
    const enemyStats = context.enemy
      ? `HP: ${context.enemy.health}, ATK: ${context.enemy.attack}, DEF: ${context.enemy.defense}`
      : "unknown power";

    return `You are a D&D dungeon master. Create a dramatic combat encounter description.

Character: ${context.character.name} (HP: ${context.character.currentHealth}/${context.character.maxHealth})
Enemy: ${enemyName} (${enemyStats})

Create a SHORT (2-3 sentences) description of the enemy appearing:
- The enemy's appearance, movement, or behavior
- The atmosphere and tension of the moment
- A sense of immediate danger

Build excitement and drama for the encounter.

Your description:`;
  }

  /**
   * Build item drop prompt with actual loot details, Uses item/equipment name and description directly
   */
  private buildItemDropPrompt(
    context: LLMContext,
    lootItem?: Item | Weapon | Armour | Shield
  ): string {
    // If no item provided (shouldn't happen), use generic prompt
    if (!lootItem) {
      return `You are a D&D dungeon master. Create a description of discovering loot.

Character: ${context.character.name} is exploring the dungeon.

Create a SHORT (2-3 sentences) description of finding loot:
- Where it's located (ancient chest, fallen adventurer, hidden alcove, ceremonial pedestal)
- Its physical appearance (color, glow, condition)
- A hint of its properties

Your description:`;
    }

    // Determine if it's equipment or item
    const isEquipment =
      "attack" in lootItem ||
      "defense" in lootItem ||
      ("health" in lootItem && !("statModified" in lootItem));

    let lootType = "item";
    let lootCategory = "consumable";

    if (isEquipment) {
      if ("attack" in lootItem) {
        lootType = "weapon";
        lootCategory = "weapon";
      } else if ("defense" in lootItem) {
        lootType = "shield";
        lootCategory = "shield";
      } else if ("health" in lootItem) {
        lootType = "armour";
        lootCategory = "armour piece";
      }
    } else {
      lootType = "consumable item";
      lootCategory = "potion or scroll";
    }

    // Use the actual item name and description for context
    return `You are a D&D dungeon master. Create a description of discovering specific loot.

Character: ${context.character.name} is exploring the dungeon.

Loot Being Found:
- Name: ${lootItem.name}
- Type: ${lootType}
- Description: ${lootItem.description || "A mysterious treasure"}

Create a SHORT (2-3 sentences) description that:
- Describes WHERE it's found (ancient chest, fallen adventurer, weapon rack, hidden alcove, ceremonial pedestal, dusty shelf)
- Describes its APPEARANCE in a way that matches "${lootItem.name}"
- Hints at what makes it special (based on the description)
- ${
      isEquipment
        ? "Makes it clear this is equipment ready to be wielded/worn"
        : "Makes it clear this is a consumable item"
    }

Important: 
- DO NOT reveal the exact name "${lootItem.name}" in your description
- Describe it generically as a ${lootCategory}
- Match the tone and quality suggested by the name

Your description:`;
  }

  private getFallbackDescription(
    eventType: string,
    context: LLMContext,
    lootItem?: Item | Weapon | Armour | Shield
  ): string {
    const fallbacks: Record<string, string> = {
      Descriptive:
        "The ancient dungeon corridor stretches before you, its stone walls weathered by countless centuries. Flickering torchlight casts dancing shadows across intricate carvings depicting long-forgotten legends.",
      Environmental:
        "You discover an ancient shrine emanating a strange mystical energy. The air around it seems to shimmer with power, beckoning you to approach.",
      Combat: `A ${
        context.enemy?.name || "fearsome creature"
      } emerges from the shadows, its eyes gleaming with hostile intent!`,
      Item_Drop: lootItem
        ? `Something ${
            "attack" in lootItem ||
            "defense" in lootItem ||
            ("health" in lootItem && !("statModified" in lootItem))
              ? "gleams"
              : "glints"
          } in the dim light ahead—${
            lootItem.name.toLowerCase().includes("potion")
              ? "a mystical vial"
              : lootItem.name.toLowerCase().includes("sword")
              ? "a finely crafted blade"
              : lootItem.name.toLowerCase().includes("shield")
              ? "a sturdy shield"
              : lootItem.name.toLowerCase().includes("armour")
              ? "protective gear"
              : "a valuable treasure"
          } resting on a weathered stone pedestal.`
        : "Something glints in the dim light ahead—a small vial resting on a weathered stone pedestal, its contents swirling with an otherworldly glow."
    };

    return fallbacks[eventType] || "You continue deeper into the dungeon.";
  }

  // ==========================================================================
  // STAT BOOST REQUEST (ENVIRONMENTAL EVENTS)
  // ==========================================================================

  /**
   * Request stat boost type and value for Environmental events
   * Validates and defaults to ensure non-zero values
   */
  public async requestStatBoost(
    context: LLMContext,
    eventType: string
  ): Promise<StatBoostResponse> {
    const healthPercent = Math.round(
      (context.character.currentHealth / context.character.maxHealth) * 100
    );

    const prompt = `You are a D&D game master. Recommend a stat boost for an Environmental event based on the character's current state.

Character Status:
- Name: ${context.character.name}
- Current HP: ${context.character.currentHealth}/${context.character.maxHealth} (${healthPercent}%)
- Attack: ${context.character.attack}
- Defense: ${context.character.defense}

Choose ONE stat type and provide a base value (can be positive OR negative):

**health**: HP change (positive = heal, negative = damage from hazard)
  - Base value: -5 to 15 HP
  - Positive values for healing, negative for environmental hazards
  - Priority: HIGH if HP < 50%

**attack**: Permanent attack change
  - Base value: -3 to 4 points
  - Usually positive, negative only for curses

**defense**: Permanent defense change
  - Base value: -3 to 4 points
  - Usually positive, negative only for curses

CRITICAL FORMATTING RULES:
1. Return ONLY a JSON object
2. NO markdown code blocks (no \`\`\`json)
3. NO explanatory text before or after
4. Must be valid JSON with exact format below

Required Format:
{"statType": "health", "baseValue": 12}

Valid statType values: "health", "attack", "defense"
Valid baseValue ranges:
- health: -5 to 15
- attack: -3 to 4
- defense: -3 to 4

Your JSON response:`;

    try {
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: this.generationConfig
      });

      let text = result?.text?.trim() ?? "";

      // Remove markdown code blocks if present
      text = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      // Extract JSON object using regex
      const jsonMatch = text.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        console.warn(
          "[LLMService] No JSON object found in response, using intelligent default"
        );
        return this.getIntelligentStatBoost(context);
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        statType: string;
        baseValue: number;
      };

      // Validate statType
      const validStatTypes: Array<"health" | "attack" | "defense"> = [
        "health",
        "attack",
        "defense"
      ];
      if (
        !validStatTypes.includes(
          parsed.statType as "health" | "attack" | "defense"
        )
      ) {
        console.warn(
          `[LLMService] Invalid statType: "${parsed.statType}", using intelligent default`
        );
        return this.getIntelligentStatBoost(context);
      }

      // Validate and clamp baseValue
      let baseValue = Number(parsed.baseValue);
      if (isNaN(baseValue)) {
        console.warn(
          `[LLMService] Invalid baseValue: ${parsed.baseValue}, using intelligent default`
        );
        return this.getIntelligentStatBoost(context);
      }

      // New ranges with negative values
      if (parsed.statType === "health") {
        baseValue = Math.max(-5, Math.min(15, Math.round(baseValue)));
      } else {
        baseValue = Math.max(-3, Math.min(4, Math.round(baseValue)));
      }

      return {
        statType: parsed.statType as "health" | "attack" | "defense",
        baseValue
      };
    } catch (error) {
      console.error("[LLMService] Error parsing stat boost:", error);
      return this.getIntelligentStatBoost(context);
    }
  }

  /**
   * Intelligent default stat boost based on character state
   */
  private getIntelligentStatBoost(context: LLMContext): StatBoostResponse {
    const healthPercent =
      (context.character.currentHealth / context.character.maxHealth) * 100;

    // 20% chance of negative effect
    const isNegative = Math.random() < 0.2;

    if (isNegative) {
      // Negative effect (hazard/curse)
      return { statType: "health", baseValue: -3 };
    }

    // Positive effects
    if (healthPercent < 50) {
      return { statType: "health", baseValue: 12 };
    } else if (healthPercent < 70) {
      return { statType: "health", baseValue: 10 };
    }

    const roll = Math.random();
    if (roll < 0.5) {
      return { statType: "attack", baseValue: 3 };
    } else {
      return { statType: "defense", baseValue: 3 };
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const llmService = new LLMService();

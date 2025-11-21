/**
 * LLM Service
 * -----------
 * Handles all LLM-based event generation and context tracking.
 *
 * Responsibilities:
 * - generateEventType(): Determines the type of event (Descriptive, Combat, etc.) based on context.
 * - generateDescription(): Generates narrative text for specific events.
 * - requestStatBoost(): Calculates dynamic stat changes for environmental/combat events.
 * - RequestItemDrop(): Generates balanced items for loot.
 * - bonusStatRequest(): Generates rewards for critical successes.
 *
 * Interacts With:
 * - Google Gemini API (via @google/genai)
 * - game.service.ts (called to generate content)
 * - Event_type.ts (called to handle specific event logic)
 */

import { GoogleGenAI } from "@google/genai";
import type {
  LLMGameContext,
  LLMEvent,
  LLMServiceConfig,
  EventTypeString,
  StatBoostResponse
} from "@/lib/types/llm.types";
import { HEALTH_PER_VITALITY } from "../contants";

const SCENARIOS = [
  "deep dungeon chamber",
  "ancient temple ruins",
  "dark forest path",
  "cave entrance",
  "abandoned tower",
  "underground crypt",
  "mountain pass",
  "swampy marshland"
];

const EVENT_TRIGGERS = [
  "as you explore",
  "while searching for clues",
  "during your investigation",
  "as you prepare to rest",
  "while checking for traps",
  "during a moment of quiet",
  "as you approach a door",
  "while examining the area"
];

export class LLMService {
  private ai: GoogleGenAI;
  private model: string;
  private temperature: number;
  private maxOutputTokens: number;
  private thinkingBudget: number;

  constructor(config: LLMServiceConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || "gemini-2.5-flash-lite";
    this.temperature = config.temperature ?? 0.8;
    this.maxOutputTokens = config.maxOutputTokens ?? 500;
    this.thinkingBudget = config.thinkingBudget ?? 0;
  }

  /**
   * Calls Gemini API with structured output
   */
  private async callGemini(
    prompt: string,
    schema?: Record<string, unknown>
  ): Promise<string> {
    // Default schema for backwards compatibility (old single-call system)
    const defaultSchema = {
      type: "object",
      properties: {
        event: { type: "string" },
        type: {
          type: "string",
          enum: ["Descriptive", "Combat", "Environmental", "Item_Drop"]
        },
        effects: {
          type: "object",
          properties: {
            health: { type: "number" },
            attack: { type: "number" },
            defense: { type: "number" }
          },
          required: ["health", "attack", "defense"]
        }
      },
      required: ["event", "type", "effects"]
    };

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema || defaultSchema,
        thinkingConfig: {
          thinkingBudget: this.thinkingBudget
        },
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens
      }
    });

    return response?.text ?? "";
  }

  /**
   * Utility: Get random item from array
   */
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate only the event TYPE (called by game.service.ts)
   * This is called first to determine what kind of event will occur
   * LLM returns just the type, user accepts/rejects, then Event_type.ts handles execution
   */
  async generateEventType(context: LLMGameContext): Promise<EventTypeString> {
    try {
      const prompt = this.buildEventTypePrompt(context);
      const response = await this.callGemini(prompt);
      const parsed = JSON.parse(response);

      const eventType = parsed.type;

      if (!eventType) {
        console.error("No event type in response:", parsed);
        return "Descriptive";
      }

      return eventType as EventTypeString;
    } catch (error) {
      console.error("Failed to generate event type:", error);
      return "Descriptive"; // Safe fallback
    }
  }

  /**
   * Generate event description (called by Event_type.ts and combat handler)
   * Called after user accepts the event
   * Returns narrative text describing what happened
   */
  async generateDescription(
    eventType: EventTypeString,
    context: LLMGameContext
  ): Promise<string> {
    try {
      const prompt = this.buildDescriptionPrompt(eventType, context);

      // Custom schema for description only
      const schema = {
        type: "object",
        properties: {
          description: { type: "string" }
        },
        required: ["description"]
      };

      const response = await this.callGemini(prompt, schema);
      const parsed = JSON.parse(response);

      if (!parsed.description) {
        console.error("No description in response:", parsed);
        return `A ${eventType} event occurs...`;
      }

      return parsed.description;
    } catch (error) {
      console.error("Failed to generate description:", error);
      return `A ${eventType} event occurs...`;
    }
  }

  /**
   * Request stat modification from LLM (called by Event_type.ts)
   * Returns which stat to modify and base value (before dice roll)
   * Used for Environmental and Combat events
   */
  async requestStatBoost(
    context: LLMGameContext,
    eventType: EventTypeString
  ): Promise<StatBoostResponse> {
    try {
      const prompt = this.buildStatBoostPrompt(eventType, context);

      // Custom schema for stat boost
      const schema = {
        type: "object",
        properties: {
          statType: {
            type: "string",
            enum: ["health", "attack", "defense"]
          },
          baseValue: { type: "number" }
        },
        required: ["statType", "baseValue"]
      };

      const response = await this.callGemini(prompt, schema);
      const parsed = JSON.parse(response);

      if (!parsed.statType || parsed.baseValue === undefined) {
        console.error("Invalid stat boost response:", parsed);
        return { statType: "health", baseValue: 0 };
      }

      return {
        statType: parsed.statType,
        baseValue: parsed.baseValue
      };
    } catch (error) {
      console.error("Failed to request stat boost:", error);
      return { statType: "health", baseValue: 0 }; // Safe fallback
    }
  }

  /**
   * Build prompt for event type generation only
   */
  private buildEventTypePrompt(context: LLMGameContext): string {
    const { character, enemy, recentEvents } = context;

    const eventHistory =
      recentEvents.length > 0
        ? recentEvents
            .map((event, i) => `${i + 1}. ${event.description} [${event.type}]`)
            .join("\n")
        : "(Adventure just beginning)";

    return `You are a D&D Dungeon Master. Decide what TYPE of event happens next.

CURRENT STATE:
- Character: ${character.name} (HP: ${character.health}/${
      character.vitality * HEALTH_PER_VITALITY
    }, ATK: ${character.attack}, DEF: ${character.defense})
- Enemy: ${enemy.name} (HP: ${enemy.health})

RECENT EVENTS:
${eventHistory}

EVENT TYPES:
- Descriptive: Pure story/atmosphere (no mechanical effects)
- Environmental: Hazards or blessings that affect stats
- Combat: Enemy encounter or combat scenario
- Item_Drop: Find or lose items

RULES:
- Avoid multiple consecutive Descriptive events
- Build tension toward boss encounters
- Match event intensity to character's current health

Return ONLY: {"type": "TYPE_HERE"}`;
  }

  /**
   * Build prompt for event description
   */
  private buildDescriptionPrompt(
    eventType: EventTypeString,
    context: LLMGameContext
  ): string {
    const { character, scenario, trigger } = context;
    const finalScenario = scenario || this.getRandomItem(SCENARIOS);
    const finalTrigger = trigger || this.getRandomItem(EVENT_TRIGGERS);

    return `You are a D&D Dungeon Master. Generate a vivid description for a ${eventType} event.

CHARACTER: ${character.name} (HP: ${character.health}/${
      character.vitality * HEALTH_PER_VITALITY
    })
LOCATION: ${finalScenario}
CONTEXT: ${finalTrigger}

Generate 1-2 dramatic sentences describing what happens.
Keep it specific and engaging.

Return JSON: {"description": "your description here"}`;
  }

  /**
   * Build prompt for stat boost request
   */
  private buildStatBoostPrompt(
    eventType: EventTypeString,
    context: LLMGameContext
  ): string {
    const { character } = context;

    return `You are a D&D Dungeon Master deciding stat modifications for a ${eventType} event.

CHARACTER STATE:
- HP: ${character.health}/${character.vitality * HEALTH_PER_VITALITY}
- Attack: ${character.attack}
- Defense: ${character.defense}

Decide which stat to modify and base value (before dice roll applies formula).

RULES:
- Health: -10 to +10 (healing/damage)
- Attack: -5 to +5 (buffs/debuffs)
- Defense: -5 to +5 (protection changes)
- Environmental events can be positive or negative
- Consider character's current state

Return JSON: {"statType": "health|attack|defense", "baseValue": number}`;
  }

  /**
   * Request item drop from LLM (called by Event_type.ts and post-combat rewards)
   * Used for Item_Drop event type and post-combat rewards
   *
   * @param context - Optional game context for contextual items
   * @returns Item details from LLM
   */
  public async RequestItemDrop(context?: LLMGameContext): Promise<{
    itemType: string;
    itemName: string;
    itemStats: Record<string, number>;
  }> {
    try {
      const prompt = this.buildItemDropPrompt(context);

      // Schema for item generation
      const schema = {
        type: "object",
        properties: {
          itemType: {
            type: "string",
            enum: ["weapon", "armor", "shield", "potion"]
          },
          itemName: { type: "string" },
          itemStats: {
            type: "object",
            additionalProperties: { type: "number" }
          }
        },
        required: ["itemType", "itemName", "itemStats"]
      };

      const response = await this.callGemini(prompt, schema);
      const parsed = JSON.parse(response);

      if (!parsed.itemType || !parsed.itemName || !parsed.itemStats) {
        console.error("Invalid item drop response:", parsed);
        return {
          itemType: "potion",
          itemName: "Health Potion",
          itemStats: { healAmount: 20 }
        };
      }

      return {
        itemType: parsed.itemType,
        itemName: parsed.itemName,
        itemStats: parsed.itemStats
      };
    } catch (error) {
      console.error("Failed to generate item drop:", error);
      return {
        itemType: "potion",
        itemName: "Health Potion",
        itemStats: { healAmount: 20 }
      };
    }
  }

  /**
   * Request bonus stat on critical success (called by Event_type.ts)
   * Used when player rolls 16-20 and deserves extra reward
   *
   * @param context - Optional game context for balanced bonuses
   * @returns Bonus stat type and value
   */
  public async bonusStatRequest(context?: LLMGameContext): Promise<{
    statType: "vitality" | "attack" | "defense";
    value: number;
  }> {
    try {
      const prompt = this.buildBonusStatPrompt(context);

      // Schema for bonus stat
      const schema = {
        type: "object",
        properties: {
          statType: {
            type: "string",
            enum: ["vitality", "attack", "defense"]
          },
          value: {
            type: "number",
            minimum: 2,
            maximum: 10
          }
        },
        required: ["statType", "value"]
      };

      const response = await this.callGemini(prompt, schema);
      const parsed = JSON.parse(response);

      if (!parsed.statType || parsed.value === undefined) {
        console.error("Invalid bonus stat response:", parsed);
        return { statType: "vitality", value: 1 };
      }

      // Clamp value to 2-10 range
      const clampedValue = Math.min(Math.max(parsed.value, 2), 10);

      return {
        statType: parsed.statType as "vitality" | "attack" | "defense",
        value: clampedValue
      };
    } catch (error) {
      console.error("Failed to generate bonus stat:", error);
      return { statType: "vitality", value: 1 };
    }
  }

  /**
   * Build prompt for item drop generation
   */
  private buildItemDropPrompt(context?: LLMGameContext): string {
    if (!context) {
      return `You are a D&D dungeon master distributing loot.

Generate ONE balanced item for an adventurer.

Item Types:
- weapon: Increases attack (example stats: { "attack": 5-15 })
- armor: Increases defense (example stats: { "defense": 3-12 })
- shield: Increases defense (example stats: { "defense": 2-8 })
- potion: Heals character (example stats: { "healAmount": 10-30 })

Requirements:
- Give the item a creative, fantasy-appropriate name
- Stats should be balanced (not overpowered)
- Consider typical D&D naming conventions

Return JSON: {"itemType": "weapon|armor|shield|potion", "itemName": "string", "itemStats": {}}`;
    }

    const { character } = context;
    const healthPercentage = Math.round(
      (character.health / (character.vitality * HEALTH_PER_VITALITY)) * 100
    );

    return `You are a D&D dungeon master distributing loot.

Character: ${character.name}
Current Stats:
- Health: ${character.health}/${
      character.vitality * HEALTH_PER_VITALITY
    } (${healthPercentage}%)
- Attack: ${character.attack}
- Defense: ${character.defense}

Generate ONE item appropriate for this character's level and situation.

Item Types:
- weapon: Increases attack (balanced for current attack ${character.attack})
- armor: Increases defense (balanced for current defense ${character.defense})
- shield: Increases defense (smaller bonus than armor)
- potion: Heals character (consider current health ${healthPercentage}%)

Requirements:
- Give the item a creative, fantasy-appropriate name
- Stats should be balanced - don't give +50 attack if they have 10 attack!
- Scale rewards to character level (estimate from stats)
- If health is low (< 50%), slightly favor potions

Return JSON: {"itemType": "weapon|armor|shield|potion", "itemName": "string", "itemStats": {}}

Example for weapon: {"itemType": "weapon", "itemName": "Rusty Longsword", "itemStats": {"attack": 7}}
Example for potion: {"itemType": "potion", "itemName": "Greater Health Potion", "itemStats": {"healAmount": 25}}`;
  }

  /**
   * Build prompt for bonus stat generation
   */
  private buildBonusStatPrompt(context?: LLMGameContext): string {
    if (!context) {
      return `You are a D&D dungeon master rewarding exceptional performance.

The player achieved a CRITICAL SUCCESS (rolled 16-20)!
Grant them a bonus stat increase.

Return JSON: {"statType": "health|attack|defense", "value": number (2-10)}`;
    }

    const { character } = context;
    const healthPercentage = Math.round(
      (character.health / (character.vitality * HEALTH_PER_VITALITY)) * 100
    );

    return `You are a D&D dungeon master rewarding exceptional performance.

Character: ${character.name}
Current Stats:
- Vitality: ${character.vitality}
- Attack: ${character.attack}
- Defense: ${character.defense}

The player achieved a CRITICAL SUCCESS (rolled 16-20)!
Grant them a bonus stat increase (2-10 points).

Guidelines:
- If health is very low (< 30%), strongly favor health
- If attack or defense are notably weak, consider boosting those
- Keep bonuses meaningful but balanced (2-10 range)
- Consider which stat would help them most right now

Return JSON: {"statType": "health|attack|defense", "value": number (2-10)}`;
  }
}

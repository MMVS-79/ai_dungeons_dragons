/**
 * LLM Service - Gemini API Integration
 * Generates D&D events based on game context with history awareness
 */

import { GoogleGenAI } from "@google/genai";
import type {
  LLMGameContext,
  LLMEvent,
  LLMServiceConfig,
  EventType
} from "@/lib/types/llm.types";

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

const FALLBACK_EVENTS: LLMEvent[] = [
  {
    event:
      "You notice ancient runes glowing faintly on the walls, their meaning lost to time.",
    type: "NARRATIVE",
    effects: { health: 0, attack: 0, defense: 0 }
  },
  {
    event:
      "A health potion falls from a crumbling shelf. You catch it just in time!",
    type: "ITEM_DROP",
    effects: { health: 5, attack: 0, defense: 0 }
  },
  {
    event:
      "You find an old shield leaning against the wall. It's still sturdy.",
    type: "ITEM_DROP",
    effects: { health: 0, attack: 0, defense: 3 }
  },
  {
    event: "A sudden chill fills the air. You feel weakened by dark magic.",
    type: "ENVIRONMENTAL",
    effects: { health: -5, attack: -2, defense: 0 }
  },
  {
    event: "You discover a blessed fountain. Its waters restore your vitality!",
    type: "ENVIRONMENTAL",
    effects: { health: 10, attack: 0, defense: 0 }
  }
];

export class LLMService {
  private ai: GoogleGenAI;
  private model: string;
  private temperature: number;
  private maxOutputTokens: number;
  private thinkingBudget: number;

  constructor(config: LLMServiceConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || "gemini-2.0-flash-lite";
    this.temperature = config.temperature ?? 0.8;
    this.maxOutputTokens = config.maxOutputTokens ?? 500;
    this.thinkingBudget = config.thinkingBudget ?? 0;
  }

  /**
   * Generates a D&D event based on game context with history
   * @param context - Current game state and previous events
   * @returns Generated event with type and effects
   */
  async generateEvent(context: LLMGameContext): Promise<LLMEvent> {
    try {
      const prompt = this.buildPrompt(context);
      const response = await this.callGemini(prompt);
      const event = this.parseResponse(response);

      return event;
    } catch (error) {
      console.error("LLM generation failed:", error);
      return this.getFallbackEvent();
    }
  }

  /**
   * Builds the prompt with game context and history
   * Incorporates previous events for narrative continuity
   */
  private buildPrompt(context: LLMGameContext): string {
    const { character, enemy, recentEvents, scenario, trigger } = context;

    // Use provided or random scenario/trigger
    const finalScenario = scenario || this.getRandomItem(SCENARIOS);
    const finalTrigger = trigger || this.getRandomItem(EVENT_TRIGGERS);

    // Build context from previous events WITH stat changes
    const eventHistory =
      recentEvents.length > 0
        ? recentEvents
            .map((event, i) => {
              const effectsStr = this.formatEffects(event.effects);
              return `${i + 1}. ${event.description} [${event.type}${
                effectsStr ? `, ${effectsStr}` : ""
              }]`;
            })
            .join("\n")
        : "(No previous events - this is the beginning of the adventure)";

    return `You are a D&D game master. Here are the rules for our game:

GAME MECHANICS:
- Characters have: Health, Attack, Defense stats
- Characters can equip items that modify these stats
- Players face bosses as main encounters
- Before bosses, random events occur that can:
  * Apply stat modifiers (temporary/permanent)
  * Drop/pickup items
  * Create environmental challenges

EVENT TYPES:
- NARRATIVE: Story/flavor events (effects should be 0,0,0)
- COMBAT_ACTION: Direct combat scenarios (may have negative effects)
- ENVIRONMENTAL: Environmental hazards or benefits (can affect any stats)
- ITEM_DROP: Items found or lost (usually positive effects)
- STAT_MODIFIER: Temporary/permanent stat changes (must have non-zero effects)

Keep descriptions vivid but concise (1-2 sentences). Events should build tension before boss encounters.

STAT EFFECTS RULES:
- Health: -10 to +10 (healing/damage)
- Attack: -5 to +5 (weapon bonuses/penalties)
- Defense: -5 to +5 (armor/protection changes)
- Use 0 for stats that don't change

CURRENT GAME STATE:
- Character: ${character.name} (HP: ${character.health}, ATK: ${character.attack}, DEF: ${character.defense})
- Enemy: ${enemy.name} (HP: ${enemy.health}, ATK: ${enemy.attack}, DEF: ${enemy.defense})

RECENT EVENTS (what happened before):
${eventHistory}

CONTEXT: You are in a ${finalScenario} ${finalTrigger}.

IMPORTANT: Generate the NEXT event that continues from the previous events. Make it specific and different from typical atmospheric descriptions. Consider what just happened and build on it naturally.

Generate a unique D&D event as JSON: {"event": "description", "type": "EVENT_TYPE", "effects": {"health": 0, "attack": 0, "defense": 0}}`;
  }

  /**
   * Calls Gemini API with structured output
   */
  private async callGemini(prompt: string): Promise<string> {
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
        responseSchema: {
          type: "object",
          properties: {
            event: { type: "string" },
            type: {
              type: "string",
              enum: [
                "NARRATIVE",
                "COMBAT_ACTION",
                "ENVIRONMENTAL",
                "ITEM_DROP",
                "STAT_MODIFIER"
              ]
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
        },
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
   * Parses and validates Gemini response
   */
  private parseResponse(response: string): LLMEvent {
    try {
      const parsed = JSON.parse(response);

      // Handle array responses (sometimes Gemini returns array)
      const eventData = Array.isArray(parsed) ? parsed[0] : parsed;

      // Validate structure
      if (!eventData.event || !eventData.type || !eventData.effects) {
        throw new Error("Invalid event structure");
      }

      return {
        event: eventData.event,
        type: eventData.type as EventType,
        effects: {
          health: Number(eventData.effects.health) || 0,
          attack: Number(eventData.effects.attack) || 0,
          defense: Number(eventData.effects.defense) || 0
        }
      };
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      throw error;
    }
  }

  /**
   * Returns a random fallback event if API fails
   */
  private getFallbackEvent(): LLMEvent {
    return this.getRandomItem(FALLBACK_EVENTS);
  }

  /**
   * Utility: Get random item from array
   */
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Formats stat effects for display in prompt
   */
  private formatEffects(effects: {
    health: number;
    attack: number;
    defense: number;
  }): string {
    const parts: string[] = [];

    if (effects.health !== 0) {
      parts.push(`HP ${effects.health > 0 ? "+" : ""}${effects.health}`);
    }
    if (effects.attack !== 0) {
      parts.push(`ATK ${effects.attack > 0 ? "+" : ""}${effects.attack}`);
    }
    if (effects.defense !== 0) {
      parts.push(`DEF ${effects.defense > 0 ? "+" : ""}${effects.defense}`);
    }

    return parts.join(", ");
  }
}

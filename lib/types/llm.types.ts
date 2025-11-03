/**
 * LLM Types
 * ----------
 * Shared TypeScript interfaces used by the LLMService for generating and interpreting
 * game events. Ensures consistent data structures between Backend, GameEngine, and WebClient.
 * 
 * Includes:
 * - LLMEvent:        { type, text, optional effects/data }
 * - LLMEventEffect:  { target, effectType, value, optional description }
 * - LLMGameContext:  { player info, enemy info, recentEvents, environment }
 * - Item:            { name, description, optional image, rarity, modifiers }
 * - Equipment:       { extends Item; slot, optional durability }
 * 
 * These types directly support:
 *  - llm.service.ts
 *  - gameEngine.service.ts
 *  - DB schema (items, armours, weapons, enemies, logs)
 *  - Frontend panels (eventPanel.tsx)
 */

// Event types matching your test-gemini.js
export type EventType =
  | "NARRATIVE"
  | "COMBAT_ACTION"
  | "ENVIRONMENTAL"
  | "ITEM_DROP"
  | "STAT_MODIFIER";

// Event history entry (what gets saved and passed as context)
export interface EventHistoryEntry {
  description: string; // What happened
  type: EventType; // Event type
  effects: {
    health: number;
    attack: number;
    defense: number;
  };
}

// Input: What the LLM service receives from game engine
export interface LLMGameContext {
  character: {
    name: string;
    health: number;
    attack: number;
    defense: number;
  };
  enemy: {
    name: string;
    health: number;
    attack: number;
    defense: number;
  };
  recentEvents: EventHistoryEntry[]; // Previous events with stats
  scenario?: string; // Optional: location/setting
  trigger?: string; // Optional: what prompted this event
}

// Output: What the LLM service returns to game engine
export interface LLMEvent {
  event: string; // Description of what happens
  type: EventType;
  effects: {
    health: number; // -10 to +10
    attack: number; // -5 to +5
    defense: number; // -5 to +5
  };
}

// Internal service configuration
export interface LLMServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
}

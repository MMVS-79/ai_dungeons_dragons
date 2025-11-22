/**
 * LLM Types
 * ----------
 * TypeScript interfaces for LLM service event generation and interpretation.
 * Ensures consistent data structures across backend, game engine, and frontend.
 *
 * Type Categories:
 * - Event types and strings for categorizing game events
 * - Game context for LLM prompt building
 * - Event responses from LLM with effects
 * - Stat boost responses for dynamic modifications
 * - Service configuration
 *
 * Used by:
 * - llm.service.ts - LLM API integration
 * - game.service.ts - Game orchestration
 * - Event_type.ts - Event handler routing
 * - Database schema (logs, events)
 */

// Event type strings used throughout the game system
export type EventTypeString =
  | "Descriptive" // Pure story/atmosphere (no mechanical effects)
  | "Environmental" // Stat modifications from environment (hazards/blessings)
  | "Combat" // Enemy encounters and combat scenarios
  | "Item_Drop"; // Items found or lost

// Event history entry (what gets saved and passed as context to LLM)
export interface EventHistoryEntry {
  description: string; // What happened in the event
  type: EventTypeString; // Event type for context
  effects: {
    health: number; // HP change
    attack: number; // Attack stat change
    defense: number; // Defense stat change
  };
}

// Input: What the LLM service receives from game engine
export interface LLMGameContext {
  character: {
    name: string;
    health: number;
    vitality: number;
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

// Stat boost response from LLM for dynamic stat modifications
// Used in multi-call LLM flow: LLM decides which stat and base value, dice roll modifies final value
export interface StatBoostResponse {
  statType: "health" | "attack" | "defense";
  baseValue: number; // Base value before dice roll modifier is applied
}

// Internal service configuration
export interface LLMServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
}

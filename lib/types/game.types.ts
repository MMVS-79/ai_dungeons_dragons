/**
 * Game Types
 * ----------
 * Shared TypeScript interfaces used by the GameEngine and related services.
 * Ensures consistent data structures between Backend, LLMService, and WebClient.
 *
 * These types directly support:
 *  - game.service.ts (GameService orchestrator)
 *  - llm.service.ts
 *  - DB schema (campaigns, characters, enemies, events)
 *  - Frontend panels (eventPanel.tsx, characterPanel.tsx)
 */

// ============================================================================
// ITEM & EQUIPMENT TYPES
// ============================================================================

export interface Item {
  id: number;
  name: string;
  health: number;
  image?: string;
  description?: string;
}

interface Equipment {
  id: number;
  name: string;
  health: number;
  image?: string;
  description?: string;
  rarity?: number;
}

export interface Weapon extends Equipment {
  attack: number;
}

export interface Armor extends Equipment {
  vitality: number;
}

export interface Shield extends Equipment {
  defense: number;
}

// ============================================================================
// UNIT TYPES
// ============================================================================

export interface Unit {
  id: number;
  name: string;
  vitality: number;
  attack: number;
  defense: number;
  spritePath?: string;
}

export interface Character extends Unit {
  campaignId: number;
  currentHealth: number;
  race: Unit;
  class: Unit;
  weapon?: Weapon;
  armor?: Armor;
  shield?: Shield;
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export interface Campaign {
  id: number;
  accountId: number;
  name: string;
  description?: string;
  state: "active" | "completed" | "game_over";
  createdAt: Date;
  updatedAt: Date;
}

export interface GameState {
  campaign: Campaign;
  character: Character;
  enemy: Unit | null;
  recentEvents: GameEvent[];
  currentPhase: GamePhase;
  pendingEvent?: {
    eventType: string; // "Descriptive", "Environmental", "Combat", "Item_Drop"
    displayMessage?: string; // Optional preview message
  };
}

export type GamePhase =
  | "exploration" // Player exploring, no active combat
  | "combat" // Active combat with enemy
  | "item_choice" // Player choosing whether to pick up item
  | "event_choice" // Player choosing to accept/reject event
  | "game_over" // Character died
  | "victory"; // Player won

// Event type strings for game events
export type EventTypeString =
  | "Descriptive"
  | "Environmental"
  | "Combat"
  | "Item_Drop";

// ============================================================================
// ACTION TYPES
// ============================================================================

export type ActionType =
  | "continue" // Continue exploring
  | "search" // Search for items
  | "attack" // Attack enemy
  | "use_item" // Use item from inventory
  | "pickup_item" // Pick up item
  | "reject_item" // Reject item
  | "equip_item" // Equip item
  | "accept_event" // Accept pending event
  | "reject_event"; // Reject pending event

export interface PlayerAction {
  campaignId: number;
  actionType: ActionType;
  actionData?: {
    itemId?: number;
    targetId?: number;
    [key: string]: unknown;
  };
}

// ============================================================================
// COMBAT TYPES
// ============================================================================

export interface CombatAction {
  type: "attack" | "use_item";
  itemId?: number;
}

export interface CombatResult {
  characterDamage: number;
  enemyDamage: number;
  characterHealth: number;
  enemyHealth: number;
  diceRoll: number;
  isCritical: boolean;
  outcome: "ongoing" | "character_defeated" | "enemy_defeated" | "fled";
  narrative: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface GameEvent {
  id: number;
  campaignId: number;
  message: string;
  eventNumber: number;
  eventType: EventTypeString;
  eventData?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface GameValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  gameState?: {
    isGameOver: boolean;
    isVictory: boolean;
    reason?: string;
  };
}

// ============================================================================
// GAME SERVICE RESPONSE TYPES
// ============================================================================

export interface GameServiceResponse {
  success: boolean;
  gameState: GameState;
  message: string;
  choices?: string[];
  combatResult?: CombatResult;
  error?: string;
}

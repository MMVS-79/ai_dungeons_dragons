/**
 * Game Types (UPDATED FOR NEW ARCHITECTURE)
 * ------------------------------------------
 * Updated for investigation prompts, forced event engagement,
 * combat snapshots, and temporary item buffs
 */

// ============================================================================
// ITEM & EQUIPMENT TYPES
// ============================================================================
import type { EventData } from './db.types';

export interface Item {
  id: number;
  name: string;
  rarity: number;
  statModified: 'health' | 'attack' | 'defense';
  statValue: number; // Positive = buff, Negative = curse
  description?: string;
  spritePath?: string;
}

export interface Equipment {
  weapon?: Weapon;
  armour?: Armour;
  shield?: Shield;
}

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  attack: number;
  description?: string;
  spritePath?: string;
}

export interface Armour {
  id: number;
  name: string;
  rarity: number;
  health: number; // Max HP bonus
  description?: string;
  spritePath?: string;
}

export interface Shield {
  id: number;
  name: string;
  rarity: number;
  defense: number;
  description?: string;
  spritePath?: string;
}

// ============================================================================
// CHARACTER & ENEMY TYPES
// ============================================================================

export interface Character {
  id: number;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  spritePath?: string;
  raceId: number;
  classId: number;
  campaignId: number;
  weaponId?: number;
  armourId?: number;
  shieldId?: number;
}

export interface Enemy {
  id: number;
  name: string;
  difficulty: number;
  health: number;
  attack: number;
  defense: number;
  spritePath?: string;
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
  inventory: Item[];
  equipment: Equipment;
  enemy: Enemy | null;
  recentEvents: GameEvent[];
  currentPhase: GamePhase;
  investigationPrompt?: {
    eventType: EventTypeString;
    message: string; // "Something stirs in the environment..."
  };
  // Combat-specific state (only present during combat)
  combatState?: {
    enemyCurrentHp: number;
    temporaryBuffs: {
      attack: number;
      defense: number;
    };
  };
}

export type GamePhase = 
  | "exploration"           // Normal exploration (Continue Forward)
  | "investigation_prompt"  // Asking to investigate (Yes/No)
  | "combat"                // Active combat
  | "game_over"
  | "victory";

export type EventTypeString = 'Descriptive' | 'Environmental' | 'Combat' | 'Item_Drop';

// ============================================================================
// ACTION TYPES (UPDATED)
// ============================================================================

export type ActionType =
  | "continue"              // Generate next event
  | "investigate"           // Accept investigation
  | "decline"               // Decline investigation
  | "attack"                // Combat attack
  | "flee"                  // Combat flee
  | "use_item_combat";      // Use item during combat

export interface PlayerAction {
  campaignId: number;
  actionType: ActionType;
  actionData?: {
    itemId?: number;
    targetId?: number;
    diceRoll?: number;
  };
}

// ============================================================================
// COMBAT TYPES
// ============================================================================

export interface CombatSnapshot {
  campaignId: number;
  enemy: Enemy;
  enemyCurrentHp: number;
  characterSnapshot: {
    id: number;
    currentHealth: number;
    maxHealth: number;
    baseAttack: number;
    baseDefense: number;
  };
  equipment?: Equipment; 
  inventorySnapshot: Item[];
  originalInventoryIds: number[];
  temporaryBuffs: {
    attack: number;
    defense: number;
  };
  combatLog: string[];
  createdAt: Date;
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
  eventData?: EventData;
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
  itemFound?: Item | Weapon | Armour | Shield | null;
  error?: string;
}
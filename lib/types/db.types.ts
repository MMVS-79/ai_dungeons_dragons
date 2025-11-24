/**
 * Database Row Types
 * ------------------
 * Type definitions for MySQL query results to eliminate 'any' types
 */

import { RowDataPacket, ResultSetHeader } from "mysql2";

// ============================================================================
// DATABASE ROW TYPES (snake_case as returned from MySQL)
// ============================================================================

export interface CharacterRow extends RowDataPacket {
  id: number;
  race_id: number;
  class_id: number;
  campaign_id: number;
  name: string;
  current_health: number;
  max_health: number;
  attack: number;
  defense: number;
  sprite_path: string | null;
  armour_id: number | null;
  weapon_id: number | null;
  shield_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface WeaponRow extends RowDataPacket {
  id: number;
  name: string;
  rarity: number;
  attack: number;
  description: string | null;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ArmourRow extends RowDataPacket {
  id: number;
  name: string;
  rarity: number;
  health: number;
  description: string | null;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShieldRow extends RowDataPacket {
  id: number;
  name: string;
  rarity: number;
  defense: number;
  description: string | null;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ItemRow extends RowDataPacket {
  id: number;
  name: string;
  rarity: number;
  stat_modified: "health" | "attack" | "defense";
  stat_value: number;
  description: string | null;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EnemyRow extends RowDataPacket {
  id: number;
  name: string;
  difficulty: number;
  health: number;
  attack: number;
  defense: number;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignRow extends RowDataPacket {
  id: number;
  account_id: number;
  name: string;
  description: string | null;
  state: "active" | "game_over" | "completed";
  created_at: Date;
  updated_at: Date;
}

export interface LogRow extends RowDataPacket {
  id: number;
  campaign_id: number;
  message: string;
  event_number: number;
  event_type: "Descriptive" | "Environmental" | "Combat" | "Item_Drop";
  event_data: string | null; // JSON string
  created_at: Date;
}

export interface RaceRow extends RowDataPacket {
  id: number;
  name: string;
  health: number;
  attack: number;
  defense: number;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClassRow extends RowDataPacket {
  id: number;
  name: string;
  health: number;
  attack: number;
  defense: number;
  sprite_path: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// EVENT DATA TYPES (stored as JSON in logs.event_data)
// ============================================================================

export interface CombatEncounterEventData {
  phase: "encounter";
  enemyId: number;
  enemyName: string;
  enemyDifficulty: number;
  diceRoll?: number;
  isBoss?: boolean;
}

export interface CombatConclusionEventData {
  phase: "conclusion";
  outcome: "enemy_defeated" | "character_defeated" | "fled" | "boss_defeated";
  diceRoll: number;
  rewardRarity?: number;
  lootReceived?: number[];
}

export interface EnvironmentalEventData {
  diceRoll: number;
  statType: "health" | "attack" | "defense";
  statChange: number;
}

export interface ItemDropEventData {
  diceRoll: number;
  lootType: "item" | "weapon" | "armour" | "shield";
  itemId?: number;
  itemName?: string;
  itemRarity?: number;
  equipmentId?: number;
  equipmentName?: string;
  equipmentRarity?: number;
  autoEquipped?: boolean;
  replaced?: string | null;
  inventoryFull?: boolean;
}

export interface DeclinedEventData {
  declined: true;
}

export interface CampaignIntroEventData {
  campaignIntro: true;
}

// Union type for all event data
export type EventData =
  | CombatEncounterEventData
  | CombatConclusionEventData
  | EnvironmentalEventData
  | ItemDropEventData
  | DeclinedEventData
  | CampaignIntroEventData
  | Record<string, unknown>; // Fallback for unknown structures

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

export interface InsertResult extends ResultSetHeader {
  insertId: number;
  affectedRows: number;
}

export interface UpdateResult extends ResultSetHeader {
  affectedRows: number;
  changedRows: number;
}

export interface DeleteResult extends ResultSetHeader {
  affectedRows: number;
}

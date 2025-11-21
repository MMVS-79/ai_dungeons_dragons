/**
 * Combat Snapshot System
 * =======================
 * In-memory storage for active combat sessions
 * Stores character/inventory state at combat start
 * Only commits changes to database after combat concludes
 */

import type { CombatSnapshot } from "../types/game.types";

// Global in-memory storage (resets on server restart)
declare global {
  var combatSnapshots: Map<number, CombatSnapshot> | undefined;
}

if (!global.combatSnapshots) {
  global.combatSnapshots = new Map<number, CombatSnapshot>();
}

/**
 * Create new combat snapshot
 */
export function createCombatSnapshot(snapshot: CombatSnapshot): void {
  global.combatSnapshots!.set(snapshot.campaignId, snapshot);
  console.log(`[CombatSnapshot] Created snapshot for campaign ${snapshot.campaignId}`);
}

/**
 * Get active combat snapshot
 */
export function getCombatSnapshot(campaignId: number): CombatSnapshot | null {
  return global.combatSnapshots!.get(campaignId) || null;
}

/**
 * Update enemy HP in snapshot
 */
export function updateEnemyHp(campaignId: number, newHp: number): void {
  const snapshot = getCombatSnapshot(campaignId);
  if (snapshot) {
    snapshot.enemyCurrentHp = Math.max(0, newHp);
    global.combatSnapshots!.set(campaignId, snapshot);
  }
}

/**
 * Update character HP in snapshot
 */
export function updateCharacterHp(campaignId: number, newHp: number): void {
  const snapshot = getCombatSnapshot(campaignId);
  if (snapshot) {
    snapshot.characterSnapshot.currentHealth = Math.max(0, newHp);
    global.combatSnapshots!.set(campaignId, snapshot);
  }
}

/**
 * Apply temporary buff to snapshot
 */
export function applyTemporaryBuff(
  campaignId: number,
  statType: 'attack' | 'defense',
  value: number
): void {
  const snapshot = getCombatSnapshot(campaignId);
  if (snapshot) {
    snapshot.temporaryBuffs[statType] += value;
    global.combatSnapshots!.set(campaignId, snapshot);
    console.log(`[CombatSnapshot] Applied ${value} ${statType} buff`);
  }
}

/**
 * Remove item from inventory snapshot
 */
export function removeItemFromSnapshot(campaignId: number, itemId: number): void {
  const snapshot = getCombatSnapshot(campaignId);
  if (snapshot) {
    snapshot.inventorySnapshot = snapshot.inventorySnapshot.filter(
      item => item.id !== itemId
    );
    global.combatSnapshots!.set(campaignId, snapshot);
    console.log(`[CombatSnapshot] Removed item ${itemId} from snapshot`);
  }
}

/**
 * Add combat log entry
 */
export function addCombatLogEntry(campaignId: number, entry: string): void {
  const snapshot = getCombatSnapshot(campaignId);
  if (snapshot) {
    snapshot.combatLog.push(entry);
    global.combatSnapshots!.set(campaignId, snapshot);
  }
}

/**
 * Clear combat snapshot (called after combat ends)
 */
export function clearCombatSnapshot(campaignId: number): void {
  const deleted = global.combatSnapshots!.delete(campaignId);
  if (deleted) {
    console.log(`[CombatSnapshot] Cleared snapshot for campaign ${campaignId}`);
  }
}

/**
 * Get current attack with temporary buffs
 */
export function getEffectiveAttack(snapshot: CombatSnapshot): number {
  return snapshot.characterSnapshot.baseAttack + snapshot.temporaryBuffs.attack;
}

/**
 * Get current defense with temporary buffs
 */
export function getEffectiveDefense(snapshot: CombatSnapshot): number {
  return snapshot.characterSnapshot.baseDefense + snapshot.temporaryBuffs.defense;
}
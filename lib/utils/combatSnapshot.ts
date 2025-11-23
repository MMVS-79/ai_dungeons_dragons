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
  }
}

/**
 * Remove item from inventory snapshot
 */
export function removeItemFromSnapshot(campaignId: number, itemId: number): void {
  const snapshot = getCombatSnapshot(campaignId);
  if (snapshot) {
    // Find the index of the first matching item
    const itemIndex = snapshot.inventorySnapshot.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      // Remove only ONE instance
      snapshot.inventorySnapshot.splice(itemIndex, 1);
      global.combatSnapshots!.set(campaignId, snapshot);
    }
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
}

/**
 * Get current attack with equipment and temporary buffs
 */
export function getEffectiveAttack(snapshot: CombatSnapshot): number {
  const weaponBonus = snapshot.equipment?.weapon?.attack || 0;
  const total = snapshot.characterSnapshot.baseAttack + weaponBonus + snapshot.temporaryBuffs.attack;
  return total;
}

/**
 * Get current defense with equipment and temporary buffs
 */
export function getEffectiveDefense(snapshot: CombatSnapshot): number {
  const shieldBonus = snapshot.equipment?.shield?.defense || 0;
  const total = snapshot.characterSnapshot.baseDefense + shieldBonus + snapshot.temporaryBuffs.defense;
  return total;
}
// lib/utils/lootFormulas.ts

/**
 * Loot and Enemy Selection Formulas
 * ==================================
 * These formulas scale difficulty/rarity based on progression
 */

// ============================================================================
// ITEM DROP RARITY (During exploration)
// ============================================================================

/**
 * Calculate item rarity for exploration item drops
 * Formula: (event_number + dice_roll * 2)
 * 
 * Examples:
 * - Event 1, Roll 5: 1 + 10 = 11 rarity (low-tier items)
 * - Event 25, Roll 10: 25 + 20 = 45 rarity (mid-tier items)
 * - Event 50, Roll 20: 50 + 40 = 90 rarity (high-tier items)
 */
export function calculateItemRarity(eventNumber: number, diceRoll: number): number {
  return eventNumber + (diceRoll * 2);
}

// ============================================================================
// ENEMY DIFFICULTY (Combat encounters)
// ============================================================================

/**
 * Calculate enemy difficulty for combat encounters
 * Formula: (event_number * 2 + dice_roll)
 * 
 * Examples:
 * - Event 1, Roll 5: 2 + 5 = 7 (rats, zombies)
 * - Event 25, Roll 10: 50 + 10 = 60 (orcs, devils)
 * - Event 50, Roll 15: 100 + 15 = 115 (trolls, minotaurs)
 * 
 * Bosses (difficulty 1000+) are only encountered in forced end-game events
 */
export function calculateEnemyDifficulty(eventNumber: number, diceRoll: number): number {
  return (eventNumber * 2) + diceRoll;
}

// ============================================================================
// COMBAT REWARD RARITY (After defeating enemy)
// ============================================================================

/**
 * Calculate item/equipment rarity for combat rewards
 * Formula: (enemy_difficulty * 0.5 + dice_roll * 2)
 * 
 * This ensures harder enemies drop better loot, with dice roll adding variance
 * 
 * Examples:
 * - Goblin (diff 15), Roll 5: 7.5 + 10 = 17.5 ≈ 18 (common items)
 * - Orc (diff 35), Roll 10: 17.5 + 20 = 37.5 ≈ 38 (uncommon equipment)
 * - Troll (diff 75), Roll 15: 37.5 + 30 = 67.5 ≈ 68 (rare equipment)
 * - Griffin (diff 1000), Roll 20: 500 + 40 = 540 (legendary guaranteed)
 */
export function calculateCombatRewardRarity(
  enemyDifficulty: number,
  diceRoll: number
): number {
  return Math.round((enemyDifficulty * 0.5) + (diceRoll * 2));
}

// ============================================================================
// DATABASE QUERY HELPERS
// ============================================================================

/**
 * Get acceptable rarity range for queries
 * Allows ±5 variance for LLM selection flexibility
 */
export function getRarityRange(targetRarity: number, variance: number = 5): {
  min: number;
  max: number;
} {
  return {
    min: Math.max(0, targetRarity - variance),
    max: targetRarity + variance,
  };
}

/**
 * Get acceptable difficulty range for enemy queries
 * Allows ±3 variance for enemy selection
 */
export function getDifficultyRange(targetDifficulty: number, variance: number = 3): {
  min: number;
  max: number;
} {
  return {
    min: Math.max(0, targetDifficulty - variance),
    max: targetDifficulty + variance,
  };
}

// ============================================================================
// BALANCE TUNING CONSTANTS
// ============================================================================

/**
 * These constants can be easily modified for balance adjustments
 */
export const BALANCE_CONFIG = {
  // Item drop formula multipliers
  ITEM_EVENT_NUMBER_WEIGHT: 1,
  ITEM_DICE_ROLL_WEIGHT: 2,
  
  // Enemy selection formula multipliers
  ENEMY_EVENT_NUMBER_WEIGHT: 4,
  ENEMY_DICE_ROLL_WEIGHT: 1,
  
  // Combat reward formula multipliers
  REWARD_DIFFICULTY_WEIGHT: 0.5,
  REWARD_DICE_ROLL_WEIGHT: 2,
  
  // Selection variance
  ITEM_RARITY_VARIANCE: 5,
  ENEMY_DIFFICULTY_VARIANCE: 3,
  
  // Campaign constants
  BOSS_DIFFICULTY_THRESHOLD: 1000,
  MAX_EVENT_NUMBER: 50,
  BOSS_FORCED_EVENT_START: 48, // Boss encounters forced after this many events
};

/**
 * Recalculate formulas with custom balance config
 * Use this if you want to test different balance settings
 */
export function calculateWithCustomBalance(
  formulaType: 'item' | 'enemy' | 'reward',
  eventNumber: number,
  diceRoll: number,
  enemyDifficulty?: number
): number {
  const config = BALANCE_CONFIG;
  
  switch (formulaType) {
    case 'item':
      return (eventNumber * config.ITEM_EVENT_NUMBER_WEIGHT) + 
             (diceRoll * config.ITEM_DICE_ROLL_WEIGHT);
    
    case 'enemy':
      return (eventNumber * config.ENEMY_EVENT_NUMBER_WEIGHT) + 
             (diceRoll * config.ENEMY_DICE_ROLL_WEIGHT);
    
    case 'reward':
      if (enemyDifficulty === undefined) {
        throw new Error('enemyDifficulty required for reward calculation');
      }
      return Math.round(
        (enemyDifficulty * config.REWARD_DIFFICULTY_WEIGHT) + 
        (diceRoll * config.REWARD_DICE_ROLL_WEIGHT)
      );
    
    default:
      throw new Error(`Unknown formula type: ${formulaType}`);
  }
}
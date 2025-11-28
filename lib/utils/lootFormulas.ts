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
 * 
 * CURSED ITEMS (dice_roll <= 5):
 * Progressive system - worse items appear later in campaign
 * Formula: -(eventNumber / 4 + (6 - diceRoll) * 5)
 * 
 * Early game (turns 1-20):
 * - Roll 5: -5 to -10 rarity (very mild curses)
 * - Roll 1: -25 to -30 rarity (moderate curses)
 * 
 * Mid game (turns 20-40):
 * - Roll 5: -10 to -15 rarity (mild curses)
 * - Roll 1: -30 to -35 rarity (strong curses)
 * 
 * Late game (turns 40-60):
 * - Roll 5: -15 to -20 rarity (moderate curses)
 * - Roll 1: -35 to -40 rarity (devastating curses)
 * 
 * POSITIVE ITEMS (dice_roll >= 6):
 * Formula: (event_number * ITEM_EVENT_NUMBER_WEIGHT + dice_roll * ITEM_DICE_ROLL_WEIGHT)
 * 
 * Examples:
 * - Event 1, Roll 10: 1 + 20 = 21 rarity (low-tier items)
 * - Event 30, Roll 15: 30 + 30 = 60 rarity (mid-tier items)
 * - Event 60, Roll 20: 60 + 40 = 100 rarity (high-tier items)
 */
export function calculateItemRarity(
  eventNumber: number,
  diceRoll: number,
): number {
  // Cursed items for bad rolls (1-5)
  // Gets progressively worse as campaign continues
  if (diceRoll <= 5) {
    const progressionComponent = eventNumber / 4; // 0 at start, 15 at turn 60
    const rollPenalty = (6 - diceRoll) * 5; // 5 for roll 5, 25 for roll 1
    const curseRarity = -(progressionComponent + rollPenalty);
    
    // Round and ensure we don't go beyond what's in database
    return Math.round(Math.max(curseRarity, -60));
  }

  // Positive items for normal/good rolls (6-20)
  const baseValue = eventNumber * BALANCE_CONFIG.ITEM_EVENT_NUMBER_WEIGHT;
  const diceContribution = diceRoll * BALANCE_CONFIG.ITEM_DICE_ROLL_WEIGHT;

  const targetRarity = baseValue + diceContribution;

  return Math.round(targetRarity);
}

// ============================================================================
// ENEMY DIFFICULTY (Combat encounters)
// ============================================================================

/**
 * Calculate enemy difficulty for combat encounters
 * Formula: (event_number * ENEMY_EVENT_NUMBER_WEIGHT + (dice_roll - 10) * ENEMY_DICE_ROLL_WEIGHT)
 *
 * Special Enemy Check (last 5-9 turns):
 * - If eventNumber >= 56 && eventNumber <= 60, 5% chance for special enemy (300/500/700)
 *
 * Examples:
 * - Event 1, Roll 10: 2 + 0 = 2 (rats, zombies)
 * - Event 15, Roll 15: 30 + 5 = 35 (goblins, orcs)
 * - Event 30, Roll 10: 60 + 0 = 60 (mid-tier enemies)
 * - Event 50, Roll 15: 100 + 5 = 105 (high-tier trolls, minotaurs)
 *
 * Bosses (difficulty 1000+) are only encountered in forced end-game events
 */
export function calculateEnemyDifficulty(
  eventNumber: number,
  diceRoll: number,
): number {
  // Check for special enemy encounter (5% chance in last 5-9 turns)
  if (eventNumber >= BALANCE_CONFIG.SPECIAL_ENEMY_START_TURN && eventNumber <= BALANCE_CONFIG.SPECIAL_ENEMY_END_TURN) {
    const specialChance = Math.random();
    if (specialChance <= BALANCE_CONFIG.SPECIAL_ENEMY_CHANCE) {
      // 5% chance
      // Randomly select one of the three special enemies
      const specialEnemies = [300, 500, 700]; // Santa, Genie, Zeus
      const randomIndex = Math.floor(Math.random() * specialEnemies.length);
      return specialEnemies[randomIndex];
    }
  }

  const baseValue = eventNumber * BALANCE_CONFIG.ENEMY_EVENT_NUMBER_WEIGHT;
  const diceContribution =
    (diceRoll - 10) * BALANCE_CONFIG.ENEMY_DICE_ROLL_WEIGHT;

  const targetDifficulty = Math.max(0, baseValue + diceContribution);

  return Math.round(targetDifficulty);
}

// ============================================================================
// COMBAT REWARD RARITY (After defeating enemy)
// ============================================================================

/**
 * Calculate item/equipment rarity for combat rewards
 * Formula: (enemy_difficulty * REWARD_DIFFICULTY_WEIGHT + dice_roll * REWARD_DICE_ROLL_WEIGHT)
 *
 * Special Enemies (300/500/700 difficulty):
 * - Returns the exact difficulty as rarity to match legendary items
 *
 * This ensures harder enemies drop better loot, with dice roll adding variance
 *
 * Examples:
 * - Goblin (diff 15), Roll 10: 7.5 + 20 = 27.5 ≈ 28 (common items)
 * - Orc (diff 40), Roll 12: 20 + 24 = 44 (uncommon equipment)
 * - Troll (diff 90), Roll 15: 45 + 30 = 75 (rare equipment)
 * - Special (diff 300), Roll any: 300 (Santa's Robe)
 * - Griffin (diff 1000), Roll 20: 500 + 40 = 540 (legendary guaranteed)
 */
export function calculateCombatRewardRarity(
  enemyDifficulty: number,
  diceRoll: number,
): number {
  // Special enemies (Santa, Genie, Zeus) return exact difficulty as rarity
  if (enemyDifficulty === 300 || enemyDifficulty === 500 || enemyDifficulty === 700) {
    return enemyDifficulty;
  }

  const difficultyContribution =
    enemyDifficulty * BALANCE_CONFIG.REWARD_DIFFICULTY_WEIGHT;
  const diceContribution = diceRoll * BALANCE_CONFIG.REWARD_DICE_ROLL_WEIGHT;

  const targetRarity = difficultyContribution + diceContribution;

  return Math.round(targetRarity);
}

// ============================================================================
// DATABASE QUERY HELPERS
// ============================================================================

/**
 * Get acceptable rarity range for queries
 * Allows ±5 variance for LLM selection flexibility
 */
export function getRarityRange(
  targetRarity: number,
  variance: number = 5,
): {
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
export function getDifficultyRange(
  targetDifficulty: number,
  variance: number = 3,
): {
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
  ENEMY_EVENT_NUMBER_WEIGHT: 2,
  ENEMY_DICE_ROLL_WEIGHT: 1,

  // Combat reward formula multipliers
  REWARD_DIFFICULTY_WEIGHT: 0.5,
  REWARD_DICE_ROLL_WEIGHT: 2,

  // Selection variance
  ITEM_RARITY_VARIANCE: 5,
  ENEMY_DIFFICULTY_VARIANCE: 3,

  // Campaign constants
  BOSS_DIFFICULTY_THRESHOLD: 1000,
  MAX_EVENT_NUMBER: 62, // Updated from 50 to 62 for 60-turn campaign
  BOSS_FORCED_EVENT_START: 60, // Updated from 48 to 60
  
  // Special enemy constants
  SPECIAL_ENEMY_START_TURN: 5,
  SPECIAL_ENEMY_END_TURN: 30,
  SPECIAL_ENEMY_CHANCE: 1, // 5% chance
};
/**
 * diceRoll.ts
 * -------------------
 * Utility functions for all dice rolling in the game.
 * This file focuses exclusively on a d20 roll.
 *
 * Responsibilities:
 *  - Roll a d20 and return the result (1-20)
 *  - Optionally apply modifiers (e.g., bonuses from stats, items)
 *  - Support special mechanics like critical hits (20) or critical fails (1)
 *
 * Example functions to implement:
 *  - rollD20(modifier?: number): number
 *  - isCriticalHit(roll: number): boolean
 *  - isCriticalFail(roll: number): boolean
 *
 * Usage:
 *  - Combat: determine attack success or damage
 *  - Flee attempts: determine success or failure
 *  - Skill checks / environmental interactions
 *
 * Pure logic: no API calls, no rendering, just random number calculations.
 */

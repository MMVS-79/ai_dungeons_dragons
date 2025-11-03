/**
 * Stat Calculation Utilities
 * --------------------------
 * Encapsulates all logic related to applying stat effects and combat results.
 * 
 * Responsibilities:
 * - applyStatChanges(baseStats, effects): Adjusts HP/ATK/DEF per Environmental event.
 * - resolveAttack(attacker, defender): Calculates damage based on stats and dice roll.
 * - calculateDamageReduction(): Handles defense mitigation.
 * - clampHp(): Ensures HP values remain within 0–max bounds.
 * 
 * Used by:
 * - gameEngine.service.ts  → for Environmental, Item, and Combat logic
 * - test/combat.test.ts    → for unit testing damage outcomes
 */

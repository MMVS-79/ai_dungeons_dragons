/**
 * Stat Calculation Utility
 * -------------------------
 * Applies dice roll modifiers to stat values using three-tier system.
 *
 * Formula:
 * - Critical Failure (1-4): finalValue = 0
 * - Regular (5-15): finalValue = initValue * (1 + (rollValue - 10) / 10)
 * - Critical Success (16-20): finalValue = initValue * 2
 *
 * Example:
 * - LLM says: +10 health
 * - Player rolls 18 (critical success)
 * - Result: 10 * 2 = +20 health bonus!
 *
 * Used by:
 * - game.service.ts for environmental events
 * - backend.service.ts for combat rewards (future)
 */

// Stat types supported by the system
export type StatType = "HEALTH" | "ATTACK" | "DEFENSE";

export class Stat_Calc {
  /**
   * Apply dice roll modifier to a stat value
   *
   * @param rollValue - The D20 roll result (1-20)
   * @param statType - The stat being modified ('HEALTH'|'ATTACK'|'DEFENSE')
   * @param initValue - Base stat value from LLM (before dice modifier)
   * @returns Final adjusted stat value (rounded to integer)
   *
   * Examples:
   * - applyRoll(3, 'HEALTH', 10) → 0 (critical failure)
   * - applyRoll(10, 'ATTACK', 5) → 5 (roll matches midpoint)
   * - applyRoll(14, 'DEFENSE', 10) → 14 (above average roll)
   * - applyRoll(18, 'HEALTH', 15) → 30 (critical success, doubled)
   */
  public static applyRoll(
    rollValue: number,
    statType: StatType,
    initValue: number
  ): number {
    let finalValue: number;

    // Critical Failure (1-4): No stat gain
    if (rollValue >= 1 && rollValue <= 4) {
      finalValue = 0;
    }
    // Regular Roll (5-15): Scale stat based on formula
    else if (rollValue >= 5 && rollValue <= 15) {
      // Current: initValue * (1 + (rollValue - 10) / 10)
      // Roll 10 = 1.0x, Roll 5 = 0.5x, Roll 15 = 1.5x

      // Example: Make it less punishing for low rolls
      // finalValue = initValue * (0.7 + (rollValue - 5) / 10);
      finalValue = initValue * (1 + (rollValue - 10) / 10);
    }
    // Critical Success (16-20): Double the stat
    else if (rollValue >= 16 && rollValue <= 20) {
      // Current: 2x

      // Example: Make crits less powerful: finalValue = initValue * 1.5;
      finalValue = initValue * 2;
    }
    // Invalid roll value (should never happen)
    else {
      console.error(`[Stat_Calc] Invalid Roll_Value: ${rollValue}`);
      throw new Error(`[Stat_Calc] Invalid Roll_Value: ${rollValue}`);
    }

    // Round to nearest integer and ensure non-negative
    return Math.max(0, Math.round(finalValue));
  }

  /**
   * Normalize stat type string to uppercase
   *
   * @param statType - Stat type string (any case)
   * @returns Normalized stat type
   */
  public static normalizeStatType(statType: string): StatType {
    const normalized = statType.toUpperCase();

    // Map abbreviations to full names
    const mapping: Record<string, StatType> = {
      HEALTH: "HEALTH",
      ATTACK: "ATTACK",
      DEFENSE: "DEFENSE",
      health: "HEALTH",
      attack: "ATTACK",
      defense: "DEFENSE",
    };

    const result = mapping[normalized];
    if (!result) {
      console.warn(
        `[Stat_Calc] Unknown stat type: ${statType}, defaulting to HEALTH`
      );
      return "HEALTH";
    }

    return result;
  }

  /**
   * Apply roll with automatic stat type normalization
   * Convenience method for handling LLM stat strings
   *
   * @param rollValue - The D20 roll result
   * @param statType - Stat type
   * @param initValue - Base stat value
   * @returns Final adjusted stat value
   */
  public static applyRollFlexible(
    rollValue: number,
    statType: string,
    initValue: number
  ): number {
    const normalized = this.normalizeStatType(statType);
    return this.applyRoll(rollValue, normalized, initValue);
  }
}

// Default export for compatibility
export default Stat_Calc;

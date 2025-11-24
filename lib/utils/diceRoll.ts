/**
 * Dice Roll Utility
 * ------------------
 * Handles D20 dice rolling and classification for the game system.
 * 
 * Three-tier classification system:
 * - Critical Failure (1-4): Worst outcome
 * - Regular (5-15): Normal outcome with scaling
 * - Critical Success (16-20): Best outcome
 * 
 * Used by:
 * - game.service.ts for event resolution
 * - backend.service.ts for combat rewards
 */

export type RollClassification = 'critical_failure' | 'regular' | 'critical_success';

export class Dice_Roll {
  /**
   * Roll a D20 and return the result (1-20)
   * @returns Random integer between 1 and 20 (inclusive)
   */
  public static roll(): number {
    const rollValue = Math.floor(Math.random() * 20) + 1;
    return rollValue;
  }

  /**
   * Classify a dice roll into one of three tiers
   * 
   * @param rollValue - The D20 roll result (1-20)
   * @returns Classification tier
   * 
   * Tiers:
   * - 1-4: Critical failure (no stat gain, no rewards)
   * - 5-15: Regular (normal stat scaling, normal rewards)
   * - 16-20: Critical success (double stats, item + bonus stat rewards)
   */
  public static classifyRoll(rollValue: number): RollClassification {
    if (rollValue >= 1 && rollValue <= 4) {
      return 'critical_failure';
    } else if (rollValue >= 5 && rollValue <= 15) {
      return 'regular';
    } else if (rollValue >= 16 && rollValue <= 20) {
      return 'critical_success';
    } else {
      // Fallback for invalid values (should never happen)
      console.warn(`[Dice_Roll] Invalid roll value: ${rollValue}, defaulting to regular`);
      return 'regular';
    }
  }
  
  /**
   * Roll and classify in one call (convenience method)
   * @returns Object with roll value and classification
   */
  public static rollAndClassify(): { value: number; classification: RollClassification } {
    const value = this.roll();
    const classification = this.classifyRoll(value);
    return { value, classification };
  }
}

// Default export for compatibility
export default Dice_Roll;
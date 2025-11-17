// dice_roll.ts
// Handles a single D20 roll and classification logic.
// The result is returned to Game_Engine for orchestration decisions.

export class Dice_Roll {
    /**
     * Rolls a D20 and returns the integer result (1–20).
     */
    public static roll(): number {
        const rollValue = Math.floor(Math.random() * 20) + 1;
        console.log(`[Dice_Roll] Rolled a D20: ${rollValue}`);
        return rollValue;
    }

    /**
     * Classifies the roll result into one of three categories:
     * - "critical_failure": 1–4
     * - "regular": 5–15
     * - "critical_success": 16–20
     *
     * This helper lets Game_Engine decide which service to call next.
     */
    public static classifyRoll(rollValue: number): 'critical_failure' | 'regular' | 'critical_success' {
        if (rollValue >= 1 && rollValue <= 4) {
            return 'critical_failure';
        } else if (rollValue >= 5 && rollValue <= 15) {
            return 'regular';
        } else {
            return 'critical_success';
        }
    }
}

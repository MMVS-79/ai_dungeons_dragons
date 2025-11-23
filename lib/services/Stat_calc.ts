// ===================================================
// VERSION THAT ISNT USED BY BACKEND ANYMORE
// ===================================================

// Stat_calc.ts
// Handles applying dice roll results to player stats.
// Only computes principal stat adjustments; bonus stats and HP penalties are handled elsewhere.

export type StatType = 'ATK' | 'DEF' | 'VIT';

export class Stat_Calc {

    /**
     * Apply a dice roll to a base stat value.
     *
     * @param rollValue - the D20 roll result (1–20)
     * @param statType - the stat to apply the result to ('ATK' | 'DEF' | 'VIT')
     * @param initValue - the base stat value before applying the roll
     * @returns final adjusted stat value
     */
    public static applyRoll(
        rollValue: number,
        statType: StatType,
        initValue: number
    ): number {
        let finalValue: number;

        if (rollValue >= 1 && rollValue <= 4) {
            // Critical failure: stat gain is 0
            finalValue = 0;
            console.log(`[Stat_Calc] Critical failure on ${statType}. Stat gain set to 0.`);
        } else if (rollValue >= 5 && rollValue <= 15) {
            // Regular roll: scale stat based on formula
            finalValue = initValue * (1 + (rollValue - 10) / 10);
            console.log(
                `[Stat_Calc] Regular roll on ${statType}: Roll ${rollValue}, scaled stat = ${finalValue}`
            );
        } else if (rollValue >= 16 && rollValue <= 20) {
            // Critical success: 200% of base stat
            finalValue = initValue * 2;
            console.log(
                `[Stat_Calc] Critical success on ${statType}: Roll ${rollValue}, stat doubled = ${finalValue}`
            );
            // Note: any bonus stat calls (bonusstatRequest) handled by Game_Engine/LLM_Service
        } else {
            throw new Error(`[Stat_Calc] Invalid Roll_Value: ${rollValue}`);
        }

        return finalValue;
    }
}

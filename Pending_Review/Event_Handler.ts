declare function loadEnvironmentalUI(data: LLMResponse): void;
declare function loadItemDropUI(data: LLMResponse): void;
declare function loadDescriptiveUI(data: LLMResponse): void;

// UI Interface Declaration (Required for button and text manipulation)
declare const UI: {
    setupButton: (id: string, text: string, callback: () => void) => void;
    revealElement: (id: string) => void;
    updateTextBox: (text: string) => void;
};

// LLM Interface Declaration (Required for secondary narrative prompt)
declare const llm: {
    generateClosingText: (type: EventType, outcome: string, roll?: number) => string;
};

// Player Interface Declaration (Required for current stat access)
declare const player: {
    currentHP: number;
    maxHP: number;
    // Add other relevant stats used, e.g., ATK, DEF
};

//backend interface for stat persistence
const backend = {
    updatePlayerStats: (updates: object) => console.log("Backend: Updating Player Stats...", updates), 
    fetchAndEquipNewItem: (score: number) => console.log(`Backend: Fetching Item with Score ${score}`),
    terminateEventAndProceed: () => console.log("Game Engine: Terminating event, requesting next prompt..."), 
    triggerGameOver: (reason: string) => console.error(`GAME OVER: ${reason}`),
    getMaxItemRows: (itemType: string) => 20 
};

// --- Core Dice Mechanics ---

function rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
}

function checkDeathRoll(d20Roll: number): boolean {
    if (d20Roll === 1) {
        const d100 = Math.floor(Math.random() * 100) + 1;
        if (d100 <= 10) {
            backend.triggerGameOver("Death Roll Failure (10%)");
            return true;
        }
    }
    return false;
}

function calculateScaledValue(roll: number, originalValue: number): number {
    const multiplier = ((roll - 10) / 10) + 1;
    return Math.round(originalValue * multiplier);
}

// Helper for Crit Success: Chooses a stat that wasn't the primary one
function getParallelStat(stat: string): string {
    if (stat === "ATK") return "max_HP";
    if (stat === "DEF") return "ATK";
    if (stat === "max_HP") return "DEF";
    return "DEF"; // Default fallback
}

/**
 * Main entry point: Parses the LLM's JSON and routes execution.
 * @param {LLMResponse} llmJson - The strict JSON object from the LLM.
 */
export function handleLLMResponse(llmJson: LLMResponse): void {
    
    // 1. Initial UI Routing: Call the correct pre-built interface
    switch (llmJson.EventType) {

        case "ENVIRONMENTAL":
            loadEnvironmentalUI(llmJson); 
            modelEnvironmentalLogic(llmJson);
            break;

        case "ITEM_DROP":
            loadItemDropUI(llmJson); 
            modelItemDropLogic(llmJson);
            break;

        case "DESCRIPTIVE":
            loadDescriptiveUI(llmJson);
            modelDescriptiveLogic();
            break;

        default:
            console.error("ERROR: Unknown or invalid EventType received:", llmJson.EventType);
            break;
    }
}

function modelDescriptiveLogic(): void {
    // Behavior for the single 'Continue On' button
    UI.setupButton("Continue_On", "Continue On", () => {
        console.log("Descriptive event acknowledged.");
        backend.terminateEventAndProceed();
    });
}

function modelEnvironmentalLogic(data: LLMResponse): void {
    
    // --- Option 2: Decline Behavior ---
    UI.setupButton("Button_2", "Decline", () => {
        const closingText = llm.generateClosingText("ENVIRONMENTAL", "DECLINED");
        UI.updateTextBox(closingText); 
        backend.terminateEventAndProceed();
    });

    // --- Option 1: Accept & Roll Setup ---
    UI.setupButton("Button_1", "Accept", () => {
        UI.revealElement("Roll_for_Advantage");
        UI.setupButton("Roll_for_Advantage", "Roll for Advantage", () => {
            const roll = rollD20();
            const outcome = determineRollOutcome(roll);
            let playerUpdates: any = {};

            if (outcome === "CRITICAL_FAILURE") { // R <= 4
                // 1. HP Penalty (20-80% of CURRENT HP)
                const percentLoss = 0.2 + (Math.random() * 0.6); 
                playerUpdates.current_HP_change = -Math.round(player.currentHP * percentLoss);
                
                // 2. Death Roll Check (R = 1)
                if (checkDeathRoll(roll)) return; 

            } else if (outcome === "REGULAR_ROLL") { // 5 <= R <= 15
                const finalValue = calculateScaledValue(roll, data.Value);
                playerUpdates[data.Stat] = finalValue;

            } else if (outcome === "CRITICAL_SUCCESS") { // R >= 16
                // Crit Success Logic: Healing OR Parallel Stat Boost
                if (Math.random() > 0.5) { 
                    const healPercent = 0.2 + (Math.random() * 0.8); 
                    playerUpdates.current_HP_change = Math.round(player.maxHP * healPercent);
                } else { 
                    const parallelStat = getParallelStat(data.Stat); 
                    playerUpdates[parallelStat] = data.Value * 1.5; 
                }
            }

            // Update Backend and Request Final Narrative
            backend.updatePlayerStats(playerUpdates);
            const finalRollText = llm.generateClosingText("ENVIRONMENTAL", outcome, roll);
            UI.updateTextBox(finalRollText);
            backend.terminateEventAndProceed();
        });
    });
}

function calculateTierUpScore(roll: number, currentScore: number, maxDBRows: number): number {
    const tierIncrease = Math.min(4, roll - 15);
    const maxScore = maxDBRows - 1; 
    let newScore = currentScore + tierIncrease;

    return Math.min(newScore, maxScore);
}

function modelItemDropLogic(data: LLMResponse): void {
    
    // --- Option 2: Decline Behavior ---
    UI.setupButton("Button_2", "Decline", () => {
        const closingText = llm.generateClosingText("ITEM_DROP", "DECLINED");
        UI.updateTextBox(closingText); 
        backend.terminateEventAndProceed();
    });

    // --- Option 1: Accept & Roll Setup ---
    UI.setupButton("Button_1", "Accept", () => {
        const roll = rollD20();
        const outcome = determineRollOutcome(roll);

        if (outcome === "CRITICAL_FAILURE") { // R <= 4
            // Simplified penalty: 50% HP loss and item status broken
            const penaltyAmount = -Math.round(player.currentHP * 0.5);
            backend.updatePlayerStats({ current_HP_change: penaltyAmount, item_status: "BROKEN" });
            if (checkDeathRoll(roll)) return; 
            
        } else if (outcome === "REGULAR_ROLL") { // 5 <= R <= 15
            backend.fetchAndEquipNewItem(data.equipment_score);
            
        } else if (outcome === "CRITICAL_SUCCESS") { // R >= 16
            // Item Tier Up
            const maxRows = backend.getMaxItemRows("SWORD"); 
            const newScore = calculateTierUpScore(roll, data.equipment_score, maxRows);
            backend.fetchAndEquipNewItem(newScore);
            
            // Potion: Max heal + random stat boost
            backend.updatePlayerStats({ current_HP_change: player.maxHP, random_stat_boost: true });
        }

        // Request Final Narrative
        const finalRollText = llm.generateClosingText("ITEM_DROP", outcome, roll);
        UI.updateTextBox(finalRollText);
        backend.terminateEventAndProceed();
    });
}
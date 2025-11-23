// ===================================================
// VERSION THAT ISNT USED BY BACKEND ANYMORE
// ===================================================


// Event_type.ts
import { LLMService } from './llm.service';
import { Dice_Roll } from './dice_roll';
// import { CombatUI } from './CombatUI';
import type { LLMGameContext, StatBoostResponse } from '@/lib/types/llm.types';

export type EventTypeString = 'Descriptive' | 'Environmental' | 'Combat' | 'Item_Drop';

export class EventType {
    private static descriptiveCount: number = 0;

    public static getDescriptiveCount(): number {
        return EventType.descriptiveCount;
    }

    public static resetDescriptiveCount(): void {
        EventType.descriptiveCount = 0;
    }

    constructor(private eventType: EventTypeString) {}

    /**
     * Main entry for triggering the event
     * Pass the current game context for LLM interactions
     */
    public async trigger(context: LLMGameContext): Promise<void> {
        switch (this.eventType) {
            case 'Descriptive':
                this.handleDescriptive();
                break;

            case 'Environmental':
                await this.handleEnvironmental(context);
                break;

            case 'Combat':
                await this.handleCombat(context);
                break;

            case 'Item_Drop':
                await this.handleItemDrop(context);
                break;

            default:
                throw new Error(`Unknown Event_Type: ${this.eventType}`);
        }
    }

    // ---------- Event Handlers ----------

    private handleDescriptive() {
        EventType.descriptiveCount++;
        console.log(`Descriptive event triggered. Count: ${EventType.descriptiveCount}`);
    }

    private async handleEnvironmental(context: LLMGameContext) {
        const llm = new LLMService({ apiKey: process.env.GEMINI_API_KEY! });

        // Request stat modification for Environmental event
        const statBoost: StatBoostResponse = await llm.requestStatBoost(context, this.eventType);
        console.log("Environmental stat boost:", statBoost);

        // You can apply the stat boost to the character here if needed
        // e.g., context.character[statBoost.statType] += statBoost.baseValue;
    }

    private async handleCombat(context: LLMGameContext) {
        // Example placeholder for combat logic
        // const result = await CombatUI.InitializeCombat();
        // if (result === 'Won Combat') {
        //     const rollValue = Dice_Roll.roll(); 
        //     console.log("Combat roll:", rollValue);
        // }

        console.log("Combat handler triggered (needs implementation).");
    }

    private async handleItemDrop(context?: LLMGameContext) {
        const llm = new LLMService({ apiKey: process.env.GEMINI_API_KEY! });

        const item = await llm.RequestItemDrop(context);
        console.log("Item dropped:", item);

        // You can add the item to the character's inventory here
        // e.g., context.character.inventory.push(item);
    }
}

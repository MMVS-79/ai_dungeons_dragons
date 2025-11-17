// Event_type.ts
import { LLMService } from './llm.service';
import { Dice_Roll } from './dice_roll';
import { CombatUI } from './CombatUI';

export type EventTypeString = 'Descriptive' | 'Environmental' | 'Combat' | 'Item_Drop';

export class EventType {
    private static descriptiveCount: number = 0;

    constructor(private eventType: EventTypeString) {}

    public async trigger(): Promise<void> {
        switch (this.eventType) {
            case 'Descriptive':
                this.handleDescriptive();
                break;

            case 'Environmental':
                this.handleEnvironmental();
                break;

            case 'Combat':
                await this.handleCombat();
                break;

            case 'Item_Drop':
                this.handleItemDrop();
                break;

            default:
                throw new Error(`Unknown Event_Type: ${this.eventType}`);
        }
    }


    // ---------- Event Handlers ----------

    private handleDescriptive() {
        EventType.descriptiveCount++;
        // Game_Engine can access via EventType.getDescriptiveCount()
        console.log(`Descriptive event triggered. Count: ${EventType.descriptiveCount}`);
    }

    private handleEnvironmental() {
        LLMService.requestStatBoost();
    }

    private async handleCombat() {
        const result = await CombatUI.InitializeCombat();
        if (result === 'Won Combat') {
            const rollValue = Dice_Roll.roll(); 
        }

    }
    private handleItemDrop() {
        LLMService.getRandomItem();
    }
    
}
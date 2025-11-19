/**
 * Event Type Handler
 * -------------------
 * Manages event type logic and descriptive event counter.
 * 
 * Event Types:
 * - Descriptive: Pure narrative (no mechanical effects)
 * - Environmental: Stat modifications from environment
 * - Combat: Enemy encounters
 * - Item_Drop: Items found or lost
 * 
 * Descriptive Counter:
 * Tracks consecutive descriptive events to prevent boring gameplay.
 * Game engine checks this before accepting a Descriptive event.
 * Counter resets after boss fights.
 * 
 * Architecture Note:
 * This class is a LIGHTWEIGHT coordinator. The actual event processing
 * logic lives in GameService. This just tracks state and provides
 * helper methods.
 * 
 * Used by:
 * - game.service.ts for event routing and counter checks
 */

export type EventTypeString = 'Descriptive' | 'Environmental' | 'Combat' | 'Item_Drop';

export class EventType {
  // Static counter for consecutive descriptive events
  private static descriptiveCount: number = 0;

  // Instance variable for event type (if needed for instance methods)
  private eventType: EventTypeString;

  constructor(eventType: EventTypeString) {
    this.eventType = eventType;
  }

  /**
   * Get the current descriptive event count
   * Used by GameService to check if too many consecutive descriptive events
   * 
   * @returns Number of consecutive descriptive events
   */
  public static getDescriptiveCount(): number {
    return EventType.descriptiveCount;
  }

  /**
   * Increment descriptive event counter
   * Called when a Descriptive event is accepted by the player
   */
  public static incrementDescriptiveCount(): void {
    EventType.descriptiveCount++;
    console.log(`[EventType] Descriptive count incremented to: ${EventType.descriptiveCount}`);
  }

  /**
   * Reset descriptive event counter to zero
   * Called after significant events (boss fights, major story beats)
   * Allows descriptive events to occur again naturally
   */
  public static resetDescriptiveCount(): void {
    console.log(`[EventType] Descriptive count reset from ${EventType.descriptiveCount} to 0`);
    EventType.descriptiveCount = 0;
  }

  /**
   * Check if this event type should reset the descriptive counter
   * Combat events (especially boss fights) reset the counter
   * 
   * @param eventType - The event type to check
   * @returns True if counter should be reset
   */
  public static shouldResetCounter(eventType: EventTypeString): boolean {
    // Reset counter for combat (narrative tension justified more descriptive events after)
    return eventType === 'Combat';
  }

  /**
   * Trigger event type logic
   * 
   * ARCHITECTURE NOTE:
   * In the original design, this method would contain the full event logic.
   * However, to keep GameService as the central orchestrator, this now
   * just handles counter updates and delegates actual processing to GameService.
   * 
   * GameService calls this to:
   * 1. Update descriptive counter
   * 2. Get any event-type-specific state
   * 
   * The actual event processing (LLM calls, stat updates, etc.) happens in GameService.
   */
  public async trigger(): Promise<void> {
    switch (this.eventType) {
      case 'Descriptive':
        this.handleDescriptive();
        break;

      case 'Environmental':
        this.handleEnvironmental();
        break;

      case 'Combat':
        this.handleCombat();
        break;

      case 'Item_Drop':
        this.handleItemDrop();
        break;

      default:
        throw new Error(`[EventType] Unknown Event_Type: ${this.eventType}`);
    }
  }

  /**
   * Handle Descriptive event
   * Simply increments counter - actual narrative is handled by GameService
   */
  private handleDescriptive(): void {
    EventType.incrementDescriptiveCount();
    console.log(`[EventType] Descriptive event triggered. Count: ${EventType.descriptiveCount}`);
  }

  /**
   * Handle Environmental event
   * Counter resets on non-descriptive events
   * Actual stat boost logic is in GameService
   */
  private handleEnvironmental(): void {
    if (EventType.descriptiveCount > 0) {
      console.log(`[EventType] Environmental event - resetting descriptive counter`);
      EventType.descriptiveCount = 0;
    }
    console.log(`[EventType] Environmental event triggered`);
  }

  /**
   * Handle Combat event
   * Resets descriptive counter (combat is significant)
   * Actual combat logic is in GameService
   */
  private handleCombat(): void {
    if (EventType.descriptiveCount > 0) {
      console.log(`[EventType] Combat event - resetting descriptive counter`);
      EventType.descriptiveCount = 0;
    }
    console.log(`[EventType] Combat event triggered`);
  }

  /**
   * Handle Item Drop event
   * Resets descriptive counter
   * Actual item logic is in GameService
   */
  private handleItemDrop(): void {
    if (EventType.descriptiveCount > 0) {
      console.log(`[EventType] Item_Drop event - resetting descriptive counter`);
      EventType.descriptiveCount = 0;
    }
    console.log(`[EventType] Item_Drop event triggered`);
  }

  /**
   * Get the event type for this instance
   * @returns The event type string
   */
  public getEventType(): EventTypeString {
    return this.eventType;
  }

  /**
   * Validate event type string
   * @param eventType - String to validate
   * @returns True if valid event type
   */
  public static isValidEventType(eventType: string): eventType is EventTypeString {
    return ['Descriptive', 'Environmental', 'Combat', 'Item_Drop'].includes(eventType);
  }
}

// Default export for compatibility
export default EventType;
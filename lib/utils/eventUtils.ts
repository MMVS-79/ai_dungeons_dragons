/**
 * Event Utilities
 * ---------------
 * Helper functions for managing event lifecycle and validation.
 * Used throughout the GameEngine to ensure LLM-provided events align
 * with supported types and database structure.
 *
 * Responsibilities:
 * - validateEventType(event): Ensures event.type ∈ {Environmental, Descriptive, Item, Combat}
 * - filterInvalidEffects(event): Sanitizes incoming effect data.
 * - summarizeEffectsForUI(event): Converts raw effects into readable UI text.
 * - mergeEventContext(prevEvent, nextEvent): Maintains continuity between turns.
 *
 * Supports:
 * - gameEngine.service.ts → during each event turn
 * - llm.service.ts → post-LLM event filtering
 */

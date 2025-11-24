/**
 * Investigation Prompt Storage
 * ============================
 * In-memory storage for pending investigation prompts
 */

export type EventTypeString =
  | "Descriptive"
  | "Environmental"
  | "Combat"
  | "Item_Drop";

interface InvestigationPrompt {
  eventType: EventTypeString;
  message: string;
}

declare global {
  var investigationPrompts: Map<number, InvestigationPrompt> | undefined;
}

if (!global.investigationPrompts) {
  global.investigationPrompts = new Map<number, InvestigationPrompt>();
}

export function setInvestigationPrompt(
  campaignId: number,
  eventType: EventTypeString,
  message: string,
): void {
  global.investigationPrompts!.set(campaignId, { eventType, message });
}

export function getInvestigationPrompt(
  campaignId: number,
): InvestigationPrompt | null {
  const prompt = global.investigationPrompts!.get(campaignId) || null;
  return prompt;
}

export function clearInvestigationPrompt(campaignId: number): void {
  const deleted = global.investigationPrompts!.delete(campaignId);
}

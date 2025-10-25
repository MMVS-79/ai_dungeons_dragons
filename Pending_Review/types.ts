export type EventType =
  | "NARRATIVE"
  | "COMBAT_ACTION"
  | "ENVIRONMENTAL"
  | "ITEM_DROP"
  | "STAT_MODIFIER";

export interface LLMEvent {
  event: string;
  type: EventType;
  // ITEM_DROP events must include an internal reference to identify the dropped item.
  // This can be itemId OR categoryRef depending on how you represent drops.
  itemId?: number; // optional - only for ITEM_DROP events if you supply it
  effects: { health: number; attack: number; defense: number }; // base event effects (usually zeros for ITEM_DROP)
}

export interface CharacterState {
  id: number;
  name: string;
  currentHP: number;
  maxHP: number;
  attack: number;
  defense: number;
  // other fields...
}

export interface FinalOutcome {
  event: LLMEvent;
  chosenOption: "Accept" | "Decline" | string;
  diceRoll: number;
  appliedEffects: { deltaHP: number; deltaAttack: number; deltaDefense: number };
  resultingStats: { currentHP: number; attack: number; defense: number };
  itemEquippedId?: number | null;
  deathTriggered?: boolean;
  notes?: string;
}

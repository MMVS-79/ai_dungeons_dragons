// resolver.ts
import { LLMService } from "./service"; // your existing LLMService
import type { LLMEvent, CharacterState, FinalOutcome } from "./types";

/**
 * DB stubs - replace with your actual DB / ORM queries.
 */
async function fetchItemById(itemId: number) {
  // Example shape returned by DB
  // Replace with actual DB query
  return {
    id: itemId,
    category: "weapon",
    attack: 5,   // canonical stats
    defense: 0,
    health: 0
  };
}

async function getMaxItemIdForCategory(category: string): Promise<number> {
  // Replace: query DB to find the highest id for the category
  return 100; // placeholder
}

async function fetchItemByIdClamped(itemId: number, category: string) {
  const maxId = await getMaxItemIdForCategory(category);
  const clampedId = Math.min(itemId, maxId);
  // fetch actual record for clampedId
  return fetchItemById(clampedId);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Multiplier for normal roll (5-15)
 */
function computeMultiplier(roll: number): number {
  return 1 + (roll - 10) / 10;
}

/**
 * Unlucky loss percent for rolls 0-4
 * roll 4 -> 16% loss, roll 0 -> 80% loss
 */
function unluckyLossPercent(roll: number): number {
  if (roll > 4 || roll < 0) return 0;
  return 0.8 * ((5 - roll) / 5);
}

/**
 * Item upgrade mapping for ITEM_DROP criticals (16-20)
 * extraIDs = min(4, roll - 15)
 */
function itemUpgradeDelta(roll: number): number {
  if (roll < 16) return 0;
  return Math.min(4, roll - 15);
}

/**
 * The main resolver for an event + chosen option + dice roll
 *
 * - event: parsed LLMEvent
 * - chosenOption: "Accept"|"Decline"|... (for item_drop we expect Accept/Decline)
 * - diceRoll: integer 0..20 provided by frontend
 * - character: current character state (we will mutate copy to return resulting stats)
 */
export async function resolveChoice(
  llmService: LLMService,
  event: LLMEvent,
  chosenOption: string,
  diceRoll: number,
  character: CharacterState
): Promise<FinalOutcome> {
  // working copies
  let deltaHP = 0;
  let deltaATK = 0;
  let deltaDEF = 0;
  let itemEquippedId: number | null = null;
  let notes = "";
  let deathTriggered = false;

  // Helper to apply simple stat modifications (for non-ITEM_DROP cases)
  const applyBaseEffectsScaled = (baseEffects: { health: number; attack: number; defense: number }, multiplier: number) => {
    deltaHP += Math.round(baseEffects.health * multiplier);
    deltaATK += Math.round(baseEffects.attack * multiplier);
    deltaDEF += Math.round(baseEffects.defense * multiplier);
  };

  // ------------------------
  // CASE: ITEM_DROP (special)
  // ------------------------
  if (event.type === "ITEM_DROP") {
    // ITEM_DROP events are special: options are "Accept" or "Decline"
    if (chosenOption === "Accept") {
      // Roll categories:
      if (diceRoll >= 5 && diceRoll <= 15) {
        // Normal: multiplier scales any base item stat * multiplier.
        // BUT in your model items have canonical stats and only apply those stats if picked up.
        // We'll scale the item stats by the multiplier to allow partial equip effectiveness.
        // If you prefer items to be applied only wholly (no scaling), set multiplier=1 here.(Need to talk about this)
        const multiplier = computeMultiplier(diceRoll);

        if (!event.itemId) {
          // If event doesn't include itemId, you'll need to determine the dropped item's id some other way.
          throw new Error("ITEM_DROP event missing itemId");
        }
        const item = await fetchItemById(event.itemId);

        deltaATK += Math.round(item.attack * multiplier);
        deltaDEF += Math.round(item.defense * multiplier);
        deltaHP += Math.round(item.health * multiplier);

        itemEquippedId = item.id;
        notes = `Applied item ${item.id} scaled by ${multiplier.toFixed(2)}`;
      } else if (diceRoll >= 16 && diceRoll <= 20) {
        // Critical success: upgrade item ID according to degree of success
        if (!event.itemId) throw new Error("ITEM_DROP event missing itemId");

        const baseItem = await fetchItemById(event.itemId);
        const delta = itemUpgradeDelta(diceRoll); // 1..4
        // Find new item id (bounded by category max)
        const newItemId = clamp(baseItem.id + delta, baseItem.id + 1, await getMaxItemIdForCategory(baseItem.category));
        const upgradedItem = await fetchItemByIdClamped(newItemId, baseItem.category);

        // Apply upgraded item stats (full application)
        deltaATK += upgradedItem.attack;
        deltaDEF += upgradedItem.defense;
        deltaHP += upgradedItem.health;

        itemEquippedId = upgradedItem.id;
        notes = `Item upgraded from ${baseItem.id} -> ${upgradedItem.id} (roll ${diceRoll})`;
      } else {
        // Critical fail 0-4: cancel effect of picking up, then reduce HP up to 80% of current HP
        const lossPct = unluckyLossPercent(clamp(diceRoll, 0, 4));
        const hpLoss = Math.round(character.currentHP * lossPct);
        deltaHP -= hpLoss; // negative delta
        notes = `Accept cancelled. Took ${Math.round(lossPct * 100)}% (${hpLoss}) HP damage due to bad roll ${diceRoll}.`;
        // death chance if roll == 0
        if (diceRoll === 0) {
          const deathChance = Math.random();
          if (deathChance <= 0.1) {
            deathTriggered = true;
            notes += " Death event triggered (10% chance on roll 0).";
          }
        }
      }
    } else {
      // Decline chosen: Option has no effect normally, but unlucky roll can still harm player
      if (diceRoll >= 0 && diceRoll <= 4) {
        const lossPct = unluckyLossPercent(clamp(diceRoll, 0, 4));
        const hpLoss = Math.round(character.currentHP * lossPct);
        deltaHP -= hpLoss;
        notes = `Decline had bad luck: lost ${Math.round(lossPct * 100)}% HP (${hpLoss}) on roll ${diceRoll}.`;
        if (diceRoll === 0) {
          const deathChance = Math.random();
          if (deathChance <= 0.1) {
            deathTriggered = true;
            notes += " Death event triggered (10% chance on roll 0).";
          }
        }
      } else {
        notes = "Decline chosen: no effect.";
      }
    }

    // Done with ITEM_DROP resolution.
  } else {
    // ------------------------
    // NON-ITEM events generic
    // ------------------------
    const baseEffects = event.effects || { health: 0, attack: 0, defense: 0 };

    if (diceRoll >= 5 && diceRoll <= 15) {
      const multiplier = computeMultiplier(diceRoll);
      applyBaseEffectsScaled(baseEffects, multiplier);
      notes = `Applied base effects scaled by ${multiplier.toFixed(2)} (roll ${diceRoll}).`;
    } else if (diceRoll >= 16 && diceRoll <= 20) {
      const llmPrompt = `
You are a D&D GM assistant. A player rolled a critical success (${diceRoll}) after choosing a player action.
Event: ${event.event}
EventType: ${event.type}
Character: ${character.name}, HP ${character.currentHP}/${character.maxHP}, ATK ${character.attack}, DEF ${character.defense}

Return a JSON describing EXACTLY one deterministic effect to apply immediately.
Valid outputs:
{ "kind": "HEAL", "healPercentOfMax": 0.20 } or
{ "kind": "STAT_BOOST", "stat": "attack"|"defense"|"health", "amount": 5 }
Ensure output is valid JSON with only one object.
`;
      let criticalObj: any = null;
      try {
        const llmResp = await llmService.callGemini(llmPrompt);
        criticalObj = JSON.parse(llmResp);
      } catch (err) {
        criticalObj = { kind: "HEAL", healPercentOfMax: 0.2 + 0.16 * (diceRoll - 16) };
      }

      if (criticalObj.kind === "HEAL") {
        const healPct = clamp(Number(criticalObj.healPercentOfMax) || 0.2, 0.2, 1.0);
        const healAmount = Math.round(character.maxHP * healPct);
        deltaHP += healAmount;
        notes = `Critical heal +${healAmount} HP (${Math.round(healPct * 100)}% of max).`;
      } else if (criticalObj.kind === "STAT_BOOST") {
        const stat = criticalObj.stat;
        const amt = Number(criticalObj.amount) || 1;
        if (stat === "attack") deltaATK += amt;
        if (stat === "defense") deltaDEF += amt;
        if (stat === "health") deltaHP += amt;
        notes = `Critical stat boost: ${stat} +${amt}.`;
      } else {
        deltaHP += baseEffects.health * 2;
        deltaATK += baseEffects.attack * 2;
        deltaDEF += baseEffects.defense * 2;
        notes = "Critical success: doubled base effects (fallback).";
      }
    } else {
      const lossPct = unluckyLossPercent(clamp(diceRoll, 0, 4));
      const hpLoss = Math.round(character.currentHP * lossPct);
      deltaHP -= hpLoss;
      notes = `Critical fail: base effect canceled and lost ${Math.round(lossPct * 100)}% HP (${hpLoss}).`;
      if (diceRoll === 0) {
        if (Math.random() <= 0.1) {
          deathTriggered = true;
          notes += " Death event triggered (10%).";
        }
      }
    }
  }

  // Compose resulting stats
  const resultingHP = clamp(character.currentHP + deltaHP, 0, character.maxHP);
  const resultingAttack = Math.max(0, character.attack + deltaATK);
  const resultingDefense = Math.max(0, character.defense + deltaDEF);

  const final: FinalOutcome = {
    event,
    chosenOption,
    diceRoll,
    appliedEffects: { deltaHP, deltaAttack: deltaATK, deltaDefense: deltaDEF },
    resultingStats: { currentHP: resultingHP, attack: resultingAttack, defense: resultingDefense },
    itemEquippedId: itemEquippedId ?? null,
    deathTriggered,
    notes
  };

  return final;
}

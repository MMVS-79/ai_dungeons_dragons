import { LLMEvent, CharacterState, FinalOutcome } from "./types";

// Helper function to scale the base stat change based on dice roll.
function applyDiceScaling(baseValue: number, diceRoll: number): number {
  const scale = (diceRoll - 10) / 10; // -0.5 to +1.0 (at 0 and 20)
  return Math.round(baseValue + baseValue * scale);
}

export async function handleEventResponse(
  event: LLMEvent,
  playerState: CharacterState,
  chosenOption: "Accept" | "Decline"
): Promise<FinalOutcome> {
  const diceRoll = Math.floor(Math.random() * 21); // 0–20 inclusive
  let appliedEffects = { deltaHP: 0, deltaAttack: 0, deltaDefense: 0 };
  let resultingStats = { ...playerState };
  let itemEquippedId: number | null = null;
  let deathTriggered = false;
  let notes = "";

  // === Step 1: Immediate fail condition ===
  if (diceRoll < 5) {
    appliedEffects.deltaHP = -Math.floor(playerState.currentHP * 0.8);
    resultingStats.currentHP = Math.max(
      0,
      playerState.currentHP + appliedEffects.deltaHP
    );

    // 10% chance to trigger death
    if (diceRoll === 0 && Math.random() < 0.1) {
      deathTriggered = true;
      notes = "Critical failure! Player perished.";
    } else {
      notes = "Severe mishap! Player injured.";
    }

    return {
      event,
      chosenOption,
      diceRoll,
      appliedEffects,
      resultingStats,
      itemEquippedId,
      deathTriggered,
      notes,
    };
  }

  // === Step 2: Base outcome ===
  if (chosenOption === "Accept") {
    if (event.type === "ITEM_DROP" && event.itemId) {
      // Item lookup logic (mocked here)
      const itemStats = await lookupItemById(event.itemId);

      // High roll (16–20) upgrades the item
      if (diceRoll > 15) {
        const upgradeSteps = Math.min(diceRoll - 15, 4);
        const upgradedItemId = await getUpgradedItemId(
          event.itemId,
          upgradeSteps
        );
        const upgradedStats = await lookupItemById(upgradedItemId);
        itemEquippedId = upgradedItemId;
        appliedEffects = {
          deltaHP: 0,
          deltaAttack: upgradedStats.attack,
          deltaDefense: upgradedStats.defense,
        };
        notes = `Critical success! Item upgraded to ID ${upgradedItemId}.`;
      } else {
        // Regular accept (5–15): scaled base item
        appliedEffects = {
          deltaHP: 0,
          deltaAttack: applyDiceScaling(itemStats.attack, diceRoll),
          deltaDefense: applyDiceScaling(itemStats.defense, diceRoll),
        };
        itemEquippedId = event.itemId;
        notes = "Item successfully equipped.";
      }

      resultingStats.attack += appliedEffects.deltaAttack;
      resultingStats.defense += appliedEffects.deltaDefense;
    } else {
      // Non-item event (e.g. Environmental or Stat_Modifier)
      appliedEffects = {
        deltaHP: applyDiceScaling(event.effects.health, diceRoll),
        deltaAttack: applyDiceScaling(event.effects.attack, diceRoll),
        deltaDefense: applyDiceScaling(event.effects.defense, diceRoll),
      };

      resultingStats.currentHP = Math.min(
        resultingStats.maxHP,
        resultingStats.currentHP + appliedEffects.deltaHP
      );
      resultingStats.attack += appliedEffects.deltaAttack;
      resultingStats.defense += appliedEffects.deltaDefense;

      // Exceptional success bonus
      if (diceRoll > 15) {
        notes = "Critical success! Additional stat bonus applied.";
        const bonusCategory = getAlternateStat(event.effects);
        resultingStats[bonusCategory] += Math.round(
          Math.random() * 5 + 3
        ); // +3 to +8 random bonus
      } else {
        notes = "Action succeeded.";
      }
    }
  } else {
    // === Player chose Decline ===
    notes = "Player declined the action. No changes applied.";
  }

  return {
    event,
    chosenOption,
    diceRoll,
    appliedEffects,
    resultingStats,
    itemEquippedId,
    deathTriggered,
    notes,
  };
}

// === Mocked Helper Functions ===
// Replace with real database queries or ORM calls.
async function lookupItemById(itemId: number) {
  const mockItems = {
    1: { attack: 5, defense: 0 },
    2: { attack: 7, defense: 1 },
    3: { attack: 10, defense: 2 },
    4: { attack: 12, defense: 3 },
    5: { attack: 15, defense: 4 },
  };
  return mockItems[itemId] || { attack: 0, defense: 0 };
}

async function getUpgradedItemId(currentId: number, steps: number) {
  return Math.min(currentId + steps, 5); // cap at item ID 5
}

function getAlternateStat(effects: {
  health: number;
  attack: number;
  defense: number;
}): "attack" | "defense" | "maxHP" {
  if (effects.attack > 0) return "maxHP";
  if (effects.health > 0) return "defense";
  return "attack";
}

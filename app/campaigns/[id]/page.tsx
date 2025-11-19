// FRONT END UI DESIGN FOR CAMPAIGN PAGE, INCLUDE MOCK LLM RESPONSE GENERATOR AND GAME ENGINE

"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./interface.module.css";
import CharacterPanel from "./components/characterPanel/characterPanel";
import EventPanel from "./components/eventPanel/eventPanel";
import ChatPanel from "./components/chatPanel/chatPanel";
import ItemPanel from "./components/itemPanel/itemPanel";
import DicePanel from "./components/dicePanel/dicePanel";

// Type definitions (might want to put these in a separate types.ts file later)
interface Item {
  id: string;
  name: string;
  type: "weapon" | "armour" | "shield" | "potion";
  image: string;
  attack?: number;
  defense?: number;
  hpBonus?: number;
  healAmount?: number;
  description: string;
}

interface PlayerState {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  baseAttack: number;
  baseDefense: number;
  inventory: Item[];
  equipped: {
    weapon?: Item;
    armour?: Item;
    shield?: Item;
  };
}

interface EnemyState {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isBoss?: boolean;
}

export type GameEvent =
  | { type: "combat"; data: EnemyState }
  | { type: "item"; data: Item }
  | { type: "equipment"; data: Item }
  | { type: "story"; data?: undefined }
  | { type: null; data?: undefined };

export interface GameStateContext {
  enemyState: EnemyState | null;
  playerAttack: number;
  playerDefense: number;
}

interface Message {
  id: string;
  text: string;
  choices?: string[];
}

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();

  // Add a counter to ensure unique IDs
  const messageIdCounter = useRef(0);

  // Helper function to generate unique message IDs
  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `${Date.now()}-${messageIdCounter.current}`;
  };

  // Centralized game state
  const [playerState, setPlayerState] = useState<PlayerState>({
    name: "Yardle the Dwarf Warrior",
    image: "/characters/player/warrior.png",
    hp: 65,
    maxHp: 50,
    baseAttack: 10,
    baseDefense: 5,
    inventory: [
      {
        id: "potion1",
        name: "Health Potion",
        type: "potion",
        image: "/items/red_potion.png",
        healAmount: 20,
        description: "Restores 20 HP",
      },
      {
        id: "potion2",
        name: "Health Potion",
        type: "potion",
        image: "/items/red_potion.png",
        healAmount: 20,
        description: "Restores 20 HP",
      },
    ],
    equipped: {
      weapon: {
        id: "sword1",
        name: "Iron Sword",
        type: "weapon",
        image: "/items/rare_sword.png",
        attack: 5,
        description: "+5 Attack",
      },
      armour: {
        id: `armour1`,
        name: "Leather Armour",
        type: "armour",
        image: "/items/common_armour.png",
        hpBonus: 15,
        description: "Sturdy leather protection (+15 Max HP)",
      },
      shield: {
        id: `shield1`,
        name: "Knight's Shield",
        type: "shield",
        image: "/items/rare_shield.png",
        defense: 4,
        description: "A reliable shield (+4 Defense)",
      },
    },
  });

  const [enemyState, setEnemyState] = useState<EnemyState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent>({ type: null });
  const [pendingEquipment, setPendingEquipment] = useState<Item | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "You stand at the entrance of an ancient dungeon. The air is thick with mystery. What do you do?",
      choices: ["Continue Forward", "Search Area"],
    },
  ]);
  const [diceRolling, setDiceRolling] = useState(false);
  const [lastDiceResult, setLastDiceResult] = useState<number | null>(null);
  const [actionLocked, setActionLocked] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  // Calculate total stats - armour now affects maxHp instead of defense
  const playerAttack =
    playerState.baseAttack + (playerState.equipped.weapon?.attack || 0);
  const playerDefense =
    playerState.baseDefense + (playerState.equipped.shield?.defense || 0);
  const playerMaxHp =
    playerState.maxHp + (playerState.equipped.armour?.hpBonus || 0);

  // Main action handler
  const handleChatAction = async (choice: string) => {
    if (actionLocked || showGameOver || showVictory) return;
    setActionLocked(true);

    try {
      // Handle equipment pickup/leave
      if (pendingEquipment && (choice === "Pick Up" || choice === "Leave It")) {
        if (choice === "Pick Up") {
          const equipmentSlot = pendingEquipment.type as
            | "weapon"
            | "armour"
            | "shield";

          if (playerState.equipped[equipmentSlot]) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateMessageId(),
                text: `You already have a ${equipmentSlot} equipped. Would you like to replace it?`,
                choices: ["Replace Equipment", "Leave It"],
              },
            ]);
            return;
          } else {
            setPlayerState((prev) => ({
              ...prev,
              equipped: {
                ...prev.equipped,
                [equipmentSlot]: pendingEquipment,
              },
            }));

            setMessages((prev) => [
              ...prev,
              {
                id: generateMessageId(),
                text: `You equipped the ${pendingEquipment.name}!`,
                choices: ["Continue Forward"],
              },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId(),
              text: `You decided to leave the ${pendingEquipment.name} behind.`,
              choices: ["Continue Forward"],
            },
          ]);
        }

        setPendingEquipment(null);
        setCurrentEvent({ type: null });
        setActionLocked(false);
        return;
      }

      // Handle replace equipment
      if (pendingEquipment && choice === "Replace Equipment") {
        const equipmentSlot = pendingEquipment.type as
          | "weapon"
          | "armour"
          | "shield";
        const oldEquipment = playerState.equipped[equipmentSlot];

        setPlayerState((prev) => {
          const newState = { ...prev };

          if (equipmentSlot === "armour") {
            const newHpBonus = pendingEquipment.hpBonus || 0;
            const newMaxHp = prev.maxHp + newHpBonus;
            newState.hp = Math.min(prev.hp, newMaxHp);
          }

          newState.equipped = {
            ...prev.equipped,
            [equipmentSlot]: pendingEquipment,
          };

          return newState;
        });

        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: `You replaced your ${oldEquipment?.name} with the ${pendingEquipment.name}!`,
            choices: ["Continue Forward"],
          },
        ]);

        setPendingEquipment(null);
        setCurrentEvent({ type: null });
        setActionLocked(false);
        return;
      }

      // Determine if dice roll is needed WITHOUT gameState
      const actionType = mapChoiceToAction(choice);

      // Actions that ALWAYS need dice:
      const alwaysNeedDice = ["attack", "flee"];

      // 'accept_event' needs dice for Environmental events
      // 'continue'/'search' need dice for exploration
      // But we don't know the phase yet, so we'll roll conservatively

      // Simple rule: Roll dice for these actions
      const actionsNeedingDice = [
        "attack",
        "flee",
        "accept_event",
        "continue",
        "search",
      ];
      const needsDiceRoll = actionsNeedingDice.includes(actionType);

      let diceResult = 0;

      if (needsDiceRoll) {
        // Trigger dice roll animation
        setDiceRolling(true);
        setLastDiceResult(null);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        diceResult = Math.floor(Math.random() * 20) + 1;
        setLastDiceResult(diceResult);
        setDiceRolling(false);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(
        `[Frontend] Calling API: ${choice} -> ${actionType}, dice: ${diceResult}`
      );

      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: Number(params.id),
          actionType: actionType,
          actionData: needsDiceRoll ? { diceRoll: diceResult } : {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process action");
      }

      const result = await response.json();
      console.log(`[Frontend] API response:`, result);

      // DEBUG: Log the full response
      console.log("=== API RESPONSE DEBUG ===");
      console.log("Success:", result.success);
      console.log("Message:", result.message);
      console.log("Choices:", result.choices);
      console.log("Current Phase:", result.gameState.currentPhase);
      console.log("Has Enemy:", !!result.gameState.enemy);
      console.log("Pending Event:", result.gameState.pendingEvent);
      console.log("========================");

      if (!result.success) {
        console.error("[Frontend] API returned error:", result.error);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: `Error: ${result.error || "Unknown error"}`,
            choices: ["Continue Forward"],
          },
        ]);
        setActionLocked(false);
        return;
      }

      // ============================================================================
      // UPDATE CHARACTER STATS
      // ============================================================================
      if (result.gameState.character) {
        setPlayerState((prev) => ({
          ...prev,
          name: result.gameState.character.name || prev.name,
          hp: result.gameState.character.currentHealth,
          maxHp: result.gameState.character.maxHealth,
          baseAttack: result.gameState.character.attack,
          baseDefense: result.gameState.character.defense,
        }));
      }

      // ============================================================================
      // HANDLE COMBAT RESULT (if present)
      // ============================================================================
      if (result.combatResult) {
        console.log("[Frontend] Combat result:", result.combatResult);

        // Update enemy HP from combat result
        if (result.combatResult.enemyHealth !== undefined) {
          setEnemyState((prev) =>
            prev
              ? {
                  ...prev,
                  hp: result.combatResult.enemyHealth,
                }
              : null
          );
        }
      }

      // ============================================================================
      // HANDLE ENEMY STATE WITH PERSISTENT MAX HP
      // ============================================================================
      if (result.gameState.enemy) {
        console.log("[Frontend] Enemy detected:", result.gameState.enemy.name);

        const enemyImagePath =
          result.gameState.enemy.spritePath ||
          "/characters/enemy/low/goblin.png";

        // Check if this is a NEW enemy encounter
        const isNewEnemy =
          !enemyState || enemyState.name !== result.gameState.enemy.name;

        if (isNewEnemy) {
          // NEW ENEMY: Set both hp and maxHp from backend
          console.log("[Frontend] New enemy spawned");
          const enemyData = {
            name: result.gameState.enemy.name,
            hp: result.gameState.enemy.health,
            maxHp: result.gameState.enemy.health, // Store initial max
            attack: result.gameState.enemy.attack,
            defense: result.gameState.enemy.defense,
            image: enemyImagePath,
          };

          setEnemyState(enemyData);
          setCurrentEvent({ type: "combat", data: enemyData });
        } else if (result.combatResult) {
          // EXISTING ENEMY: Update only current HP, keep maxHp unchanged
          console.log("[Frontend] Updating enemy HP from combat result");
          setEnemyState((prev) =>
            prev
              ? {
                  ...prev,
                  hp: result.combatResult.enemyHealth, // Only update current HP
                  // maxHp stays the same!
                }
              : null
          );
        }
      } else {
        // No enemy - clear combat
        console.log("[Frontend] No enemy, clearing combat state");
        setEnemyState(null);
        if (result.gameState.currentPhase !== "event_choice") {
          setCurrentEvent({ type: null });
        }
      }

      // ============================================================================
      // ADD MESSAGE TO CHAT
      // ============================================================================
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: result.message,
          choices: result.choices || ["Continue Forward"],
        },
      ]);

      // ============================================================================
      // HANDLE GAME PHASE CHANGES
      // ============================================================================
      if (result.gameState.currentPhase === "game_over") {
        setShowGameOver(true);
      } else if (result.gameState.currentPhase === "victory") {
        setShowVictory(true);
      } else if (result.gameState.character.currentHealth <= 0) {
        setShowGameOver(true);
      }
    } catch (error) {
      console.error("[Frontend] Exception in handleChatAction:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "An error occurred. Please try again.",
          choices: ["Continue Forward"],
        },
      ]);
    } finally {
      setActionLocked(false);
    }
  };

  const handleItemUse = (item: Item) => {
    if (item.type === "potion") {
      setPlayerState((prev) => ({
        ...prev,
        hp: Math.min(prev.hp + (item.healAmount || 0), playerMaxHp),
        inventory: prev.inventory.filter((i) => i.id !== item.id),
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: `You used ${item.name} and restored ${item.healAmount} HP!`,
          choices: enemyState
            ? ["Attack", "Flee"]
            : ["Continue Forward"],
        },
      ]);
    }
  };

  const handleEquipItem = (item: Item, slot: string) => {
    setPlayerState((prev) => {
      const newState = { ...prev };

      // If equipping armour, HP stays the same (new maxHp just increases)
      // Equip new item
      newState.equipped = {
        ...newState.equipped,
        [slot]: item,
      };
      newState.inventory = newState.inventory.filter((i) => i.id !== item.id);

      return newState;
    });
  };

  const handleDropEquipment = (slot: string) => {
    setPlayerState((prev) => {
      const newState = { ...prev };

      if (slot === "armour" && prev.equipped.armour) {
        const newMaxHp = prev.maxHp;
        newState.hp = Math.min(prev.hp, newMaxHp);
      }

      newState.equipped = {
        ...prev.equipped,
        [slot]: undefined,
      };

      return newState;
    });

    setMessages((prev) => {
      const lastChoices =
        prev.length > 0 ? prev[prev.length - 1].choices : undefined;

      return [
        ...prev,
        {
          id: generateMessageId(),
          text: `You unequipped your ${slot}.`,
          choices: lastChoices,
        },
      ];
    });
  };

  const handleReturnToCampaigns = () => {
    router.push("/campaigns");
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.panelsGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <CharacterPanel
            playerState={playerState}
            playerAttack={playerAttack}
            playerDefense={playerDefense}
            playerMaxHp={playerMaxHp}
          />
          <ItemPanel
            inventory={playerState.inventory}
            equipped={playerState.equipped}
            onUseItem={handleItemUse}
            onEquipItem={handleEquipItem}
            onDropEquipment={handleDropEquipment}
            inCombat={enemyState !== null && enemyState.hp > 0}
          />
        </div>

        {/* Center Column */}
        <div className={styles.centerColumns}>
          <ChatPanel
            messages={messages}
            onAction={handleChatAction}
            disabled={diceRolling || showGameOver || showVictory} // Add game end conditions
          />
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          <EventPanel currentEvent={currentEvent} enemyState={enemyState} />
          <DicePanel isRolling={diceRolling} lastResult={lastDiceResult} />
        </div>
      </div>

      {/* Add pointer-events: none to entire grid when game ends */}
      {(showGameOver || showVictory) && (
        <div className={styles.disableOverlay}></div>
      )}

      {/* Game Over Modal */}
      {showGameOver && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h1 className={styles.modalTitle}>You Died!</h1>
            <p className={styles.modalText}>
              Your adventure has come to an end...
            </p>
            <button
              className={styles.modalButton}
              onClick={handleReturnToCampaigns}
            >
              Return to Campaigns
            </button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h1 className={styles.modalTitle}>You Beat The Boss!</h1>
            <div className={styles.victoryImage}>
              <Image
                src="/other/victory.png"
                alt="Victory"
                className={styles.victoryImg}
                width={512}
                height={512}
              />
            </div>
            <p className={styles.modalText}>
              Congratulations, brave adventurer!
            </p>
            <button
              className={styles.modalButton}
              onClick={handleReturnToCampaigns}
            >
              Return to Campaigns
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function mapChoiceToAction(choice: string): string {
  const mapping: Record<string, string> = {
    "Continue Forward": "continue",
    Attack: "attack",
    Flee: "flee",
    "Pick Up": "pickup_item",
    "Leave It": "reject_item",
    Accept: "accept_event",
    Reject: "reject_event",
    "Replace Equipment": "equip_item",
  };

  const result = mapping[choice] || "continue";
  console.log(`[Frontend] mapChoiceToAction: "${choice}" -> "${result}"`);
  return result;
}

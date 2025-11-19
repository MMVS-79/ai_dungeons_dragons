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

// // Mock LLM response generator (replace this with your actual LLM API call later)
// const generateLLMResponse = (
//   choice: string,
//   diceRoll: number,
//   gameState: GameStateContext
// ) => {
//   if (gameState.enemyState && gameState.enemyState.hp > 0) {
//     // In combat
//     if (choice === "Attack") {
//       const playerDamage = Math.max(
//         1,
//         gameState.playerAttack - gameState.enemyState.defense + (diceRoll - 10)
//       );
//       const enemyDamage = Math.max(
//         1,
//         gameState.enemyState.attack - gameState.playerDefense
//       );

//       return {
//         type: "combat",
//         message: `You rolled a ${diceRoll}! You strike the ${gameState.enemyState.name} for ${playerDamage} damage! The ${gameState.enemyState.name} retaliates for ${enemyDamage} damage!`,
//         playerDamage: enemyDamage,
//         enemyDamage: playerDamage,
//         choices: ["Attack", "Use Potion"]
//       };
//     } else if (choice === "Use Potion") {
//       return {
//         type: "potion_prompt",
//         message: "Select a potion from your inventory to use.",
//         choices: ["Attack", "Use Potion"]
//       };
//     }
//   } else {
//     // Exploring
//     const eventRoll = Math.random() * 100;

//     if (diceRoll >= 20) {
//       return {
//         type: "combat",
//         message: `You rolled a ${diceRoll}! A Red Dragon crashed down from the sky!`,
//         enemy: {
//           name: "Red Dragon",
//           hp: 100,
//           maxHp: 100,
//           attack: 30,
//           defense: 15,
//           image: "/characters/enemy/boss/dragon.png",
//           isBoss: true
//         },
//         choices: ["Attack", "Use Potion"]
//       };
//     } else if (diceRoll >= 15) {
//       return {
//         type: "combat",
//         message: `You rolled a ${diceRoll}! A Goblin Warrior jumps out from the shadows!`,
//         enemy: {
//           name: "Goblin Warrior",
//           hp: 30,
//           maxHp: 30,
//           attack: 8,
//           defense: 3,
//           image: "/characters/enemy/low/goblin.png"
//         },
//         choices: ["Attack", "Use Potion"]
//       };
//     } else if (diceRoll >= 10 && eventRoll < 33) {
//       // Found weapon
//       return {
//         type: "equipment",
//         equipmentType: "weapon",
//         message: `You rolled a ${diceRoll}! You discovered a gleaming Steel Blade in an old chest!`,
//         equipment: {
//           id: `weapon_${Date.now()}`,
//           name: "Steel Blade",
//           type: "weapon",
//           image: "/items/epic_sword.png",
//           attack: 10,
//           description: "A sharp steel blade (+10 Attack)"
//         },
//         choices: ["Pick Up", "Leave It"]
//       };
//     } else if (diceRoll >= 10 && eventRoll < 66) {
//       // Found armour
//       return {
//         type: "equipment",
//         equipmentType: "armour",
//         message: `You rolled a ${diceRoll}! You found a suit of Leather Armour hanging on the wall!`,
//         equipment: {
//           id: `armour_${Date.now()}`,
//           name: "Leather Armour",
//           type: "armour",
//           image: "/items/rare_armour.png",
//           hpBonus: 30,
//           description: "Sturdy iron protection (+30 Max HP)"
//         },
//         choices: ["Pick Up", "Leave It"]
//       };
//     } else if (diceRoll >= 10) {
//       // Found shield
//       return {
//         type: "equipment",
//         equipmentType: "shield",
//         message: `You rolled a ${diceRoll}! A Knight's Shield lies against the wall!`,
//         equipment: {
//           id: `shield_${Date.now()}`,
//           name: "Knight's Shield",
//           type: "shield",
//           image: "/items/epic_shield.png",
//           defense: 10,
//           description: "A reliable shield (+10 Defense)"
//         },
//         choices: ["Pick Up", "Leave It"]
//       };
//     } else if (diceRoll >= 1) {
//       return {
//         type: "item",
//         message: `You rolled a ${diceRoll}! You found a Health Potion hidden in the ruins!`,
//         item: {
//           id: `potion_${Date.now()}`,
//           name: "Health Potion",
//           type: "potion",
//           image: "/items/red_potion.png",
//           healAmount: 20,
//           description: "Restores 20 HP"
//         },
//         choices: ["Continue Forward", "Search Area"]
//       };
//     } else {
//       return {
//         type: "story",
//         message: `You rolled a ${diceRoll}. You carefully navigate through the dark corridor. Nothing happens... yet.`,
//         choices: ["Continue Forward", "Search Area"]
//       };
//     }
//   }
// };

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
                choices: ["Continue Forward", "Search Area"],
              },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId(),
              text: `You decided to leave the ${pendingEquipment.name} behind.`,
              choices: ["Continue Forward", "Search Area"],
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
            choices: ["Continue Forward", "Search Area"],
          },
        ]);

        setPendingEquipment(null);
        setCurrentEvent({ type: null });
        setActionLocked(false);
        return;
      }

      // Trigger dice roll
      setDiceRolling(true);
      setLastDiceResult(null);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const diceResult = Math.floor(Math.random() * 20) + 1;
      setLastDiceResult(diceResult);
      setDiceRolling(false);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // 🔥 API CALL (when you're ready to connect)
      // Uncomment this section and remove the mock generateLLMResponse call
      console.log(
        `[Frontend] Calling API: ${choice} -> ${mapChoiceToAction(choice)}`
      );

      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: Number(params.id),
          actionType: mapChoiceToAction(choice),
          actionData: { diceRoll: diceResult },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process action");
      }

      const result = await response.json();

      // 🔍 DEBUG: Log the full response
      console.log("=== API RESPONSE DEBUG ===");
      console.log("Success:", result.success);
      console.log("Message:", result.message);
      console.log("Choices:", result.choices);
      console.log("Current Phase:", result.gameState.currentPhase);
      console.log("Has Enemy:", !!result.gameState.enemy);
      console.log("Pending Event:", result.gameState.pendingEvent);
      console.log("========================");

      if (result.success) {
        // Update character stats
        if (result.gameState.character) {
          setPlayerState((prev) => ({
            ...prev,
            hp: result.gameState.character.currentHealth,
            maxHp: result.gameState.character.maxHealth,
            baseAttack: result.gameState.character.attack,
            baseDefense: result.gameState.character.defense,
          }));
        }

        // ============================================================================
        // 2. HANDLE ENEMY STATE (Combat Phase)
        // ============================================================================
        if (result.gameState.enemy) {
          console.log(
            "[Frontend] Enemy detected:",
            result.gameState.enemy.name
          );

          // ✅ FIX: Provide default image and validate URL
          const enemyImagePath =
            result.gameState.enemy.spritePath ||
            "/characters/enemy/low/goblin.png";

          // Create enemy object with validated image path
          const enemyData = {
            name: result.gameState.enemy.name,
            hp: result.gameState.enemy.health,
            maxHp: result.gameState.enemy.health,
            attack: result.gameState.enemy.attack,
            defense: result.gameState.enemy.defense,
            image: enemyImagePath,
          };

          setEnemyState(enemyData);
          setCurrentEvent({
            type: "combat",
            data: enemyData,
          });
        } else {
          console.log("[Frontend] No enemy, clearing combat state");
          setEnemyState(null);

          if (result.gameState.currentPhase !== "event_choice") {
            setCurrentEvent({ type: null });
          }
        }

        // ============================================================================
        // 3. ADD MESSAGE TO CHAT
        // ============================================================================
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: result.message,
            choices: result.choices || ["Continue Forward", "Search Area"],
          },
        ]);

        // ============================================================================
        // 4. HANDLE GAME PHASE CHANGES
        // ============================================================================
        console.log(`[Frontend] Game phase: ${result.gameState.currentPhase}`);

        // Handle specific phases
        switch (result.gameState.currentPhase) {
          case "event_choice":
            // Event preview phase - show Accept/Reject
            console.log("[Frontend] Entering event_choice phase");
            break;

          case "combat":
            // Combat started - enemy should already be set above
            console.log("[Frontend] Entering combat phase");
            break;

          case "exploration":
            // Back to exploring
            console.log("[Frontend] Entering exploration phase");
            break;

          case "game_over":
            setShowGameOver(true);
            break;

          case "victory":
            setShowVictory(true);
            break;
        }

        // ============================================================================
        // 5. CHECK WIN/LOSS CONDITIONS (for mock combat)
        // ============================================================================
        // This handles when character HP drops to 0
        if (result.gameState.character.currentHealth <= 0) {
          console.log("[Frontend] Character defeated!");
          setShowGameOver(true);
        }
      } else {
        // API returned success: false
        console.error("[Frontend] API error:", result.error);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: `Error: ${result.error || "Unknown error occurred"}`,
            choices: ["Continue Forward", "Search Area"],
          },
        ]);
      }
    } catch (error) {
      console.error("[Frontend] Exception in handleChatAction:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "An error occurred. Please try again.",
          choices: ["Continue Forward", "Search Area"],
        },
      ]);
    } finally {
      setActionLocked(false);
    }
  };

  //       // Add message to chat
  //       setMessages(prev => [...prev, {
  //         id: generateMessageId(),
  //         text: result.message,
  //         choices: result.choices || ['Continue Forward', 'Search Area']
  //       }]);

  //       // Update enemy if combat
  //       if (result.gameState.currentEnemy) {
  //         setEnemyState(result.gameState.currentEnemy);
  //       } else {
  //         setEnemyState(null);
  //       }
  //     }

  //     // Mock response (current implementation)
  //     /*
  //     const response = generateLLMResponse(choice, diceResult, {
  //       enemyState,
  //       playerAttack,
  //       playerDefense
  //     })!;
  //     */

  //     // Update game state based on response
  //     if (response.type === "combat") {
  //       if (response.enemy) {
  //         setEnemyState(response.enemy);
  //         setCurrentEvent({ type: "combat", data: response.enemy });
  //       } else if (
  //         response.enemyDamage !== undefined &&
  //         response.playerDamage !== undefined
  //       ) {
  //         const newEnemyHp = Math.max(
  //           0,
  //           (enemyState?.hp || 0) - response.enemyDamage
  //         );
  //         const newPlayerHp = Math.max(
  //           0,
  //           playerState.hp - response.playerDamage
  //         );

  //         const playerDied = newPlayerHp <= 0;
  //         const enemyDefeated = enemyState && newEnemyHp <= 0;
  //         const wasBoss = enemyDefeated && enemyState?.isBoss === true;

  //         if (playerDied) {
  //           setShowGameOver(true);
  //           setActionLocked(true);
  //         } else if (wasBoss) {
  //           setShowVictory(true);
  //           setActionLocked(true);
  //         }

  //         setEnemyState((prev) =>
  //           prev
  //             ? {
  //                 ...prev,
  //                 hp: newEnemyHp
  //               }
  //             : null
  //         );

  //         setPlayerState((prev) => ({
  //           ...prev,
  //           hp: newPlayerHp
  //         }));

  //         if (enemyDefeated && !wasBoss) {
  //           setTimeout(() => {
  //             setEnemyState(null);
  //             setCurrentEvent({ type: null });
  //             setMessages((prev) => [
  //               ...prev,
  //               {
  //                 id: generateMessageId(),
  //                 text: `Victory! The ${enemyState.name} has been defeated!`,
  //                 choices: ["Continue Forward", "Search Area"]
  //               }
  //             ]);
  //           }, 1500);
  //         }
  //       }
  //     } else if (response.type === "item" && (response.item as Item)) {
  //       if (playerState.inventory.length < 10) {
  //         setPlayerState((prev) => ({
  //           ...prev,
  //           inventory: [...prev.inventory, response.item as Item]
  //         }));
  //         setCurrentEvent({ type: "item", data: response.item as Item });
  //       } else {
  //         setMessages((prev) => [
  //           ...prev,
  //           {
  //             id: generateMessageId(),
  //             text: "Your inventory is full! You cannot pick up the item.",
  //             choices: ["Continue Forward", "Search Area"]
  //           }
  //         ]);
  //         return;
  //       }
  //     } else if (
  //       response.type === "equipment" &&
  //       (response.equipment as Item)
  //     ) {
  //       setPendingEquipment(response.equipment as Item);
  //       setCurrentEvent({
  //         type: "equipment",
  //         data: response.equipment as Item
  //       });
  //     } else if (response.type === "story") {
  //       setCurrentEvent({ type: "story" });
  //     }

  //     // Update chat
  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         id: generateMessageId(),
  //         text: response.message,
  //         choices: response.choices
  //       }
  //     ]);
  //   } finally {
  //     setActionLocked(false);
  //   }
  // };

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
            ? ["Attack", "Use Potion"]
            : ["Continue Forward", "Search Area"],
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
    "Search Area": "search",
    Attack: "attack",
    "Use Potion": "use_item",
    "Pick Up": "pickup_item",
    "Leave It": "reject_item",
    Accept: "accept_event",
    Reject: "reject_event",
    "Replace Equipment": "equip_item",
  };
  return mapping[choice] || "continue";
}

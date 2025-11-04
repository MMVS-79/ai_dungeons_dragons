"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  type: "weapon" | "armor" | "shield" | "potion";
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
    armor?: Item;
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
}

interface GameEvent {
  type: "combat" | "item" | "story" | "equipment" | null;
  data?: any;
}

interface Message {
  id: string;
  text: string;
  choices?: string[];
}

// Mock LLM response generator (replace this with your actual LLM API call later)
const generateLLMResponse = (
  choice: string,
  diceRoll: number,
  gameState: any
) => {
  if (gameState.enemyState && gameState.enemyState.hp > 0) {
    // In combat
    if (choice === "Attack") {
      const playerDamage = Math.max(
        1,
        gameState.playerAttack - gameState.enemyState.defense + (diceRoll - 10)
      );
      const enemyDamage = Math.max(
        1,
        gameState.enemyState.attack - gameState.playerDefense
      );

      return {
        type: "combat",
        message: `You rolled a ${diceRoll}! You strike the ${gameState.enemyState.name} for ${playerDamage} damage! The ${gameState.enemyState.name} retaliates for ${enemyDamage} damage!`,
        playerDamage: enemyDamage,
        enemyDamage: playerDamage,
        choices: ["Attack", "Use Potion"],
      };
    } else if (choice === "Use Potion") {
      return {
        type: "potion_prompt",
        message: "Select a potion from your inventory to use.",
        choices: ["Attack", "Use Potion"],
      };
    }
  } else {
    // Exploring
    const eventRoll = Math.random() * 100;

    if (diceRoll >= 20) {
      return {
        type: "combat",
        message: `You rolled a ${diceRoll}! A Red Dragon crashed down from the sky!`,
        enemy: {
          name: "Red Dragon",
          hp: 100,
          maxHp: 100,
          attack: 30,
          defense: 15,
          image: "/characters/enemy/boss/dragon.png",
          isBoss: true, // Add this flag
        },
        choices: ["Attack", "Use Potion"],
      };
    } else if (diceRoll >= 15) {
      return {
        type: "combat",
        message: `You rolled a ${diceRoll}! A Goblin Warrior jumps out from the shadows!`,
        enemy: {
          name: "Goblin Warrior",
          hp: 30,
          maxHp: 30,
          attack: 8,
          defense: 3,
          image: "/characters/enemy/low/goblin.png",
        },
        choices: ["Attack", "Use Potion"],
      };
    } else if (diceRoll >= 10 && eventRoll < 33) {
      // Found weapon
      return {
        type: "equipment",
        equipmentType: "weapon",
        message: `You rolled a ${diceRoll}! You discovered a gleaming Steel Blade in an old chest!`,
        equipment: {
          id: `weapon_${Date.now()}`,
          name: "Steel Blade",
          type: "weapon",
          image: "/items/epic_sword.png",
          attack: 10,
          description: "A sharp steel blade (+10 Attack)",
        },
        choices: ["Pick Up", "Leave It"],
      };
    } else if (diceRoll >= 10 && eventRoll < 66) {
      // Found armor
      return {
        type: "equipment",
        equipmentType: "armor",
        message: `You rolled a ${diceRoll}! You found a suit of Leather Armor hanging on the wall!`,
        equipment: {
          id: `armor_${Date.now()}`,
          name: "Leather Armor",
          type: "armor",
          image: "/items/rare_armour.png",
          hpBonus: 30,
          description: "Sturdy iron protection (+30 Max HP)",
        },
        choices: ["Pick Up", "Leave It"],
      };
    } else if (diceRoll >= 10) {
      // Found shield
      return {
        type: "equipment",
        equipmentType: "shield",
        message: `You rolled a ${diceRoll}! A Knight's Shield lies against the wall!`,
        equipment: {
          id: `shield_${Date.now()}`,
          name: "Knight's Shield",
          type: "shield",
          image: "/items/epic_shield.png",
          defense: 10,
          description: "A reliable shield (+10 Defense)",
        },
        choices: ["Pick Up", "Leave It"],
      };
    } else if (diceRoll >= 1) {
      return {
        type: "item",
        message: `You rolled a ${diceRoll}! You found a Health Potion hidden in the ruins!`,
        item: {
          id: `potion_${Date.now()}`,
          name: "Health Potion",
          type: "potion",
          image: "/items/red_potion.png",
          healAmount: 20,
          description: "Restores 20 HP",
        },
        choices: ["Continue Forward", "Search Area"],
      };
    } else {
      return {
        type: "story",
        message: `You rolled a ${diceRoll}. You carefully navigate through the dark corridor. Nothing happens... yet.`,
        choices: ["Continue Forward", "Search Area"],
      };
    }
  }
};

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

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
      armor:  {
        id: `armor1`,
        name: "Leather Armor",
        type: "armor",
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

  // Calculate total stats - armor now affects maxHp instead of defense
  const playerAttack =
    playerState.baseAttack + (playerState.equipped.weapon?.attack || 0);
  const playerDefense =
    playerState.baseDefense +
    (playerState.equipped.shield?.defense || 0);
  const playerMaxHp = 
    playerState.maxHp + (playerState.equipped.armor?.hpBonus || 0);

  // Main action handler
  const handleChatAction = async (choice: string) => {
    // Prevent input spam OR if game has ended
    if (actionLocked || showGameOver || showVictory) return;
    setActionLocked(true);

    try {
      // Handle equipment pickup/leave
      if (pendingEquipment && (choice === "Pick Up" || choice === "Leave It")) {
        if (choice === "Pick Up") {
          const equipmentSlot = pendingEquipment.type as
            | "weapon"
            | "armor"
            | "shield";

          // Check if slot is occupied
          if (playerState.equipped[equipmentSlot]) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                text: `You already have a ${equipmentSlot} equipped. Would you like to replace it?`,
                choices: ["Replace Equipment", "Leave It"],
              },
            ]);
            return;
          } else {
            // Equip directly
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
                id: Date.now().toString(),
                text: `You equipped the ${pendingEquipment.name}!`,
                choices: ["Continue Forward", "Search Area"],
              },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
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
          | "armor"
          | "shield";
        const oldEquipment = playerState.equipped[equipmentSlot];

        setPlayerState((prev) => {
          const newState = { ...prev };
          
          // If replacing armor, adjust HP to not exceed new max
          if (equipmentSlot === "armor") {
            const oldHpBonus = oldEquipment?.hpBonus || 0;
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
            id: Date.now().toString(),
            text: `You replaced your ${oldEquipment?.name} with the ${pendingEquipment.name}!`,
            choices: ["Continue Forward", "Search Area"],
          },
        ]);

        setPendingEquipment(null);
        setCurrentEvent({ type: null });
        setActionLocked(false);
        return;
      }

      // 1. Trigger dice roll
      setDiceRolling(true);
      setLastDiceResult(null);

      // Simulate dice roll animation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const diceResult = Math.floor(Math.random() * 20) + 1;
      setLastDiceResult(diceResult);
      setDiceRolling(false);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Generate LLM response (replace with actual API call)
      const response = generateLLMResponse(choice, diceResult, {
        enemyState,
        playerAttack,
        playerDefense,
      })!;

      // 3. Update game state based on response
      if (response.type === "combat") {
        if (response.enemy) {
          // New combat encounter
          setEnemyState(response.enemy);
          setCurrentEvent({ type: "combat", data: response.enemy });
        } else if (
          response.enemyDamage !== undefined &&
          response.playerDamage !== undefined
        ) {
          // Combat damage
          const newEnemyHp = Math.max(0, (enemyState?.hp || 0) - response.enemyDamage);
          const newPlayerHp = Math.max(0, playerState.hp - response.playerDamage);
          
          // Check game end conditions IMMEDIATELY
          const playerDied = newPlayerHp <= 0;
          const enemyDefeated = enemyState && newEnemyHp <= 0;
          const wasBoss = enemyDefeated && (enemyState as any).isBoss === true;
                  
          // Set game end states immediately to block further actions
          if (playerDied) {
            setShowGameOver(true);
            setActionLocked(true);
          } else if (wasBoss) {
            setShowVictory(true);
            setActionLocked(true);
          }

          setEnemyState((prev) =>
            prev
              ? {
                  ...prev,
                  hp: newEnemyHp,
                }
              : null
          );

          setPlayerState((prev) => ({
            ...prev,
            hp: newPlayerHp,
          }));

          // Show messages with delay (for dramatic effect)
          if (playerDied) {
            // Don't need to do anything, modal already showing
          } else if (enemyDefeated && !wasBoss) {
            setTimeout(() => {
              setEnemyState(null);
              setCurrentEvent({ type: null });
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  text: `Victory! The ${enemyState.name} has been defeated!`,
                  choices: ["Continue Forward", "Search Area"],
                },
              ]);
            }, 1500);
          }
        }
      } else if (response.type === "item" && response.item) {
        if (playerState.inventory.length < 10) {
          setPlayerState((prev) => ({
            ...prev,
            inventory: [...prev.inventory, response.item],
          }));
          setCurrentEvent({ type: "item", data: response.item });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: "Your inventory is full! You cannot pick up the item.",
              choices: ["Continue Forward", "Search Area"],
            },
          ]);
          return;
        }
      } else if (response.type === "equipment" && response.equipment) {
        setPendingEquipment(response.equipment);
        setCurrentEvent({ type: "equipment", data: response.equipment });
      } else if (response.type === "story") {
        setCurrentEvent({ type: "story" });
      }

      // 4. Update chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: response.message,
          choices: response.choices,
        },
      ]);
    } finally {
      // --- Ensure it always unlocks ---
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
          id: Date.now().toString(),
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
      
      // If equipping armor, HP stays the same (new maxHp just increases)
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
      
      // If unequipping armor, cap HP to new maxHp
      if (slot === "armor" && prev.equipped.armor) {
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
      const lastChoices = prev.length > 0 ? prev[prev.length - 1].choices : undefined;
    
      return [
        ...prev,
        {
          id: Date.now().toString(),
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
            disabled={diceRolling || showGameOver || showVictory}  // Add game end conditions
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
            <p className={styles.modalText}>Your adventure has come to an end...</p>
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
              <img 
                src="/victory.png" 
                alt="Victory" 
                className={styles.victoryImg}
              />
            </div>
            <p className={styles.modalText}>Congratulations, brave adventurer!</p>
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
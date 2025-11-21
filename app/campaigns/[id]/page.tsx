"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./interface.module.css";
import CharacterPanel from "./components/characterPanel/characterPanel";
import EventPanel from "./components/eventPanel/eventPanel";
import ChatPanel from "./components/chatPanel/chatPanel";
import ItemPanel from "./components/itemPanel/itemPanel";
import DicePanel from "./components/dicePanel/dicePanel";

// Type definitions
interface Item {
  id: number;
  name: string;
  rarity: number;
  statModified: "health" | "attack" | "defense";
  statValue: number;
  description?: string;
  spritePath?: string;
}

interface Equipment {
  weapon?: {
    id: number;
    name: string;
    rarity: number;
    attack: number;
    description?: string;
    spritePath?: string;
  };
  armour?: {
    id: number;
    name: string;
    rarity: number;
    health: number;
    description?: string;
    spritePath?: string;
  };
  shield?: {
    id: number;
    name: string;
    rarity: number;
    defense: number;
    description?: string;
    spritePath?: string;
  };
}

interface PlayerState {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  inventory: Item[];
  equipment: Equipment;
}

interface EnemyState {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

interface Message {
  id: string;
  text: string;
  choices?: string[];
}

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();

  const messageIdCounter = useRef(0);
  const [loading, setLoading] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [enemyState, setEnemyState] = useState<EnemyState | null>(null);
  const [itemFound, setItemFound] = useState<Item | Equipment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [diceRolling, setDiceRolling] = useState(false);
  const [lastDiceResult, setLastDiceResult] = useState<number | null>(null);
  const [actionLocked, setActionLocked] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [temporaryBuffs, setTemporaryBuffs] = useState({
    attack: 0,
    defense: 0,
  });

  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `${Date.now()}-${messageIdCounter.current}`;
  };

  // Load game state on mount
  useEffect(() => {
    loadGameState();
  }, [params.id]);

  const loadGameState = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/game/action?campaignId=${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to load game state");
      }

      const result = await response.json();

      if (result.success && result.validation) {
        // Load initial state via a "continue" action to generate first event
        await handleChatAction("Continue Forward");
      }

      setLoading(false);
    } catch (error) {
      console.error("[Frontend] Error loading game state:", error);
      setLoading(false);
    }
  };

  const handleChatAction = async (choice: string) => {
    if (actionLocked || showGameOver || showVictory) return;
    setActionLocked(true);

    try {
      const actionType = mapChoiceToAction(choice);

      // Determine if dice roll is needed
      const actionsNeedingDice = ["attack", "flee", "continue", "investigate"];
      const needsDiceRoll = actionsNeedingDice.includes(actionType);

      let diceResult = 0;

      if (needsDiceRoll) {
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
        const errorData = await response.json();
        console.error("[Frontend] API error response:", errorData);
        throw new Error(errorData.error || "Failed to process action");
      }

      const result = await response.json();
      console.log(`[Frontend] API response:`, result);

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

      // Update player state from backend
      if (result.gameState.character) {
        const char = result.gameState.character;
        const equip = result.gameState.equipment || {};
        const inv = result.gameState.inventory || [];

        setPlayerState({
          name: char.name,
          image: char.spritePath || "/characters/player/warrior.png",
          hp: char.currentHealth,
          maxHp: char.maxHealth,
          attack: char.attack,
          defense: char.defense,
          inventory: inv,
          equipment: equip,
        });
      }

      // Update enemy state
      if (result.gameState.enemy) {
        const combatState = result.gameState.combatState;

        setEnemyState({
          name: result.gameState.enemy.name,
          image:
            result.gameState.enemy.spritePath ||
            "/characters/enemy/low/goblin.png",
          hp: combatState?.enemyCurrentHp || result.gameState.enemy.health,
          maxHp: result.gameState.enemy.health,
          attack: result.gameState.enemy.attack,
          defense: result.gameState.enemy.defense,
        });

        // Update temporary buffs
        if (combatState?.temporaryBuffs) {
          setTemporaryBuffs(combatState.temporaryBuffs);
        }
      } else {
        setEnemyState(null);
        setTemporaryBuffs({ attack: 0, defense: 0 });
      }

      if (result.itemFound) {
        console.log("[Frontend] Item found:", result.itemFound);
        setItemFound(result.itemFound);
      } else if (result.gameState.currentPhase === "combat") {
        // Clear item when entering combat
        setItemFound(null);
      } else if (
        result.gameState.currentPhase === "exploration" &&
        !result.itemFound
      ) {
        // Clear item after a "Continue Forward" if no new item
        setItemFound(null);
      }

      // Add message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: result.message,
          choices: result.choices || ["Continue Forward"],
        },
      ]);

      // Handle game phase changes
      if (result.gameState.currentPhase === "game_over") {
        setShowGameOver(true);
      } else if (result.gameState.currentPhase === "victory") {
        setShowVictory(true);
      }
    } catch (error) {
      console.error("[Frontend] Exception in handleChatAction:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          choices: ["Continue Forward"],
        },
      ]);
    } finally {
      setActionLocked(false);
    }
  };

  const handleItemUse = async (item: Item) => {
    if (actionLocked) return;

    setActionLocked(true);

    try {
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: Number(params.id),
          actionType: "use_item_combat",
          actionData: { itemId: item.id },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to use item");
      }

      const result = await response.json();

      if (result.success) {
        // Update state from backend
        if (result.gameState.character) {
          const char = result.gameState.character;
          const equip = result.gameState.equipment || {};
          const inv = result.gameState.inventory || [];

          setPlayerState({
            name: char.name,
            image: char.spritePath || "/characters/player/warrior.png",
            hp: char.currentHealth,
            maxHp: char.maxHealth,
            attack: char.attack,
            defense: char.defense,
            inventory: inv,
            equipment: equip,
          });
        }

        // Update temporary buffs
        if (result.gameState.combatState?.temporaryBuffs) {
          setTemporaryBuffs(result.gameState.combatState.temporaryBuffs);
        }

        // Add message
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: result.message,
            choices: result.choices || ["Attack", "Flee", "Use Item"],
          },
        ]);
      }
    } catch (error) {
      console.error("[Frontend] Error using item:", error);
    } finally {
      setActionLocked(false);
    }
  };

  const handleReturnToCampaigns = () => {
    router.push("/campaigns");
  };

  if (loading || !playerState) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingScreen}>Loading campaign...</div>
      </div>
    );
  }

  const effectiveAttack = playerState.attack + temporaryBuffs.attack;
  const effectiveDefense = playerState.defense + temporaryBuffs.defense;
  const playerMaxHp =
    playerState.maxHp + (playerState.equipment.armour?.health || 0);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.panelsGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <CharacterPanel
            playerState={playerState}
            playerAttack={effectiveAttack}
            playerDefense={effectiveDefense}
            playerMaxHp={playerMaxHp}
            temporaryBuffs={temporaryBuffs}
          />
          <ItemPanel
            inventory={playerState.inventory}
            equipped={playerState.equipment}
            onUseItem={handleItemUse}
            inCombat={enemyState !== null && enemyState.hp > 0}
          />
        </div>

        {/* Center Column */}
        <div className={styles.centerColumns}>
          <ChatPanel
            messages={messages}
            onAction={handleChatAction}
            disabled={diceRolling || showGameOver || showVictory}
          />
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          <EventPanel enemy={enemyState} itemFound={itemFound} />
          <DicePanel isRolling={diceRolling} lastResult={lastDiceResult} />
        </div>
      </div>

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
            <h1 className={styles.modalTitle}>Victory!</h1>
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
    Investigate: "investigate",
    Decline: "decline",
    Attack: "attack",
    Flee: "flee",
    "Use Item": "use_item_combat",
  };

  const result = mapping[choice] || "continue";
  console.log(`[Frontend] mapChoiceToAction: "${choice}" -> "${result}"`);
  return result;
}

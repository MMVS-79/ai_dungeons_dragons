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
import { BackgroundMusicService } from "@/app/services/background-music.service";

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

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  attack: number;
  description?: string;
  spritePath?: string;
}

export interface Armour {
  id: number;
  name: string;
  rarity: number;
  health: number;
  description?: string;
  spritePath?: string;
}

export interface Shield {
  id: number;
  name: string;
  rarity: number;
  defense: number;
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
  class?: string;
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

interface GameEvent {
  id: number;
  campaignId: number;
  message: string;
  eventNumber: number;
  eventType: string;
  createdAt: Date;
}

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();

  const messageIdCounter = useRef(0);
  const currentMusicState = useRef<"exploration" | "combat">("exploration");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [enemyState, setEnemyState] = useState<EnemyState | null>(null);
  const [itemFound, setItemFound] = useState<
    Weapon | Armour | Shield | Item | null
  >(null);
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
  const [musicPlaying, setMusicPlaying] = useState(true);

  const toggleMusic = () => {
    if (musicPlaying) {
      BackgroundMusicService.pause();
    } else {
      BackgroundMusicService.resume();
    }
    setMusicPlaying(!musicPlaying);
  };

  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `${Date.now()}-${messageIdCounter.current}`;
  };

  // Load game state on mount
  useEffect(() => {
    loadGameState();
  }, [params.id]);

  useEffect(() => {
    return () => {
      BackgroundMusicService.fadeOut(500);
    };
  }, []);

  const updateBackgroundMusic = (inCombat: boolean) => {
    const desiredState = inCombat ? "combat" : "exploration";

    // Only change music if state actually changed
    if (currentMusicState.current === desiredState) {
      return;
    }

    console.log(
      `[Music] Switching from ${currentMusicState.current} to ${desiredState}`,
    );
    currentMusicState.current = desiredState;

    // Fade out current music, then fade in new music
    BackgroundMusicService.fadeOut(1500);
    setTimeout(() => {
      if (desiredState === "combat") {
        BackgroundMusicService.play(
          "/music/dramatic-orchestral-combat-music-loop-382814.mp3",
          2000,
        );
      } else {
        BackgroundMusicService.play("/music/rpg-city-8381.mp3", 2000);
      }
    }, 1500);
  };

  const loadGameState = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use GET to load state without triggering new event
      const response = await fetch(`/api/game/state?campaignId=${params.id}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("[Frontend] Failed to load game state:", errorData);

        // Handle 404 (not found or access denied)
        if (response.status === 404) {
          setError(
            "You don't have access to this campaign or it doesn't exist.",
          );
        } else {
          setError(errorData.error || "Failed to load game state");
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log("[Frontend] Initial game state loaded:", result);

      // Initialize player state
      if (result.character) {
        const char = result.character;
        const equip = result.equipment || {};
        const inv = result.inventory || [];

        const armourBonus = equip.armour?.health || 0;
        const trueMaxHp = char.maxHealth + armourBonus;
        const validCurrentHp = Math.min(char.currentHealth, trueMaxHp);

        setPlayerState({
          name: char.name,
          image: char.spritePath || "/characters/player/warrior.png",
          hp: validCurrentHp,
          maxHp: char.maxHealth,
          attack: char.attack,
          defense: char.defense,
          inventory: inv,
          equipment: equip,
          class: char.class?.name,
        });

        // Start music on initial load
        if (!playerState) {
          const inCombat = result.enemy !== null;
          currentMusicState.current = inCombat ? "combat" : "exploration";
          const musicFile = inCombat
            ? "/music/dramatic-orchestral-combat-music-loop-382814.mp3"
            : "/music/rpg-city-8381.mp3";
          BackgroundMusicService.play(musicFile, 3000);
        }
      }

      // Initialize enemy state if present
      if (result.enemy) {
        const combatState = result.combatState;

        setEnemyState({
          name: result.enemy.name,
          image: result.enemy.spritePath || "/characters/enemy/low/goblin.png",
          hp: combatState?.enemyCurrentHp || result.enemy.health,
          maxHp: result.enemy.health,
          attack: result.enemy.attack,
          defense: result.enemy.defense,
        });
      }

      // Initialize temporary buffs
      if (result.combatState?.temporaryBuffs) {
        setTemporaryBuffs(result.combatState.temporaryBuffs);
      }

      // Initialize item found
      if (result.itemFound) {
        setItemFound(result.itemFound);
      }

      // Load messages from logs and add appropriate current message
      const logMessages = result.recentEvents
        .slice()
        .reverse()
        .map((event: GameEvent) => ({
          id: generateMessageId(),
          text: event.message,
          choices: [],
        }));

      // Determine current choices based on phase
      let currentChoices = ["Continue Forward"];
      let currentMessageText = "";

      if (result.currentPhase === "combat") {
        currentChoices = ["Attack", "Flee"];
        currentMessageText = `You are in combat with ${
          result.enemy?.name || "an enemy"
        }!`;
      } else if (result.currentPhase === "investigation_prompt") {
        currentChoices = ["Investigate", "Decline"];
        currentMessageText =
          result.investigationPrompt?.message ||
          "Something awaits investigation...";
      } else if (result.currentPhase === "game_over") {
        currentChoices = [];
        currentMessageText = "You have been defeated...";
      } else if (result.currentPhase === "victory") {
        currentChoices = [];
        currentMessageText = "🎉 Victory is yours!";
      } else {
        // Exploration phase
        currentChoices = ["Continue Forward"];

        // If no events yet (fresh campaign), show welcome message
        if (logMessages.length === 0) {
          currentMessageText = "Your adventure begins...";
        } else {
          // Show last event's message as current
          currentMessageText =
            logMessages.length > 0
              ? logMessages[logMessages.length - 1].text
              : "Continue your adventure...";
        }
      }

      // Build messages array
      let finalMessages = [];

      if (logMessages.length === 0) {
        // Fresh campaign - just show welcome message
        finalMessages = [
          {
            id: generateMessageId(),
            text: currentMessageText,
            choices: currentChoices,
          },
        ];
      } else if (result.currentPhase === "investigation_prompt") {
        // Investigation prompt - add it as current message
        finalMessages = [
          ...logMessages,
          {
            id: generateMessageId(),
            text: currentMessageText,
            choices: currentChoices,
          },
        ];
      } else {
        // Normal case - last log message gets the choices
        const allMessages = [...logMessages];
        if (allMessages.length > 0) {
          allMessages[allMessages.length - 1].choices = currentChoices;
        }
        finalMessages = allMessages;
      }

      setMessages(finalMessages);
      setLoading(false);
    } catch (error) {
      console.error("[Frontend] Error loading game state:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
      setLoading(false);
    }
  };

  const handleChatAction = async (choice: string) => {
    if (actionLocked || showGameOver || showVictory) return;
    setActionLocked(true);

    try {
      const actionType = mapChoiceToAction(choice);

      // Determine if dice roll is needed
      const actionsNeedingDice = ["attack", "flee", "investigate"];
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
        `[Frontend] Calling API: ${choice} -> ${actionType}, dice: ${diceResult}`,
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
          class: char.class?.name,
        });
      }

      // Update enemy state
      if (result.gameState.enemy) {
        const combatState = result.gameState.combatState;

        console.log("[Frontend] Enemy detected:", result.gameState.enemy);

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

        // comabt music
        updateBackgroundMusic(true);

        // Update temporary buffs
        if (combatState?.temporaryBuffs) {
          setTemporaryBuffs(combatState.temporaryBuffs);
        }
      } else {
        setEnemyState(null);
        setTemporaryBuffs({ attack: 0, defense: 0 });

        // back to regular music
        updateBackgroundMusic(false);
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
        const errorData = await response.json();
        console.error("[Frontend] Failed to use item:", errorData);
        throw new Error(errorData.error || "Failed to use item");
      }

      const result = await response.json();
      console.log("[Frontend] Item use result:", result);

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
            class: char.class?.name,
          });

          if (result.gameState.currentPhase === "game_over") {
            setShowGameOver(true);
          } else if (result.gameState.currentPhase === "victory") {
            setShowVictory(true);
          }
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
            choices: result.choices || ["Attack", "Flee"],
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

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingScreen}>Loading campaign...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingScreen}>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button
            className={styles.modalButton}
            onClick={handleReturnToCampaigns}
          >
            Return to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!playerState) {
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
      {/* Music Toggle Button - ADD THIS ENTIRE BLOCK */}
      <button
        onClick={toggleMusic}
        className={styles.musicToggle}
        aria-label={musicPlaying ? "Mute music" : "Play music"}
        title={musicPlaying ? "Mute music" : "Play music"}
      >
        {musicPlaying ? "🔊" : "🔇"}
      </button>

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

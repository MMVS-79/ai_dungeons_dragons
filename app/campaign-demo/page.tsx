"use client";

import { useState, useRef, useEffect } from "react";
import type { CharacterState, LLMEvent, FinalOutcome } from "../../Pending_Review/types";
import { handleEventResponse } from "../../Pending_Review/handleEventResponse";
import styles from "./campaign-demo.module.css";

export default function EventTestPage() {
  const [player, setPlayer] = useState<CharacterState>({
    id: 1,
    name: "TestHero",
    currentHP: 50,
    maxHP: 50,
    attack: 10,
    defense: 5
  });

  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastItem, setLastItem] = useState<string | null>(null);
  const [lastDice, setLastDice] = useState<number | null>(null);

  // Ref for chat panel
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const testEvent: LLMEvent = {
    event: "Find a mysterious potion",
    type: "ITEM_DROP",
    itemId: 2,
    effects: { health: 5, attack: 0, defense: 0 }
  };

  const handleChoice = async (choice: "Accept" | "Decline") => {
    setLoading(true);

    try {
      const outcome: FinalOutcome = await handleEventResponse(testEvent, player, choice);

      // Update player stats
      setPlayer(prev => ({
        ...prev,
        currentHP: outcome.resultingStats.currentHP,
        attack: outcome.resultingStats.attack,
        defense: outcome.resultingStats.defense
      }));

      // Update item and dice panels
      setLastItem(outcome.itemEquippedId ? `Equipped Item ID: ${outcome.itemEquippedId}` : "No item change");
      setLastDice(outcome.diceRoll);

      // Merge all outcome info into one single bubble
      const combinedMessage = `Player chose: ${choice}\nDice Roll: ${outcome.diceRoll}\nOutcome Notes: ${outcome.notes}\nNew Stats: HP ${outcome.resultingStats.currentHP}, ATK ${outcome.resultingStats.attack}, DEF ${outcome.resultingStats.defense}`;

      setMessages(prev => [...prev, combinedMessage]);
    } catch (err) {
      setMessages(prev => [...prev, `Error: ${err}`]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Event Handler Test</h1>

      <div className={styles.panelContainer}>
        {/* Left: Player Stats */}
        <div className={styles.statsPanel}>
          <h3>Player Stats</h3>
          <div>HP: {player.currentHP} / {player.maxHP}</div>
          <div>ATK: {player.attack}</div>
          <div>DEF: {player.defense}</div>
        </div>

        {/* Center: Chat + Buttons */}
        <div className={styles.chatColumn}>
          <div className={styles.chatPanel}>
            {messages.map((msg, i) => (
              <div key={i} className={styles.chatBubble}>
                {msg.split("\n").map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            ))}
            {loading && <div className={styles.chatBubble}>Processing event...</div>}
            {/* Anchor div for scrolling */}
            <div ref={chatEndRef} />
          </div>

          {/* Buttons row */}
          <div className={styles.chatButtons}>
            <button onClick={() => handleChoice("Accept")}>Accept</button>
            <button onClick={() => handleChoice("Decline")}>Decline</button>
          </div>
        </div>

        {/* Right: Item + Dice */}
        <div className={styles.infoPanel}>
          <div className={styles.itemBox}>
            <h4>Item Change</h4>
            <div>{lastItem}</div>
          </div>
          <div className={styles.diceBox}>
            <h4>Last Dice Roll</h4>
            <div>{lastDice !== null ? lastDice : "-"}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

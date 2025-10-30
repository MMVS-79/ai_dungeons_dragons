"use client";

import { useState, useEffect } from "react";
import styles from "./campaign.module.css";

interface Message {
  from: "user" | "bot";
  text: string;
}

export default function CampaignDemo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"race" | "class" | "story">("race");
  const [selections, setSelections] = useState({ race: "", class: "", story: "" });
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const tabOptions = {
    race: ["Human", "Elf", "Dwarf"],
    class: ["Warrior", "Mage", "Rogue"],
    story: ["Magical Forest", "Desert Country", "Kingdom of Castles"],
  };

  const handleSelect = (tab: "race" | "class" | "story", option: string) => {
    setSelections(prev => ({ ...prev, [tab]: option }));
  };

  const allSelected = selections.race && selections.class && selections.story;

  // Initialize chat with GM message when chat opens
  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      const initialGM: Message = {
        from: "bot",
        text: `Welcome to your adventure! You are a ${selections.race} ${selections.class} in the ${selections.story}. Let the journey begin!`
      };
      setMessages([initialGM]);
    }
  }, [chatOpen, selections, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { from: "user", text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    const initialContext = `Character Race: ${selections.race}, Class: ${selections.class}, Story Setting: ${selections.story}`;
    const prompt = `${initialContext}\nPlayer says: ${inputValue}`;

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        body: prompt,
      });
      const data = await res.json();

      const botMessage: Message = { from: "bot", text: data.result || "No response" };
      setMessages(prev => [...prev, botMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Error communicating with LLM" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1>Campaign Demo</h1>
      <button className={styles.beginButton} onClick={() => setMenuOpen(true)}>
        Begin Journey
      </button>

      {menuOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${chatOpen ? styles.chatExpanded : ""}`}>
            <div className={styles.modalHeader}>
              <h2>{chatOpen ? "Your Journey Begins" : "Choose Your Path"}</h2>
              <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>
                Close
              </button>
            </div>

            {!chatOpen ? (
              <div className={styles.modalBody}>
                <div className={styles.tabs}>
                  <button
                    className={activeTab === "race" ? styles.activeTab : ""}
                    onClick={() => setActiveTab("race")}
                  >
                    Character Race
                  </button>
                  <button
                    className={activeTab === "class" ? styles.activeTab : ""}
                    onClick={() => setActiveTab("class")}
                  >
                    Character Class
                  </button>
                  <button
                    className={activeTab === "story" ? styles.activeTab : ""}
                    onClick={() => setActiveTab("story")}
                  >
                    Story Setting
                  </button>
                </div>

                <div className={styles.tabContent}>
                  <div className={styles.optionsGrid}>
                    {tabOptions[activeTab].map(option => {
                      const selected = selections[activeTab] === option;
                      return (
                        <button
                          key={option}
                          className={selected ? styles.selectedOption : ""}
                          onClick={() => handleSelect(activeTab, option)}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className={`${styles.nextButton} ${allSelected ? styles.nextEnabled : ""}`}
                    disabled={!allSelected}
                    onClick={() => setChatOpen(true)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.chatArea}>
                <div className={styles.chatMessages}>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: "8px",
                        textAlign: msg.from === "user" ? "right" : "left",
                      }}
                    >
                      <strong>{msg.from === "user" ? "You:" : "GM:"}</strong> {msg.text}
                    </div>
                  ))}
                  {loading && <div>GM is thinking...</div>}
                </div>

                <input
                  type="text"
                  placeholder="Enter message..."
                  className={styles.chatInput}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />

                <div className={styles.chatButtons}>
                  <button>Button 1</button>
                  <button>Button 2</button>
                  <button>Button 3</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import styles from "./campaign-demo.module.css";

export default function CampaignDemo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"race" | "class" | "story">("race");
  const [selections, setSelections] = useState({
    race: "",
    class: "",
    story: "",
  });
  const [chatOpen, setChatOpen] = useState(false);

  const tabOptions = {
    race: ["Human", "Elf", "Dwarf"],
    class: ["Warrior", "Mage", "Rogue"],
    story: ["Magical Forest", "Desert Country", "Kingdom of Castles"],
  };

  const handleSelect = (tab: "race" | "class" | "story", option: string) => {
    setSelections(prev => ({ ...prev, [tab]: option }));
  };

  const allSelected = selections.race && selections.class && selections.story;

  return (
    <main className={styles.main}>
      <h1>Campaign Demo</h1>
      <button className={styles.beginButton} onClick={() => setMenuOpen(true)}>
        Begin Journey
      </button>

      {menuOpen && (
        <div className={styles.modalOverlay}>
          <div
            className={`${styles.modalContent} ${chatOpen ? styles.chatExpanded : ""}`}
          >
              <div className={styles.modalHeader}>
              <h2>{chatOpen ? "Your Journey Begins" : "Choose Your Path"}</h2>
              <button
                  className={styles.closeButton}
                  onClick={() => setMenuOpen(false)}
              >
                  Close
              </button>
              </div>

            {!chatOpen ? (
              <div className={styles.modalBody}>
                {/* Tabs on the left */}
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

                {/* Right pane */}
                <div className={styles.tabContent}>
                  <div className={styles.optionsGrid}>
                    {tabOptions[activeTab].map(option => {
                      const selected = selections[activeTab] === option;
                      return (
                        <button
                          key={option}
                          className={`${selected ? styles.selectedOption : ""}`}
                          onClick={() => handleSelect(activeTab, option)}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  <button
                    className={`${styles.nextButton} ${
                      allSelected ? styles.nextEnabled : ""
                    }`}
                    disabled={!allSelected}
                    onClick={() => setChatOpen(true)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              // Chat view
              <div className={styles.chatArea}>
                <div className={styles.chatMessages}>
                  {/* Chat messages will appear here */}
                </div>
                <input
                  type="text"
                  placeholder="Enter message..."
                  className={styles.chatInput}
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

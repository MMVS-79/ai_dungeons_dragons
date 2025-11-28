"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./wiki.module.css";

// Type definitions
interface Item {
  id: number;
  name: string;
  rarity: number;
  stat_modified: "health" | "attack" | "defense";
  stat_value: number;
  description: string | null;
  sprite_path: string | null;
}

interface Weapon {
  id: number;
  name: string;
  rarity: number;
  attack: number;
  description: string | null;
  sprite_path: string | null;
}

interface Armour {
  id: number;
  name: string;
  rarity: number;
  health: number;
  description: string | null;
  sprite_path: string | null;
}

interface Shield {
  id: number;
  name: string;
  rarity: number;
  defense: number;
  description: string | null;
  sprite_path: string | null;
}

interface Enemy {
  id: number;
  name: string;
  difficulty: number;
  health: number;
  attack: number;
  defense: number;
  sprite_path: string | null;
}

interface WikiData {
  items: Item[];
  weapons: Weapon[];
  armours: Armour[];
  shields: Shield[];
  enemies: Enemy[];
}

export default function WikiPage() {
  const [data, setData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"items" | "weapons" | "armours" | "shields" | "enemies">("items");

  useEffect(() => {
    fetchWikiData();
  }, []);

  const fetchWikiData = async () => {
    try {
      const response = await fetch("/api/wiki");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch wiki data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate max values for each stat type
  const getMaxValues = () => {
    if (!data) return { maxHealth: 0, maxAttack: 0, maxDefense: 0, maxRarity: 0, maxDifficulty: 0, maxEnemyHealth: 0, maxEnemyAttack: 0, maxEnemyDefense: 0 };

    const healthItems = data.items.filter(i => i.stat_modified === "health");
    const attackItems = data.items.filter(i => i.stat_modified === "attack");
    const defenseItems = data.items.filter(i => i.stat_modified === "defense");

    return {
      maxHealth: Math.max(...healthItems.map(i => i.stat_value), 0),
      maxAttack: Math.max(...attackItems.map(i => i.stat_value), 0),
      maxDefense: Math.max(...defenseItems.map(i => i.stat_value), 0),
      maxWeaponAttack: Math.max(...data.weapons.map(w => w.attack), 0),
      maxArmourHealth: Math.max(...data.armours.map(a => a.health), 0),
      maxShieldDefense: Math.max(...data.shields.map(s => s.defense), 0),
      maxRarity: Math.max(
        ...data.items.map(i => i.rarity),
        ...data.weapons.map(w => w.rarity),
        ...data.armours.map(a => a.rarity),
        ...data.shields.map(s => s.rarity),
        0
      ),
      maxDifficulty: Math.max(...data.enemies.map(e => e.difficulty), 0),
      maxEnemyHealth: Math.max(...data.enemies.map(e => e.health), 0),
      maxEnemyAttack: Math.max(...data.enemies.map(e => e.attack), 0),
      maxEnemyDefense: Math.max(...data.enemies.map(e => e.defense), 0),
    };
  };

  const maxValues = getMaxValues();

  const getStatColor = (statType: string) => {
    switch (statType) {
      case "health": return "#dc2626"; // red
      case "attack": return "#f59e0b"; // orange
      case "defense": return "#3b82f6"; // blue
      case "rarity": return "#a855f7"; // purple
      default: return "#6b7280"; // gray
    }
  };

  const getRarityLabel = (rarity: number) => {
    if (rarity >= 85) return "Legendary";
    if (rarity >= 65) return "Epic";
    if (rarity >= 45) return "Rare";
    if (rarity >= 25) return "Uncommon";
    return "Common";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 1000) return "Boss";
    if (difficulty >= 71) return "High";
    if (difficulty >= 31) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.title}>Game Wiki</h1>
        <div className={styles.loading}>Loading wiki data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.title}>Game Wiki</h1>
        <div className={styles.error}>Error: {error || "Failed to load data"}</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Game Wiki</h1>
      <p className={styles.subtitle}>Explore all items, equipment, and enemies in the game</p>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "items" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("items")}
        >
          Items ({data.items.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "weapons" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("weapons")}
        >
          Weapons ({data.weapons.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "armours" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("armours")}
        >
          Armours ({data.armours.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "shields" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("shields")}
        >
          Shields ({data.shields.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "enemies" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("enemies")}
        >
          Enemies ({data.enemies.length})
        </button>
      </div>

      {/* Items Grid */}
      {activeTab === "items" && (
        <div className={styles.grid}>
          {data.items.map((item) => {
            const maxStat = item.stat_modified === "health" ? maxValues.maxHealth :
                           item.stat_modified === "attack" ? maxValues.maxAttack :
                           maxValues.maxDefense;
            const statPercent = maxStat > 0 ? (item.stat_value / maxStat) * 100 : 0;
            const rarityPercent = maxValues.maxRarity > 0 ? (item.rarity / maxValues.maxRarity) * 100 : 0;

            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image
                    src={item.sprite_path || "/items/placeholder.png"}
                    alt={item.name}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                <h3 className={styles.cardName}>{item.name}</h3>
                {item.description && (
                  <p className={styles.cardDescription}>{item.description}</p>
                )}
                
                <div className={styles.stats}>
                  {/* Rarity */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Rarity: {getRarityLabel(item.rarity)}</span>
                    <span className={styles.statValue}>{item.rarity}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${rarityPercent}%`,
                        backgroundColor: getStatColor("rarity"),
                      }}
                    />
                  </div>

                  {/* Main Stat */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                      {item.stat_modified.charAt(0).toUpperCase() + item.stat_modified.slice(1)}
                    </span>
                    <span className={styles.statValue}>
                      {item.stat_value > 0 ? "+" : ""}{item.stat_value}
                    </span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${statPercent}%`,
                        backgroundColor: getStatColor(item.stat_modified),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weapons Grid */}
      {activeTab === "weapons" && (
        <div className={styles.grid}>
          {data.weapons.map((weapon) => {
            const attackPercent = maxValues.maxWeaponAttack > 0 ? (weapon.attack / maxValues.maxWeaponAttack) * 100 : 0;
            const rarityPercent = maxValues.maxRarity > 0 ? (weapon.rarity / maxValues.maxRarity) * 100 : 0;

            return (
              <div key={weapon.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image
                    src={weapon.sprite_path || "/items/weapons/default.png"}
                    alt={weapon.name}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                <h3 className={styles.cardName}>{weapon.name}</h3>
                {weapon.description && (
                  <p className={styles.cardDescription}>{weapon.description}</p>
                )}
                
                <div className={styles.stats}>
                  {/* Rarity */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Rarity: {getRarityLabel(weapon.rarity)}</span>
                    <span className={styles.statValue}>{weapon.rarity}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${rarityPercent}%`,
                        backgroundColor: getStatColor("rarity"),
                      }}
                    />
                  </div>

                  {/* Attack */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Attack</span>
                    <span className={styles.statValue}>+{weapon.attack}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${attackPercent}%`,
                        backgroundColor: getStatColor("attack"),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Armours Grid */}
      {activeTab === "armours" && (
        <div className={styles.grid}>
          {data.armours.map((armour) => {
            const healthPercent = maxValues.maxArmourHealth > 0 ? (armour.health / maxValues.maxArmourHealth) * 100 : 0;
            const rarityPercent = maxValues.maxRarity > 0 ? (armour.rarity / maxValues.maxRarity) * 100 : 0;

            return (
              <div key={armour.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image
                    src={armour.sprite_path || "/items/armour/default.png"}
                    alt={armour.name}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                <h3 className={styles.cardName}>{armour.name}</h3>
                {armour.description && (
                  <p className={styles.cardDescription}>{armour.description}</p>
                )}
                
                <div className={styles.stats}>
                  {/* Rarity */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Rarity: {getRarityLabel(armour.rarity)}</span>
                    <span className={styles.statValue}>{armour.rarity}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${rarityPercent}%`,
                        backgroundColor: getStatColor("rarity"),
                      }}
                    />
                  </div>

                  {/* Health */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Max HP</span>
                    <span className={styles.statValue}>+{armour.health}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${healthPercent}%`,
                        backgroundColor: getStatColor("health"),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shields Grid */}
      {activeTab === "shields" && (
        <div className={styles.grid}>
          {data.shields.map((shield) => {
            const defensePercent = maxValues.maxShieldDefense > 0 ? (shield.defense / maxValues.maxShieldDefense) * 100 : 0;
            const rarityPercent = maxValues.maxRarity > 0 ? (shield.rarity / maxValues.maxRarity) * 100 : 0;

            return (
              <div key={shield.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image
                    src={shield.sprite_path || "/items/shields/default.png"}
                    alt={shield.name}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                <h3 className={styles.cardName}>{shield.name}</h3>
                {shield.description && (
                  <p className={styles.cardDescription}>{shield.description}</p>
                )}
                
                <div className={styles.stats}>
                  {/* Rarity */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Rarity: {getRarityLabel(shield.rarity)}</span>
                    <span className={styles.statValue}>{shield.rarity}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${rarityPercent}%`,
                        backgroundColor: getStatColor("rarity"),
                      }}
                    />
                  </div>

                  {/* Defense */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Defense</span>
                    <span className={styles.statValue}>+{shield.defense}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${defensePercent}%`,
                        backgroundColor: getStatColor("defense"),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enemies Grid */}
      {activeTab === "enemies" && (
        <div className={styles.grid}>
          {data.enemies.map((enemy) => {
            const healthPercent = maxValues.maxEnemyHealth > 0 ? (enemy.health / maxValues.maxEnemyHealth) * 100 : 0;
            const attackPercent = maxValues.maxEnemyAttack > 0 ? (enemy.attack / maxValues.maxEnemyAttack) * 100 : 0;
            const defensePercent = maxValues.maxEnemyDefense > 0 ? (enemy.defense / maxValues.maxEnemyDefense) * 100 : 0;

            return (
              <div key={enemy.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image
                    src={enemy.sprite_path || "/characters/enemy/default.png"}
                    alt={enemy.name}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                <h3 className={styles.cardName}>{enemy.name}</h3>
                
                <div className={styles.stats}>
                  {/* Difficulty (no bar, just value) */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Difficulty: {getDifficultyLabel(enemy.difficulty)}</span>
                    <span className={styles.statValue}>{enemy.difficulty}</span>
                  </div>

                  {/* Health */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>HP</span>
                    <span className={styles.statValue}>{enemy.health}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${healthPercent}%`,
                        backgroundColor: getStatColor("health"),
                      }}
                    />
                  </div>

                  {/* Attack */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Attack</span>
                    <span className={styles.statValue}>{enemy.attack}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${attackPercent}%`,
                        backgroundColor: getStatColor("attack"),
                      }}
                    />
                  </div>

                  {/* Defense */}
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Defense</span>
                    <span className={styles.statValue}>{enemy.defense}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{
                        width: `${defensePercent}%`,
                        backgroundColor: getStatColor("defense"),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
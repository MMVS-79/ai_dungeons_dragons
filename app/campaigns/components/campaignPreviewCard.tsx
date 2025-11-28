import React from "react";
import Image from "next/image";
import styles from "./campaignPreviewCard.module.css";

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
    attack: number;
    spritePath?: string;
  };
  armour?: {
    id: number;
    name: string;
    health: number;
    spritePath?: string;
  };
  shield?: {
    id: number;
    name: string;
    defense: number;
    spritePath?: string;
  };
}

interface Character {
  id: number;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  spritePath?: string;
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  state: "active" | "completed" | "game_over";
  createdAt: string;
}

interface CampaignPreviewCardProps {
  campaign: Campaign;
  character: Character;
  equipment: Equipment;
  inventory: Item[];
  lastEventMessage: string | null;
  currentEventNumber: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function CampaignPreviewCard({
  campaign,
  character,
  equipment,
  inventory,
  lastEventMessage,
  currentEventNumber,
  onClick,
  onDelete,
}: CampaignPreviewCardProps) {
  // Calculate effective stats (base + equipment bonuses)
  const maxHp = character.maxHealth + (equipment.armour?.health || 0);
  const baseAttack = character.attack;
  const weaponBonus = equipment.weapon?.attack || 0;
  const baseDefense = character.defense;
  const shieldBonus = equipment.shield?.defense || 0;
  const hpPercentage = (character.currentHealth / maxHp) * 100;

  // Determine status badge
  const getStatusBadge = () => {
    if (campaign.state === "completed") {
      return <span className={styles.statusCompleted}>Completed</span>;
    }
    if (campaign.state === "game_over") {
      return <span className={styles.statusGameOver}>Game Over</span>;
    }
    return <span className={styles.statusActive}>Active</span>;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Create 10 inventory slots
  const MAX_INVENTORY_SLOTS = 10;
  const inventorySlots = Array(MAX_INVENTORY_SLOTS)
    .fill(null)
    .map((_, index) => inventory[index] || null);

  return (
    <div className={styles.card} onClick={onClick}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.campaignName}>{campaign.name}</h3>
          <span className={styles.turnNumber}>Turn {currentEventNumber}</span>
        </div>
        <div className={styles.headerRight}>
          {getStatusBadge()}
          <span className={styles.startDate}>
            Started {formatDate(campaign.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Character Preview */}
        <div className={styles.characterSection}>
          <div className={styles.characterImage}>
            <Image
              src={character.spritePath || "/characters/player/default.png"}
              alt={character.name}
              width={100}
              height={100}
              unoptimized
            />
          </div>
          <div className={styles.characterStats}>
            <h4 className={styles.characterName}>{character.name}</h4>

            {/* HP Bar */}
            <div className={styles.hpContainer}>
              <span className={styles.hpLabel}>
                HP: {character.currentHealth} / {maxHp}
              </span>
              <div className={styles.hpBar}>
                <div
                  className={styles.hpBarFill}
                  style={{
                    width: `${Math.min(hpPercentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Stats - Base + Equipment Bonus */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>⚔️</span>
                <span className={styles.statBase}>{baseAttack}</span>
                {weaponBonus > 0 && (
                  <span className={styles.statBonus}>+{weaponBonus}</span>
                )}
              </div>
              <div className={styles.stat}>
                <span>🛡️</span>
                <span className={styles.statBase}>{baseDefense}</span>
                {shieldBonus > 0 && (
                  <span className={styles.statBonus}>+{shieldBonus}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Last Event Message */}
        <div className={styles.lastEvent}>
          <div className={styles.lastEventLabel}>Last Event:</div>
          <div className={styles.lastEventMessage}>
            {lastEventMessage || "No events yet"}
          </div>
        </div>

        {/* Equipment & Inventory Preview */}
        <div className={styles.itemsSection}>
          {/* Equipment Row */}
          <div className={styles.equipmentRow}>
            <div className={styles.equipmentLabel}>Equipment:</div>
            <div className={styles.equipmentSlots}>
              <div
                className={`${styles.equipSlot} ${
                  equipment.weapon ? styles.filled : ""
                }`}
                title={equipment.weapon?.name || "No weapon"}
              >
                {equipment.weapon ? (
                  <Image
                    src={
                      equipment.weapon.spritePath ||
                      "/drops/placeholder.png"
                    }
                    alt={equipment.weapon.name}
                    width={30}
                    height={30}
                    unoptimized
                  />
                ) : (
                  <span className={styles.emptySlot}></span>
                )}
              </div>
              <div
                className={`${styles.equipSlot} ${
                  equipment.armour ? styles.filled : ""
                }`}
                title={equipment.armour?.name || "No armour"}
              >
                {equipment.armour ? (
                  <Image
                    src={
                      equipment.armour.spritePath || "/drops/placeholder.png"
                    }
                    alt={equipment.armour.name}
                    width={30}
                    height={30}
                    unoptimized
                  />
                ) : (
                  <span className={styles.emptySlot}></span>
                )}
              </div>
              <div
                className={`${styles.equipSlot} ${
                  equipment.shield ? styles.filled : ""
                }`}
                title={equipment.shield?.name || "No shield"}
              >
                {equipment.shield ? (
                  <Image
                    src={
                      equipment.shield.spritePath ||
                      "/drops/placeholder.png"
                    }
                    alt={equipment.shield.name}
                    width={30}
                    height={30}
                    unoptimized
                  />
                ) : (
                  <span className={styles.emptySlot}></span>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className={styles.inventoryRow}>
            <div className={styles.inventoryLabel}>Inventory:</div>
            <div className={styles.inventoryGrid}>
              {inventorySlots.map((item, index) => (
                <div
                  key={index}
                  className={`${styles.inventorySlot} ${
                    item ? styles.filled : ""
                  }`}
                  title={item?.name || "Empty"}
                >
                  {item ? (
                    <Image
                      src={item.spritePath || "/drops/placeholder.png"}
                      alt={item.name}
                      width={25}
                      height={25}
                      unoptimized
                    />
                  ) : (
                    <span className={styles.emptySlot}></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Delete Button */}
      <div className={styles.footer}>
        <button
          className={styles.deleteButton}
          onClick={onDelete}
          title="Delete campaign"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

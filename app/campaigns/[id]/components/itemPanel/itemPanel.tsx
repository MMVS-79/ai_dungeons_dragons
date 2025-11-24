import React, { useState } from "react";
import Image from "next/image";
import styles from "./itemPanel.module.css";
import type { Weapon, Armour, Shield } from "../../page";

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

interface ItemPanelProps {
  inventory: Item[];
  equipped: Equipment;
  onUseItem: (item: Item) => void;
  inCombat: boolean;
}

const MAX_INVENTORY_SLOTS = 10;

export default function ItemPanel({
  inventory,
  equipped,
  onUseItem,
  inCombat,
}: ItemPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    item: Equipment["weapon"] | Equipment["armour"] | Equipment["shield"];
    slot: string;
  } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<{
    item: Equipment["weapon"] | Equipment["armour"] | Equipment["shield"];
    slot: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const inventorySlots = Array(MAX_INVENTORY_SLOTS)
    .fill(null)
    .map((_, index) => inventory[index] || null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const getItemTooltipText = (item: Item) => {
    const statName =
      item.statModified === "health"
        ? "HP"
        : item.statModified === "attack"
          ? "Attack"
          : "Defense";
    return `${item.name}\n${item.statValue > 0 ? "+" : ""}${
      item.statValue
    } ${statName}`;
  };

  const getEquipmentTooltipText = (
    item: Weapon | Armour | Shield,
    slot: string,
  ) => {
    if (slot === "weapon" && "attack" in item) {
      return `${item.name}\n+${item.attack} Attack`;
    } else if (slot === "armour" && "health" in item) {
      return `${item.name}\n+${item.health} Max HP`;
    } else if (slot === "shield" && "defense" in item) {
      return `${item.name}\n+${item.defense} Defense`;
    }
    return item.name;
  };

  return (
    <>
      {/* Compact Panel */}
      <div
        className={styles.panel}
        onClick={() => setIsExpanded(true)}
        style={{ cursor: "pointer" }}
      >
        <h2 className={styles.header}>Inventory (Click to Open)</h2>

        <div className={styles.section}>
          <h3 className={styles.sectionHeader}>Equipped</h3>
          <div className={styles.equippedGrid}>
            {(["weapon", "armour", "shield"] as const).map((slot) => {
              const item = equipped[slot];
              return (
                <div key={slot} className={styles.equippedSlot}>
                  <div className={styles.slotLabel}>{slot}</div>
                  <div className={styles.slotImage}>
                    {item?.spritePath ? (
                      <Image
                        src={item.spritePath}
                        alt={item.name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionHeader}>
            Items ({inventory.length}/{MAX_INVENTORY_SLOTS})
          </h3>
          <div className={styles.itemsGrid}>
            {inventorySlots.map((item, index) => (
              <div key={index} className={styles.itemSlotPreview}>
                {item?.spritePath && (
                  <Image
                    src={item.spritePath}
                    alt={item.name}
                    width={40}
                    height={40}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className={styles.expandedModal}
          onClick={() => setIsExpanded(false)}
        >
          <div
            className={styles.expandedContent}
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
          >
            <div className={styles.expandedHeader}>
              <h2 className={styles.expandedTitle}>Inventory</h2>
              <button
                onClick={() => setIsExpanded(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            {/* Equipped Section */}
            <div className={styles.expandedSection}>
              <h3 className={styles.expandedSectionHeader}>⚔️ Equipped</h3>
              <div className={styles.expandedEquippedGrid}>
                {(["weapon", "armour", "shield"] as const).map((slot) => {
                  const item = equipped[slot];
                  return (
                    <div
                      key={slot}
                      className={`${styles.expandedEquippedSlot} ${
                        item ? styles.hasItem : ""
                      }`}
                      onClick={() =>
                        item && setSelectedEquipment({ item, slot })
                      }
                      onMouseEnter={() =>
                        item && setHoveredEquipment({ item, slot })
                      }
                      onMouseLeave={() => setHoveredEquipment(null)}
                    >
                      <div className={styles.slotLabel}>
                        {slot.charAt(0).toUpperCase() + slot.slice(1)}
                      </div>
                      <div className={styles.expandedSlotImage}>
                        {item?.spritePath ? (
                          <Image
                            src={item.spritePath}
                            alt={item.name}
                            width={60}
                            height={60}
                          />
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items Section */}
            <div className={styles.expandedSection}>
              <h3 className={styles.expandedSectionHeader}>
                🧪 Items ({inventory.length}/{MAX_INVENTORY_SLOTS})
              </h3>
              <div className={styles.expandedItemsGrid}>
                {inventorySlots.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.expandedItemSlot} ${
                      item ? styles.hasItem : ""
                    }`}
                    onClick={() => item && setSelectedItem(item)}
                    onMouseEnter={() => item && setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {item?.spritePath && (
                      <Image
                        src={item.spritePath}
                        alt={item.name}
                        width={50}
                        height={50}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tooltip for Items */}
            {hoveredItem && (
              <div
                className={styles.tooltip}
                style={{
                  left: `${tooltipPosition.x + 10}px`,
                  top: `${tooltipPosition.y + 10}px`,
                }}
              >
                {getItemTooltipText(hoveredItem)}
              </div>
            )}

            {/* Tooltip for Equipment */}
            {hoveredEquipment && hoveredEquipment.item && (
              <div
                className={styles.tooltip}
                style={{
                  left: `${tooltipPosition.x + 10}px`,
                  top: `${tooltipPosition.y + 10}px`,
                }}
              >
                {getEquipmentTooltipText(
                  hoveredEquipment.item,
                  hoveredEquipment.slot,
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className={styles.detailModal}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={styles.detailContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailImage}>
                <Image
                  src={selectedItem.spritePath || "/items/placeholder.png"}
                  alt={selectedItem.name}
                  width={100}
                  height={100}
                  unoptimized
                />
              </div>
              <h3 className={styles.detailTitle}>{selectedItem.name}</h3>
              <p className={styles.detailDescription}>
                {selectedItem.description}
              </p>
              <p className={styles.detailStats}>
                {selectedItem.statModified === "health" && "❤️"}
                {selectedItem.statModified === "attack" && "⚔️"}
                {selectedItem.statModified === "defense" && "🛡️"}{" "}
                {selectedItem.statValue > 0 ? "+" : ""}
                {selectedItem.statValue} {selectedItem.statModified}
              </p>
            </div>

            <div className={styles.detailActions}>
              {inCombat && (
                <button
                  onClick={() => {
                    onUseItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  className={`${styles.actionButton} ${styles.useButton}`}
                >
                  Use
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className={`${styles.actionButton} ${styles.closeButtonAction}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div
          className={styles.detailModal}
          onClick={() => setSelectedEquipment(null)}
        >
          <div
            className={styles.detailContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailImage}>
                <Image
                  src={
                    selectedEquipment.item?.spritePath ||
                    "/items/placeholder.png"
                  }
                  alt={selectedEquipment.item?.name || "Equipment"}
                  width={100}
                  height={100}
                  unoptimized
                />
              </div>
              <h3 className={styles.detailTitle}>
                {selectedEquipment.item?.name}
              </h3>
              <p className={styles.detailDescription}>
                {selectedEquipment.item?.description}
              </p>
              {selectedEquipment.slot === "weapon" &&
                selectedEquipment.item &&
                "attack" in selectedEquipment.item && (
                  <p className={styles.detailStats}>
                    ⚔️ +{selectedEquipment.item.attack} Attack
                  </p>
                )}
              {selectedEquipment.slot === "armour" &&
                selectedEquipment.item &&
                "health" in selectedEquipment.item && (
                  <p className={styles.detailStats}>
                    ❤️ +{selectedEquipment.item.health} Max HP
                  </p>
                )}
              {selectedEquipment.slot === "shield" &&
                selectedEquipment.item &&
                "defense" in selectedEquipment.item && (
                  <p className={styles.detailStats}>
                    🛡️ +{selectedEquipment.item.defense} Defense
                  </p>
                )}
            </div>

            <div className={styles.detailActions}>
              <button
                onClick={() => setSelectedEquipment(null)}
                className={`${styles.actionButton} ${styles.closeButtonAction}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

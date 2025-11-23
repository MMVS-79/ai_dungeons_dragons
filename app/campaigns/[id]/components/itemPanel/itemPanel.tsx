import React, { useState } from "react";
import Image from "next/image";
import styles from "./itemPanel.module.css";

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

interface ItemPanelProps {
  inventory: Item[];
  equipped: {
    weapon?: Item;
    armor?: Item;
    shield?: Item;
  };
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item, slot: string) => void;
  onDropEquipment: (slot: string) => void;
  inCombat: boolean;
}

const MAX_INVENTORY_SLOTS = 10;

export default function ItemPanel({
  inventory,
  equipped,
  onUseItem,
  onEquipItem,
  onDropEquipment,
  inCombat,
}: ItemPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    item: Item;
    slot: string;
  } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<{
    item: Item;
    slot: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Create array of 10 slots, filled with items or null
  const inventorySlots = Array(MAX_INVENTORY_SLOTS)
    .fill(null)
    .map((_, index) => inventory[index] || null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const getTooltipText = (item: Item) => {
    if (item.type === "potion") {
      return `${item.name}\nHeals ${item.healAmount} HP`;
    } else if (item.type === "weapon") {
      return `${item.name}\n+${item.attack} Attack`;
    } else if (item.type === "armor") {
      return `${item.name}\n+${item.hpBonus} Max HP`; // Changed from defense to hpBonus
    } else if (item.type === "shield") {
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
            {(["weapon", "armor", "shield"] as const).map((slot) => (
              <div key={slot} className={styles.equippedSlot}>
                <div className={styles.slotLabel}>{slot}</div>
                <div className={styles.slotImage}>
                  {equipped[slot]?.image ? (
                    <Image
                      src={equipped[slot]!.image}
                      alt={equipped[slot]!.name}
                      width={40}
                      height={40}
                    />
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionHeader}>
            Items ({inventory.length}/{MAX_INVENTORY_SLOTS})
          </h3>
          <div className={styles.itemsGrid}>
            {inventorySlots.map((item, index) => (
              <div key={index} className={styles.itemSlotPreview}>
                {item?.image && (
                  <Image
                    src={item.image}
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
                {(["weapon", "armor", "shield"] as const).map((slot) => (
                  <div
                    key={slot}
                    className={`${styles.expandedEquippedSlot} ${equipped[slot] ? styles.hasItem : ""}`}
                    onClick={() =>
                      equipped[slot] &&
                      setSelectedEquipment({ item: equipped[slot]!, slot })
                    }
                    onMouseEnter={() =>
                      equipped[slot] &&
                      setHoveredEquipment({ item: equipped[slot]!, slot })
                    }
                    onMouseLeave={() => setHoveredEquipment(null)}
                  >
                    <div className={styles.slotLabel}>
                      {slot.charAt(0).toUpperCase() + slot.slice(1)}
                    </div>
                    <div className={styles.expandedSlotImage}>
                      {equipped[slot]?.image ? (
                        <Image
                          src={equipped[slot]!.image}
                          alt={equipped[slot]!.name}
                          width={60}
                          height={60}
                        />
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Section */}
            <div className={styles.expandedSection}>
              <h3 className={styles.expandedSectionHeader}>
                📦 Items ({inventory.length}/{MAX_INVENTORY_SLOTS})
              </h3>
              <div className={styles.expandedItemsGrid}>
                {inventorySlots.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.expandedItemSlot} ${item ? styles.hasItem : ""}`}
                    onClick={() => item && setSelectedItem(item)}
                    onMouseEnter={() => item && setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {item?.image && (
                      <Image
                        src={item.image}
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
                {getTooltipText(hoveredItem)}
              </div>
            )}

            {/* Tooltip for Equipment */}
            {hoveredEquipment && (
              <div
                className={styles.tooltip}
                style={{
                  left: `${tooltipPosition.x + 10}px`,
                  top: `${tooltipPosition.y + 10}px`,
                }}
              >
                {getTooltipText(hoveredEquipment.item)}
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
                  src={selectedItem.image}
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
              {selectedItem.type === "potion" && (
                <p className={styles.detailStats}>
                  Heals: {selectedItem.healAmount} HP
                </p>
              )}
              {selectedItem.type === "weapon" && (
                <p className={styles.detailStats}>
                  Attack: +{selectedItem.attack}
                </p>
              )}
              {selectedItem.type === "armor" && (
                <p className={styles.detailStats}>
                  Max HP: +{selectedItem.hpBonus}
                </p>
              )}
              {selectedItem.type === "shield" && (
                <p className={styles.detailStats}>
                  Defense: +{selectedItem.defense}
                </p>
              )}
            </div>

            <div className={styles.detailActions}>
              {selectedItem.type === "potion" && inCombat && (
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
              {selectedItem.type !== "potion" && !inCombat && (
                <button
                  onClick={() => {
                    onEquipItem(selectedItem, selectedItem.type);
                    setSelectedItem(null);
                  }}
                  className={`${styles.actionButton} ${styles.equipButton}`}
                >
                  Equip
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
                  src={selectedEquipment.item.image}
                  alt={selectedEquipment.item.name}
                  width={100}
                  height={100}
                  unoptimized
                />
              </div>
              <h3 className={styles.detailTitle}>
                {selectedEquipment.item.name}
              </h3>
              <p className={styles.detailDescription}>
                {selectedEquipment.item.description}
              </p>
              {selectedEquipment.item.type === "weapon" && (
                <p className={styles.detailStats}>
                  Attack: +{selectedEquipment.item.attack}
                </p>
              )}
              {selectedEquipment.item.type === "armor" && (
                <p className={styles.detailStats}>
                  Max HP: +{selectedEquipment.item.hpBonus}
                </p>
              )}
              {selectedEquipment.item.type === "shield" && (
                <p className={styles.detailStats}>
                  Defense: +{selectedEquipment.item.defense}
                </p>
              )}
            </div>

            <div className={styles.detailActions}>
              <button
                onClick={() => {
                  onDropEquipment(selectedEquipment.slot);
                  setSelectedEquipment(null);
                }}
                className={`${styles.actionButton} ${styles.dropButton}`}
              >
                Unequip
              </button>
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

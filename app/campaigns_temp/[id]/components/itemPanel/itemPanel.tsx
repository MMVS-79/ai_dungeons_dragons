"use client";

import React from "react";
import styles from "./itemPanel.module.css";

export default function ItemPanel() {
  // number of slots
  const equipmentSlots = 3;
  const consumableSlots = 10;

  // helper to render empty slots
  const renderSlots = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className={styles.slot}></div>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.Items}>
        <p className={styles.inventoryTitle}>Inventory</p>

        <p className={styles.equipmentTitle}>Equipment</p>
        <div className={styles.equipmentContainer}>{renderSlots(equipmentSlots)}</div>

        <p className={styles.ConsumablesTitle}>Consumables</p>
        <div className={styles.consumableContainer}>{renderSlots(consumableSlots)}</div>
      </div>
    </div>
  );
}

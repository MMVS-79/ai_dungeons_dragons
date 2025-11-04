import React from 'react';
import Image from 'next/image';
import styles from './eventPanel.module.css';

interface EnemyState {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  image: string;
}

interface GameEvent {
  type: 'combat' | 'item' | 'story' | null;
  data?: any;
}

interface EventPanelProps {
  currentEvent: GameEvent;
  enemyState: EnemyState | null;
}

export default function EventPanel({ 
  currentEvent, 
  enemyState 
}: EventPanelProps) {
  // Don't show panel if no event
  if (currentEvent.type === null || currentEvent.type === 'story') {
    return (
      <div className={styles.panel}>
        <h2 className={styles.header}>📜 Current Status</h2>
        <div className={styles.emptyState}>
          <p>Exploring the dungeon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {currentEvent.type === 'combat' && enemyState && enemyState.hp > 0 && (
        <>
          <h2 className={styles.header}>💀 Enemy</h2>
          <h3 className={styles.eventHeader}>{enemyState.name}</h3>
          <div className={styles.enemyImage}>
            <Image 
              src={enemyState.image} 
              alt={enemyState.name}
              width={512}
              height={512}
            />
          </div>
          
          <div className={styles.statsContainer}>
            <div className={styles.statRow}>
              <span>HP:</span>
              <span>{enemyState.hp} / {enemyState.maxHp}</span>
            </div>
            <div className={styles.hpBar}>
              <div 
                className={styles.hpBarFill}
                style={{ width: `${(enemyState.hp / enemyState.maxHp) * 100}%` }}
              />
            </div>
            
            <div className={styles.statRow}>
              <span>⚔️ Attack: {enemyState.attack}</span>
              <span>🛡️ Defense: {enemyState.defense}</span>
            </div>
          </div>
        </>
      )}

      {currentEvent.type === 'item' && currentEvent.data && (
        <>
          <h2 className={styles.header}>✨ Item Found!</h2>
          <div className={styles.itemFound}>
            <div className={styles.itemImage}>
              <Image 
                src={currentEvent.data.image} 
                alt={currentEvent.data.name}
                width={512}
                height={512}
              />
            </div>
            <div className={styles.itemName}>{currentEvent.data.name}</div>
            <div className={styles.itemDescription}>{currentEvent.data.description}</div>
          </div>
        </>
      )}

      {currentEvent.type === 'equipment' && currentEvent.data && (
        <>
          <h2 className={styles.header}>⚔️ Equipment Found!</h2>
          <div className={styles.itemFound}>
            <div className={styles.itemImage}>
              <Image 
                src={currentEvent.data.image} 
                alt={currentEvent.data.name}
                width={512}
                height={512}
              />
            </div>
            <div className={styles.itemName}>{currentEvent.data.name}</div>
            <div className={styles.itemDescription}>{currentEvent.data.description}</div>
          </div>
        </>
      )}
    </div>
  );
}
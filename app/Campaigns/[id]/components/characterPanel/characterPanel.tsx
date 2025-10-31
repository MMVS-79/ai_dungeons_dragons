import React from 'react';
import Image from 'next/image';
import styles from './characterPanel.module.css';

interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'potion';
  image: string;
  attack?: number;
  defense?: number;
  hpBonus?: number;
  healAmount?: number;
  description: string;
}

interface PlayerState {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  baseAttack: number;
  baseDefense: number;
  inventory: Item[];
  equipped: {
    weapon?: Item;
    armor?: Item;
    shield?: Item;
  };
}

interface CharacterPanelProps {
  playerState: PlayerState;
  playerAttack: number;
  playerDefense: number;
  playerMaxHp: number;  // Added this prop
}

export default function CharacterPanel({ 
  playerState,
  playerAttack,
  playerDefense,
  playerMaxHp  // Added this parameter
}: CharacterPanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>⚔️ Your Character</h2>
      
      <div className={styles.characterInfo}>
        <div className={styles.characterImage}>
          <Image 
            src={playerState.image} 
            alt={playerState.name}
            width={80}
            height={80}
          />
        </div>
        <h3 className={styles.characterName}>{playerState.name}</h3>
      </div>
      
      <div className={styles.statsContainer}>
        <div className={styles.statRow}>
          <span>HP:</span>
          <span>{playerState.hp} / {playerMaxHp}</span>
        </div>
        <div className={styles.hpBar}>
          <div 
            className={styles.hpBarFill}
            style={{ width: `${(playerState.hp / playerMaxHp) * 100}%` }}
          />
        </div>
        
        <div className={styles.statRow}>
          <span>⚔️ Attack: {playerAttack}</span>
          <span>🛡️ Defense: {playerDefense}</span>
        </div>
      </div>
    </div>
  );
}
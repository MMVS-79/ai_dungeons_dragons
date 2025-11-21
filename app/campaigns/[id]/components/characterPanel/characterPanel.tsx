import React from 'react';
import Image from 'next/image';
import styles from './characterPanel.module.css';

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

interface PlayerState {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  equipment: Equipment;
}

interface CharacterPanelProps {
  playerState: PlayerState;
  playerAttack: number;
  playerDefense: number;
  playerMaxHp: number;
  temporaryBuffs?: { attack: number; defense: number };
}

export default function CharacterPanel({ 
  playerState, 
  playerAttack, 
  playerDefense, 
  playerMaxHp,
  temporaryBuffs = { attack: 0, defense: 0 }
}: CharacterPanelProps) {
  const hpPercentage = (playerState.hp / playerMaxHp) * 100;

  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>⚔️ Your Character</h2>
      
      <div className={styles.characterInfo}>
        <div className={styles.characterImage}>
          <Image 
            src={playerState.image} 
            alt={playerState.name}
            width={220}
            height={220}
            unoptimized
          />
        </div>
        <h3 className={styles.characterName}>{playerState.name}</h3>
      </div>
      
      <div className={styles.statsContainer}>
        {/* HP Bar (No calculation shown) */}
        <div className={styles.statRow}>
          <span>HP:</span>
          <span>{playerState.hp} / {playerMaxHp}</span>
        </div>
        <div className={styles.hpBar}>
          <div 
            className={styles.hpBarFill}
            style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
          />
        </div>

        {/* Attack Stat (Base + Weapon + Buff only, no sum) */}
        <div className={styles.statRow}>
          <span className={styles.statLabel}>⚔️ Attack:</span>
          <span className={styles.statValue}>
            {playerState.attack}
            {playerState.equipment.weapon && (
              <span className={styles.equipmentBonus}>
                {' + '}{playerState.equipment.weapon.attack}
              </span>
            )}
            {temporaryBuffs.attack !== 0 && (
              <span className={styles.tempBuff}>
                {' + '}{temporaryBuffs.attack}
              </span>
            )}
          </span>
        </div>

        {/* Defense Stat (Base + Shield + Buff only, no sum) */}
        <div className={styles.statRow}>
          <span className={styles.statLabel}>🛡️ Defense:</span>
          <span className={styles.statValue}>
            {playerState.defense}
            {playerState.equipment.shield && (
              <span className={styles.equipmentBonus}>
                {' + '}{playerState.equipment.shield.defense}
              </span>
            )}
            {temporaryBuffs.defense !== 0 && (
              <span className={styles.tempBuff}>
                {' + '}{temporaryBuffs.defense}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
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

interface Item {
  id: number;
  name: string;
  rarity: number;
  statModified: "health" | "attack" | "defense";
  statValue: number;
  description?: string;
  spritePath?: string;
}

export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  attack: number;
  description?: string;
  spritePath?: string;
}

export interface Armour {
  id: number;
  name: string;
  rarity: number;
  health: number;
  description?: string;
  spritePath?: string;
}

export interface Shield {
  id: number;
  name: string;
  rarity: number;
  defense: number;
  description?: string;
  spritePath?: string;
}

interface EventPanelProps {
  enemy: EnemyState | null;
  itemFound?: Weapon | Armour | Shield | Item | null;
}

// Helper function to normalize image path
const normalizeImagePath = (path?: string): string => {
  if (!path) return '/items/placeholder.png';
  
  // Add .png extension if missing
  const normalizedPath = path.endsWith('.png') ? path : `${path}.png`;
  
  return normalizedPath;
};

// Helper function to handle image load errors
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  target.src = '/items/placeholder.png';
};

export default function EventPanel({ 
  enemy,
  itemFound
}: EventPanelProps) {
  // Show enemy if in combat
  if (enemy && enemy.hp > 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.header}>💀 Enemy</h2>
        <h3 className={styles.eventHeader}>{enemy.name}</h3>
        <div className={styles.enemyImage}>
          <Image 
            src={enemy.image} 
            alt={enemy.name}
            width={220}
            height={220}
            unoptimized
            onError={handleImageError}
          />
        </div>
        
        <div className={styles.statsContainer}>
          <div className={styles.statRow}>
            <span>HP:</span>
            <span>{enemy.hp} / {enemy.maxHp}</span>
          </div>
          <div className={styles.hpBar}>
            <div 
              className={styles.hpBarFill}
              style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
            />
          </div>
          
          <div className={styles.statRow}>
            <span>⚔️ Attack: {enemy.attack}</span>
            <span>🛡️ Defense: {enemy.defense}</span>
          </div>
        </div>
      </div>
    );
  }

  // Show item/equipment if found
  if (itemFound) {
    const isEquipment = 'attack' in itemFound || 'defense' in itemFound || 
                        ('health' in itemFound && !('statModified' in itemFound));
    
    const imagePath = normalizeImagePath(itemFound.spritePath);
    
    return (
      <div className={styles.panel}>
        <h2 className={styles.header}>{isEquipment ? '⚔️ Equipment Found!' : '🧪 Item Found!'}</h2>
        <div className={styles.itemFound}>
          {/* Show actual item/equipment image with error handling */}
          <div className={styles.itemImage}>
            <Image 
              src={imagePath}
              alt={itemFound.name}
              width={180}
              height={180}
              unoptimized
              onError={handleImageError}
            />
          </div>
          
          <div className={styles.itemName}>{itemFound.name}</div>
          
          {itemFound.description && (
            <div className={styles.itemDescription}>{itemFound.description}</div>
          )}
          
          {/* Show stats */}
          <div className={styles.itemStats}>
            {isEquipment ? (
              <>
                {'attack' in itemFound && itemFound.attack && (
                  <div className={styles.statBadge}>⚔️ +{itemFound.attack} Attack</div>
                )}
                {'defense' in itemFound && itemFound.defense && (
                  <div className={styles.statBadge}>🛡️ +{itemFound.defense} Defense</div>
                )}
                {'health' in itemFound && itemFound.health && (
                  <div className={styles.statBadge}>❤️ +{itemFound.health} Max HP</div>
                )}
              </>
            ) : (
              <>
                {('statModified' in itemFound) && (
                  <div className={styles.statBadge}>
                    {itemFound.statModified === 'health' && '❤️'}
                    {itemFound.statModified === 'attack' && '⚔️'}
                    {itemFound.statModified === 'defense' && '🛡️'}
                    {' '}
                    {itemFound.statValue > 0 ? '+' : ''}{itemFound.statValue} {itemFound.statModified}
                    {itemFound.statModified === 'health' && ' HP'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state (exploring)
  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>📜 Current Status</h2>
      <div className={styles.emptyState}>
        <p>Exploring the dungeon...</p>
      </div>
    </div>
  );
}
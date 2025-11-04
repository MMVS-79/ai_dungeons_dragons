/**
 * Game Types
 * ----------
 * Shared TypeScript interfaces used by the GameEngine and related services.
 * Ensures consistent data structures between Backend, LLMService, and WebClient.
 * 
 * Includes for example:
 * - PlayerState: { hp, maxHp, atk, def, inventory, equipped }
 * - EnemyState:  { name, hp, atk, def, sprite }
 * - EventType:   'Environmental' | 'Descriptive' | 'Item' | 'Combat'
 * - GameEvent:   { id, description, type, effects }
 * - ActionData:  { eventId, playerChoice, optional itemId }
 * - CombatResult: { playerHp, enemyHp, outcome }
 * 
 * These types directly support:
 *  - gameEngine.service.ts
 *  - llm.service.ts
 *  - DB schema (campaigns, characters, enemies, events)
 *  - Frontend panels (eventPanel.tsx, characterPanel.tsx)
 */

// Example interface types pulled from frontend test

// interface Item {
//   id: string;
//   name: string;
//   type: "weapon" | "armor" | "shield" | "potion";
//   image: string;
//   attack?: number;
//   defense?: number;
//   hpBonus?: number;
//   healAmount?: number;
//   description: string;
// }

// interface PlayerState {
//   name: string;
//   image: string;
//   hp: number;
//   maxHp: number;
//   baseAttack: number;
//   baseDefense: number;
//   inventory: Item[];
//   equipped: {
//     weapon?: Item;
//     armor?: Item;
//     shield?: Item;
//   };
// }

// interface EnemyState {
//   name: string;
//   image: string;
//   hp: number;
//   maxHp: number;
//   attack: number;
//   defense: number;
// }

// interface GameEvent {
//   type: "combat" | "item" | "story" | "equipment" | null;
//   data?: any;
// }

// interface Message {
//   id: string;
//   text: string;
//   choices?: string[];
// }
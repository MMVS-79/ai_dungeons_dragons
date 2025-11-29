# LLM Service Integration Guide for Game Engine Design

Welcome! This guide is everything you need to know about the LLM service as you design your game engine. Think of this as the **contract** between your game engine and the LLM service—what you need to send in, what you'll get back, and how to integrate it.

---

## The Big Picture

Here's how your game engine will interact with the LLM service:

```
Your Game Engine
       │
       ├─ Fetch character stats (HP, ATK, DEF)
       ├─ Fetch enemy stats (HP, ATK, DEF)
       ├─ Fetch last 5-10 events from database
       │
       ▼
Create LLMGameContext object
       │
       ▼
Call: await llm.generateEvent(context)
       │
       ▼ (LLM Service handles all the AI complexity)
       │
Get back: LLMEvent object
       │
       ├─ Event description (narrative text)
       ├─ Event type (one of 5 types)
       ├─ Stat effects to apply (HP, ATK, DEF changes)
       │
       ▼
Your Game Engine
       ├─ Save event to database
       ├─ Apply stat changes to character
       ├─ Display to player
       └─ Repeat for next event
```

**Your job**: Build steps 1, 3, and the second "Your Game Engine" block. The LLM service handles step 2 and returns the event.

---

## What You Send: LLMGameContext Input

When you call `generateEvent()`, you need to send this structure:

```typescript
interface LLMGameContext {
  character: {
    name: string;         // Player character name
    health: number;       // Current HP (full, not delta)
    attack: number;       // Current attack stat
    defense: number;      // Current defense stat
  };
  enemy: {
    name: string;         // Enemy/boss name
    health: number;       // Enemy's current HP
    attack: number;       // Enemy's attack stat
    defense: number;      // Enemy's defense stat
  };
  recentEvents: EventHistoryEntry[];  // Previous events with full context
  scenario?: string;                  // Optional: customize location
  trigger?: string;                   // Optional: customize event trigger
}

// The recentEvents array contains:
interface EventHistoryEntry {
  description: string;    // The event text that was generated
  type: EventType;        // Event type (see below)
  effects: {
    health: number;       // HP change that was applied
    attack: number;       // Attack change that was applied
    defense: number;      // Defense change that was applied
  };
}
```

### Key Points When Building Your Engine

1. **Send current stats, not deltas**: If character HP was 100 and took 5 damage, send `health: 95`, not `health: -5`
2. **Include stat effects in history**: When you save an event to the database, store the `type` and `effects` alongside it. When you retrieve events later, pass them back exactly as they were generated.
3. **5-10 events for context**: Include last 5-10 events in `recentEvents`. More context = better narrative continuity but slower responses (1-3 seconds becomes 3-5 seconds).
4. **Optional steering**: If you want to influence the type of event (e.g., "make this a boss encounter"), use `scenario` and `trigger` fields.

### Example: What Your Code Will Look Like

```typescript
// Inside your game engine service
async generateNextEvent(campaignId: number) {
  // 1. Fetch from database
  const character = await db.getCharacter(campaignId);
  const enemy = await db.getEnemy(campaignId); // or boss for this encounter
  const recentEvents = await db.getEventHistory(campaignId, 5);

  // 2. Build context for LLM
  const context: LLMGameContext = {
    character: {
      name: character.name,
      health: character.currentHealth,      // Current value!
      attack: character.currentAttack,
      defense: character.currentDefense
    },
    enemy: {
      name: enemy.name,
      health: enemy.currentHealth,
      attack: enemy.currentAttack,
      defense: enemy.currentDefense
    },
    recentEvents: recentEvents,  // Full history with effects
    // Optional: guide the narrative
    scenario: enemy.encounterType === 'BOSS' ? 'dragon throne room' : undefined
  };

  // 3. Call LLM service (this is all the AI complexity you don't have to worry about)
  const event = await llmService.generateEvent(context);
  
  // 4. Your job takes over from here...
  return event;
}
```

---

## What You Get Back: LLMEvent Output

The LLM service will return this:

```typescript
interface LLMEvent {
  event: string;              // Vivid narrative (1-2 sentences)
  type: EventType;            // One of 5 event types
  effects: {
    health: number;           // Range: -10 to +10 (damage/healing)
    attack: number;           // Range: -5 to +5 (weapon bonuses/nerfs)
    defense: number;          // Range: -5 to +5 (armour changes)
  };
}

type EventType = 
  | "NARRATIVE"               // Story-only (effects: 0, 0, 0)
  | "COMBAT_ACTION"           // Combat scenarios
  | "ENVIRONMENTAL"           // Hazards or benefits
  | "ITEM_DROP"               // Items found/lost
  | "STAT_MODIFIER"           // Direct stat changes
```

### Real-World Examples

```typescript
// Example 1: NARRATIVE event (no impact)
{
  event: "Ancient runes glow faintly on the wall, their meaning lost to time.",
  type: "NARRATIVE",
  effects: { health: 0, attack: 0, defense: 0 }
}

// Example 2: Combat scenario
{
  event: "A goblin steps out from behind the pillar, sword raised!",
  type: "COMBAT_ACTION",
  effects: { health: -3, attack: -1, defense: 0 }  // Take damage, lose some attack power
}

// Example 3: Environmental hazard
{
  event: "Poisonous gas fills the chamber, burning your lungs.",
  type: "ENVIRONMENTAL",
  effects: { health: -8, attack: -2, defense: 0 }
}

// Example 4: Item drop
{
  event: "You spot a shimmering health potion on a dusty shelf!",
  type: "ITEM_DROP",
  effects: { health: 5, attack: 0, defense: 0 }  // Healing
}

// Example 5: Stat modifier
{
  event: "A faint blue aura surrounds you, strengthening your resolve.",
  type: "STAT_MODIFIER",
  effects: { health: 0, attack: 2, defense: 2 }  // Buff
}
```

---

## Understanding Event Types

When building your game engine, you'll need to handle these 5 event types:

### 1. **NARRATIVE** - Pure story, no mechanical impact

- Effects are always `{0, 0, 0}`
- These are flavor text: atmosphere, descriptions, lore
- You should display these but don't need special logic
- Example: "The cave echoes with the sound of water dripping..."

### 2. **COMBAT_ACTION** - Active combat

- Usually has negative effects (enemy attacks you)
- Could represent environmental combat hazards
- Logic: Apply the effects, maybe trigger combat animations
- Example: "The dragon lunges forward, claws extended!"
- Effects: `{-7, 0, -3}` (takes damage, loses defense)

### 3. **ENVIRONMENTAL** - Surroundings affect the player

- Can have positive OR negative effects
- Hazards: fire, poison, traps, ice, etc.
- Benefits: blessed ground, magical wards, safe zones
- Logic: Apply effects, maybe show environmental animation
- Example: "Blessing fills the sacred chamber" → `{10, 0, 0}`

### 4. **ITEM_DROP** - Finding or losing items

- Usually positive (treasures found)
- Could be negative (gear breaks/lost)
- Logic: Treat as inventory changes or direct stat boosts
- Example: "A golden sword catches your eye!"
- Effects: `{0, 5, 0}` (attack boost)

### 5. **STAT_MODIFIER** - Direct buffs or debuffs

- Must have at least one non-zero effect
- Represents magical effects, curses, blessings
- Logic: These are temporary or permanent stat changes
- Example: "A curse saps your strength"
- Effects: `{0, -4, 0}` (attack penalty)

---

## Your Integration Workflow: Step by Step

Here's exactly what your game engine code needs to do:

```typescript
import { LLMService } from "@/lib/services/llm.service";
import type { LLMGameContext, LLMEvent } from "@/lib/types/llm.types";

class GameEngineService {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  async processEvent(campaignId: number): Promise<void> {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: Fetch current game state from your database
    // ═══════════════════════════════════════════════════════════
    const character = await this.db.getCharacter(campaignId);
    const enemy = await this.db.getCurrentEnemy(campaignId);
    const recentEvents = await this.db.getRecentEvents(campaignId, 5);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Build the context object
    // ═══════════════════════════════════════════════════════════
    const context: LLMGameContext = {
      character: {
        name: character.name,
        health: character.health,      // CURRENT values!
        attack: character.attack,
        defense: character.defense
      },
      enemy: {
        name: enemy.name,
        health: enemy.health,
        attack: enemy.attack,
        defense: enemy.defense
      },
      recentEvents: recentEvents  // Full history with types and effects
    };

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Call LLM service 
    // ═══════════════════════════════════════════════════════════
    const event: LLMEvent = await this.llm.generateEvent(context);
    // If API fails, you get a fallback event automatically - no try/catch needed!

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Save event to database (for history/event context)
    // ═══════════════════════════════════════════════════════════
    await this.db.saveEvent({
      campaignId,
      description: event.event,
      type: event.type,
      effects: event.effects,
      timestamp: new Date()
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Apply the stat effects
    // ═══════════════════════════════════════════════════════════
    const updatedHealth = character.health + event.effects.health;
    const updatedAttack = character.attack + event.effects.attack;
    const updatedDefense = character.defense + event.effects.defense;

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Validate stat changes (recommended)
    // ═══════════════════════════════════════════════════════════
    // Ensure no invalid states (negative health, etc.)
    const validatedHealth = Math.max(0, Math.min(character.maxHealth, updatedHealth));
    const validatedAttack = Math.max(0, updatedAttack);
    const validatedDefense = Math.max(0, updatedDefense);

    // ═══════════════════════════════════════════════════════════
    // STEP 7: Update character in database
    // ═══════════════════════════════════════════════════════════
    await this.db.updateCharacterStats(character.id, {
      health: validatedHealth,
      attack: validatedAttack,
      defense: validatedDefense
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 8: Check win/loss conditions
    // ═══════════════════════════════════════════════════════════
    if (validatedHealth <= 0) {
      await this.endCampaign(campaignId, 'LOST');
      return;
    }
    if (enemy.health <= 0) {
      await this.endCampaign(campaignId, 'WON');
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 9: Return event to display layer
    // ═══════════════════════════════════════════════════════════
    return {
      event: event.event,
      type: event.type,
      characterHealth: validatedHealth,
      characterAttack: validatedAttack,
      characterDefense: validatedDefense
    };
  }
}
```

---

## Stat Effect Ranges You Can Expect

The LLM service will generate effects within these ranges:

| Stat | Min | Max | What It Means |
|------|-----|-----|----------------|
| **Health** | -10 | +10 | Severe damage (-10) to significant healing (+10) |
| **Attack** | -5 | +5 | Weapon penalty (-5) to powerful bonus (+5) |
| **Defense** | -5 | +5 | Armour breaking (-5) to enhanced protection (+5) |

**Important**: The LLM *tries* to respect these ranges via its prompt instructions, but **you should clamp/validate** these values in your game engine. Don't trust the LLM's output completely—treat it as a suggestion that needs validation.

---

## Handling Context Chaining (The Memory Feature)

The LLM service uses `recentEvents` to remember what happened before, creating narrative continuity:

```
Event 1: "You push open a heavy stone door."
         → Saved to database with type="NARRATIVE", effects={0,0,0}

Event 2: "A shadow moves in the darkness!"
         → LLM sees Event 1 in recentEvents
         → Generates Event 2 that acknowledges Event 1
         → Saved to database with type="COMBAT_ACTION", effects={-5,0,0}

Event 3: "The dragon roars and breathes fire!"
         → LLM sees Events 1 and 2 in recentEvents
         → Generates Event 3 that flows naturally from previous events
         → Saved to database with type="COMBAT_ACTION", effects={-8,-2,-3}
```

**Your responsibility**: When you retrieve events from the database to pass as `recentEvents`, include the full event data with `type` and `effects`. This is what allows the LLM to create cohesive narratives.

**Best practice**: Include 5-10 most recent events. More events = richer context but slower API response (trade-off).

---

## What You Don't Have to Worry About

These are handled by the LLM service automatically:

✅ **API failures**: If Gemini API fails, you get a fallback event  
✅ **JSON parsing**: Guaranteed valid JSON response  
✅ **Prompt engineering**: The LLM has complex prompting to generate good events  
✅ **Model selection**: Already configured with best model for D&D  
✅ **Rate limiting**: Service handles this gracefully  

Just call `generateEvent()` and trust it works.

---

## Fallback Events (Will need to rethink this.)

```typescript
{
  event: "Ancient runes glow faintly on the walls, their meaning lost to time.",
  type: "NARRATIVE",
  effects: { health: 0, attack: 0, defense: 0 }
}

{
  event: "A health potion falls from a crumbling shelf. You catch it just in time!",
  type: "ITEM_DROP",
  effects: { health: 5, attack: 0, defense: 0 }
}

{
  event: "A sudden chill fills the air. You feel weakened by dark magic.",
  type: "ENVIRONMENTAL",
  effects: { health: -5, attack: -2, defense: 0 }
}
```

Your game engine treats these exactly the same as AI-generated events. No special handling needed.

---

## Performance & Costs

When designing your engine, consider these numbers:

| Metric | Value | Impact |
|--------|-------|--------|
| Response time | 1-3 seconds | Design UI to show "Generating event..." |
| API cost | $0.00008 per event | Negligible ($0.08 per 1,000 events) |
| Rate limit | 1,500 requests/day | Free tier is plenty for testing |
| Fallback response | <100ms | Instant if API fails |

**Design tip**: Show a loading state while waiting for the LLM response. Users expect slight delays for AI generation.

---

## Database Schema You'll Need

When you design your database, you'll need to store events with:

```typescript
interface StoredEvent {
  id: number;
  campaignId: number;
  description: string;    // The event.event text
  type: EventType;        // The event.type
  health_effect: number;  // The event.effects.health
  attack_effect: number;  // The event.effects.attack
  defense_effect: number; // The event.effects.defense
  timestamp: Date;
  // Any other fields you need
}
```

When you retrieve events for `recentEvents`, reconstruct them as:

```typescript
const recentEvents: EventHistoryEntry[] = storedEvents.map(row => ({
  description: row.description,
  type: row.type,
  effects: {
    health: row.health_effect,
    attack: row.attack_effect,
    defense: row.defense_effect
  }
}));
```

---

## Type Imports for Your Code

Here's what to import into your game engine service:

```typescript
// The service class
import { LLMService } from "@/lib/services/llm.service";

// The types you'll use
import type { 
  LLMGameContext,       // Input structure
  LLMEvent,             // Output structure
  EventHistoryEntry,    // For recentEvents array
  EventType,            // The 5 event type strings
  LLMServiceConfig      // Config options (optional)
} from "@/lib/types/llm.types";
```

---

## Quick Reference: The Contract

**YOU send:**

- Character stats (current, not delta)
- Enemy stats (current, not delta)
- Recent event history (5-10 events with type and effects)

**YOU get back:**

- One event with description, type, and effects
- Guaranteed to be valid JSON
- Effects within specified ranges
- Fallback event if API fails

**YOU do:**

- Save event to database
- Apply effects to character
- Display to player
- Check win/loss conditions
- Validate stats are in valid range

---

## Common Design Questions

**Q: What if character health goes negative?**  
A: Use it as a loss condition: `if (character.health <= 0) { endGame('LOST'); }`

**Q: Should I validate the stat effects?**  
A: Yes, clamp them: `Math.max(0, Math.min(maxHealth, health))`

**Q: How many events should I keep in history?**  
A: 5-10 is optimal. More = better context but slower (3-5 sec instead of 1-3 sec).

**Q: Can I customize the scenario/trigger?**  
A: Yes! Pass `scenario: "boss lair"` or `trigger: "as the door opens"` for control.

**Q: What if the API rate limit is hit?**  
A: You get a fallback event automatically. Your game continues without interruption.

**Q: Should my game engine have try/catch around generateEvent()?**  
A: Nope! The service handles failures internally and returns a fallback event.

---

## Testing Your Integration

Run the included test to see how context chaining works:

```bash
GEMINI_API_KEY=your_key npm run test
# or
GEMINI_API_KEY=your_key tsx test/llm.test.ts
```

This shows 3 events in sequence, demonstrating how each event has access to previous events.

---

## Reference Files

When you're building, check these:

- **Type definitions**: `/lib/types/llm.types.ts` — All the interfaces you'll use
- **Implementation details**: `/lib/services/llm.service.ts` — How the LLM works (for reference)
- **Usage example**: `/test/llm.test.ts` — Real code example of context chaining

---

## Summary: Your Game Engine's Job

1. **On event trigger**: Fetch character, enemy, and recent events from database
2. **Build context**: Create LLMGameContext object with current stats and history
3. **Call LLM**: `await llmService.generateEvent(context)` — this does the AI magic
4. **Handle response**: Get back LLMEvent with text, type, and effects
5. **Save event**: Store it in database so future events can reference it
6. **Apply effects**: Update character stats (with validation)
7. **Check end conditions**: Is anyone dead? Did player win?
8. **Display**: Show event to player and updated stats
9. **Repeat**: Generate next event when player is ready

The LLM service is your narrative engine. Your game engine is the system that manages game state, persistence, and player flow. Together they create the D&D experience.

Good luck with your implementation! 🐉

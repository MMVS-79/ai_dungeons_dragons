# LLM Service Documentation

## Overview

The LLM Service integrates Gemini AI to generate dynamic D&D events with context awareness. It maintains narrative continuity by considering previous events.

## Architecture

```
lib/
├── types/
│   └── llm.types.ts          # TypeScript interfaces (team contract)
├── services/
│   └── llm.service.ts        # LLM implementation
└── utils/
    └── env.ts                # Environment helpers

test/
└── llm.test.ts              # Usage example
```

## Quick Start

### 1. Environment Setup

Create `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

Get API key from: <https://aistudio.google.com/app/apikey>

### 2. Basic Usage

```typescript
import { LLMService } from "@/lib/services/llm.service";
import { getGeminiApiKey } from "@/lib/utils/env";

// Initialize service
const llm = new LLMService({
  apiKey: getGeminiApiKey()
});

// Prepare game context
const context = {
  character: {
    name: "Brave Knight",
    health: 100,
    attack: 15,
    defense: 10
  },
  enemy: {
    name: "Dragon",
    health: 200,
    attack: 25,
    defense: 15
  },
  recentEvents: []  // Empty for first event
};

// Generate event
const event = await llm.generateEvent(context);
console.log(event);
// {
//   event: "You discover a glowing sword embedded in stone!",
//   type: "ITEM_DROP",
//   effects: { health: 0, attack: 5, defense: 0 }
// }
```

### 3. Context Chaining (Memory)

The service uses `recentEvents` to maintain narrative continuity:

```typescript
// Event 1 - No context
const context1 = {
  character: {...},
  enemy: {...},
  recentEvents: []
};
const event1 = await llm.generateEvent(context1);
// "You enter a dark cave filled with treasure"

// Event 2 - Remembers Event 1
const context2 = {
  character: {...},
  enemy: {...},
  recentEvents: [event1.event]  // Previous event included!
};
const event2 = await llm.generateEvent(context2);
// "The dragon stirs, awakened by your footsteps"

// Event 3 - Remembers Event 1 & 2
const context3 = {
  character: {...},
  enemy: {...},
  recentEvents: [event1.event, event2.event]
};
const event3 = await llm.generateEvent(context3);
// "The dragon roars and prepares to attack!"
```

## API Reference

### Types

#### `LLMGameContext` (Input)

```typescript
interface LLMGameContext {
  character: {
    name: string;
    health: number;
    attack: number;
    defense: number;
  };
  enemy: {
    name: string;
    health: number;
    attack: number;
    defense: number;
  };
  recentEvents: string[];    // Previous event descriptions
  scenario?: string;         // Optional: location
  trigger?: string;          // Optional: event trigger
}
```

#### `LLMEvent` (Output)

```typescript
interface LLMEvent {
  event: string;             // Description of what happens
  type: EventType;           // See below
  effects: {
    health: number;          // -10 to +10
    attack: number;          // -5 to +5
    defense: number;         // -5 to +5
  };
}
```

#### `EventType`

```typescript
type EventType = 
  | "NARRATIVE"              // Story events (0 effects)
  | "COMBAT_ACTION"          // Combat scenarios
  | "ENVIRONMENTAL"          // Environmental hazards/benefits
  | "ITEM_DROP"              // Items found/lost
  | "STAT_MODIFIER"          // Stat changes
```

### LLMService Class

#### Constructor

```typescript
new LLMService(config: LLMServiceConfig)
```

**Config Options:**

- `apiKey` (required): Gemini API key
- `model` (optional): Default "gemini-2.0-flash-lite"
- `temperature` (optional): Default 0.8
- `maxOutputTokens` (optional): Default 500
- `thinkingBudget` (optional): Default 0

#### Methods

##### `generateEvent(context: LLMGameContext): Promise<LLMEvent>`

Generates a D&D event based on game context.

**Returns:** Promise resolving to LLMEvent

**Error Handling:** Returns fallback event if API fails

## Features

### ✅ Context Awareness

- Uses `recentEvents` array to maintain story continuity
- LLM considers previous events when generating next event
- Recommended: Include last 5-10 events

### ✅ Structured Output

- Uses Gemini's native JSON schema validation
- No regex cleaning needed
- Guaranteed valid JSON response

### ✅ Fallback System

- 5 pre-written fallback events
- Automatically used if API fails
- Ensures game never breaks

### ✅ Randomization

- 8 scenario types (dungeons, temples, forests, etc.)
- 8 event triggers (exploring, resting, etc.)
- Varies event generation for replayability

## Integration with Game Engine

Your game engine teammate can use this service like:

```typescript
// lib/services/gameEngine.service.ts
import { LLMService } from "@/lib/services/llm.service";
import type { LLMGameContext } from "@/lib/types/llm.types";

class GameEngine {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService({ 
      apiKey: getGeminiApiKey() 
    });
  }

  async processGameEvent(campaignId: number) {
    // 1. Fetch data from database
    const character = await db.getCharacter(campaignId);
    const enemy = await db.getEnemy('Dragon');
    const recentEvents = await db.getRecentLogs(campaignId, 5);

    // 2. Build context
    const context: LLMGameContext = {
      character: {
        name: character.name,
        health: character.health,
        attack: character.attack,
        defense: character.defense
      },
      enemy: {
        name: enemy.name,
        health: enemy.health,
        attack: enemy.attack,
        defense: enemy.defense
      },
      recentEvents: recentEvents.map(log => log.message)
    };

    // 3. Generate event (your LLM service!)
    const event = await this.llm.generateEvent(context);

    // 4. Save to database
    await db.saveLog(campaignId, event.event);

    // 5. Apply effects
    await db.updateCharacterStats(character.id, {
      health: character.health + event.effects.health,
      attack: character.attack + event.effects.attack,
      defense: character.defense + event.effects.defense
    });

    return event;
  }
}
```

## Testing

Run the test file to see context chaining in action:

```bash
GEMINI_API_KEY=your_key tsx test/llm.test.ts
```

Expected output:

```
🧪 Testing LLM Service with Context Chaining

🎲 Event #1
Context: (No previous events)
Generated: "You enter a dark cave..."

🎲 Event #2
Context:
  1. You enter a dark cave...
Generated: "The dragon stirs from slumber..."

🎲 Event #3
Context:
  1. You enter a dark cave...
  2. The dragon stirs from slumber...
Generated: "Flames gather in the dragon's throat!"

🎉 Test Complete!
```

## Configuration

### Custom Scenarios/Triggers

The service has built-in scenarios and triggers, but you can override them:

```typescript
const context = {
  character: {...},
  enemy: {...},
  recentEvents: [],
  scenario: "volcanic throne room",  // Custom!
  trigger: "as you approach the throne"  // Custom!
};
```

### Model Configuration

Use different settings for different needs:

```typescript
// Fast responses (recommended for production)
const llm = new LLMService({
  apiKey: getGeminiApiKey(),
  thinkingBudget: 0
});

// Creative responses (slower, more varied)
const llm = new LLMService({
  apiKey: getGeminiApiKey(),
  temperature: 1.2,
  thinkingBudget: 5
});
```

## Stat Effect Ranges

Based on your original design:

- **Health:** -10 to +10 (damage/healing)
- **Attack:** -5 to +5 (weapon bonuses/penalties)
- **Defense:** -5 to +5 (armor changes)

Events are constrained by prompting, but validation should happen in game engine.

## Event Types Explained

1. **NARRATIVE**: Pure story, no stat effects
   - Example: "Ancient runes glow on the walls"
   - Effects: {0, 0, 0}

2. **COMBAT_ACTION**: Direct combat scenarios
   - Example: "The goblin lunges at you!"
   - Effects: Usually negative health

3. **ENVIRONMENTAL**: Hazards or benefits
   - Example: "Poisonous gas fills the chamber"
   - Effects: Can affect any stats

4. **ITEM_DROP**: Finding/losing items
   - Example: "You discover a health potion"
   - Effects: Usually positive

5. **STAT_MODIFIER**: Temporary/permanent changes
   - Example: "A blessing increases your strength"
   - Effects: Must have non-zero values

## Cost Estimates

Using Gemini 2.0 Flash-Lite:

- Input: $0.10 per 1M tokens
- Output: $0.40 per 1M tokens

Typical event:

- Prompt: ~400 tokens
- Response: ~100 tokens
- Cost per event: ~$0.00008 (0.008 cents)

1,000 events = ~$0.08

## Troubleshooting

### "Missing API key"

- Create `.env.local` file
- Add `GEMINI_API_KEY=your_key`
- Get key from <https://aistudio.google.com/app/apikey>

### Rate limits

- Free tier: 1,500 requests/day
- Consider caching or fallback events

### Slow responses

- Reduce `temperature` (faster but less creative)
- Set `thinkingBudget: 0` (default)
- Use shorter `recentEvents` array

## Future Enhancements

- [ ] Event templates per encounter type
- [ ] Difficulty scaling based on player level
- [ ] Item generation with full descriptions
- [ ] Multi-language support
- [ ] Caching frequent event patterns
- [ ] A/B testing different prompts

## Support

For issues or questions about the LLM service:

- Check the test file: `test/llm.test.ts`
- Review type definitions: `lib/types/llm.types.ts`
- See implementation: `lib/services/llm.service.ts`

// Run: GEMINI_API_KEY=your_key node test-gemini.js


// OLD DEMO FILE 
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing API key!");
  console.log("Get one from: https://aistudio.google.com/app/apikey");
  console.log("Then run: GEMINI_API_KEY=your_key node test-gemini.js\n");
  process.exit(1);
}

const scenarios = [
  "deep dungeon chamber",
  "ancient temple ruins", 
  "dark forest path",
  "cave entrance",
  "abandoned tower",
  "underground crypt",
  "mountain pass",
  "swampy marshland"
];

const eventTriggers = [
  "as you explore",
  "while searching for clues",
  "during your investigation", 
  "as you prepare to rest",
  "while checking for traps",
  "during a moment of quiet",
  "as you approach a door",
  "while examining the area"
];

const forcedEventTypes = [
  "NARRATIVE",
  "COMBAT_ACTION", 
  "ENVIRONMENTAL",
  "ITEM_DROP",
  "STAT_MODIFIER"
];

async function testAPI() {
  console.log("🧪 Testing Gemini API...\n");
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomTrigger = eventTriggers[Math.floor(Math.random() * eventTriggers.length)];
    const randomEventType = forcedEventTypes[Math.floor(Math.random() * forcedEventTypes.length)];

    const randomHealth = Math.floor(Math.random() * 21) - 10; // -10 to +10
    const randomAttack = Math.floor(Math.random() * 11) - 5;  // -5 to +5
    const randomDefense = Math.floor(Math.random() * 11) - 5; // -5 to +5
    
    console.log("📡 Sending request...");
    console.log(`🎲 Random scenario: ${randomScenario}`);
    console.log(`⚡ Random trigger: ${randomTrigger}`);
    console.log(`🎯 Forced event type: ${randomEventType}`);
    console.log(`📊 Sample stats: health=${randomHealth}, attack=${randomAttack}, defense=${randomDefense}\n`);
    const start = Date.now();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{
        role: "user",
        parts: [{ 
          text: `You are a D&D game master. Here are the rules for our game:

GAME MECHANICS:
- Characters have: Health, Attack, Defense stats
- Characters can equip items that modify these stats
- Players face bosses as main encounters
- Before bosses, random events occur that can:
  * Apply stat modifiers (temporary/permanent)
  * Drop/pickup items
  * Create environmental challenges

EVENT TYPES:
- NARRATIVE: Story/flavor events (effects should be 0,0,0)
- COMBAT_ACTION: Direct combat scenarios (may have negative effects)
- ENVIRONMENTAL: Environmental hazards or benefits (can affect any stats)
- ITEM_DROP: Items found or lost (usually positive effects)
- STAT_MODIFIER: Temporary/permanent stat changes (must have non-zero effects)

Keep descriptions vivid but concise (1-2 sentences). Events should build tension before boss encounters.

STAT EFFECTS RULES:
- Health: -10 to +10 (healing/damage)
- Attack: -5 to +5 (weapon bonuses/penalties)
- Defense: -5 to +5 (armour/protection changes)
- Use 0 for stats that don't change

CONTEXT: You are in a ${randomScenario} ${randomTrigger}.

IMPORTANT: Generate a ${randomEventType} type event. Make it specific and different from typical atmospheric descriptions.

Generate a unique D&D event as JSON: {"event": "description", "type": "${randomEventType}", "effects": {"health": 0, "attack": 0, "defense": 0}}` 
        }]
      }],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const elapsed = Date.now() - start;
    console.log(`✓ Got response in ${elapsed}ms\n`);
    
    console.log("📄 Response:");
    console.log(response.text);
    console.log("");
    
    const parsed = JSON.parse(response.text);
    console.log("✅ Valid JSON! Parsed:", parsed);
    
    const eventData = Array.isArray(parsed) ? parsed[0] : parsed;
    console.log("🎯 Event Data:", eventData);
    console.log("\n🎉 Success! Gemini API is working.\n");
    
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

testAPI();


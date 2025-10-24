/**
 * LLM Service Test
 * Demonstrates how to use the LLM service and shows context chaining
 */

import { LLMService } from "@/lib/services/llm.service";
import { getGeminiApiKey } from "@/lib/utils/env";
import type { LLMGameContext, EventHistoryEntry } from "@/lib/types/llm.types";

async function testLLMService() {
  console.log("🧪 Testing LLM Service with Context Chaining\n");
  console.log("=".repeat(60));

  try {
    // Initialize service
    const llm = new LLMService({
      apiKey: getGeminiApiKey()
    });

    // Mock game state
    const baseContext: LLMGameContext = {
      character: {
        name: "Brave Knight",
        health: 100,
        attack: 15,
        defense: 10
      },
      enemy: {
        name: "Ancient Dragon",
        health: 200,
        attack: 25,
        defense: 15
      },
      recentEvents: [] // Empty for first event
    };

    // Generate 3 events to show context chaining
    const eventHistory: EventHistoryEntry[] = [];

    for (let i = 1; i <= 3; i++) {
      console.log(`\n🎲 Event #${i}`);
      console.log("-".repeat(60));

      const context = {
        ...baseContext,
        recentEvents: eventHistory // Each event sees previous ones!
      };

      console.log("\n📜 Context (Previous Events with Stats):");
      if (context.recentEvents.length === 0) {
        console.log("  (No previous events - this is the beginning)");
      } else {
        context.recentEvents.forEach((entry, idx) => {
          const effectsStr = [];
          if (entry.effects.health !== 0)
            effectsStr.push(
              `HP ${entry.effects.health > 0 ? "+" : ""}${entry.effects.health}`
            );
          if (entry.effects.attack !== 0)
            effectsStr.push(
              `ATK ${entry.effects.attack > 0 ? "+" : ""}${
                entry.effects.attack
              }`
            );
          if (entry.effects.defense !== 0)
            effectsStr.push(
              `DEF ${entry.effects.defense > 0 ? "+" : ""}${
                entry.effects.defense
              }`
            );

          const effectsPart =
            effectsStr.length > 0 ? ` [${effectsStr.join(", ")}]` : "";
          console.log(`  ${idx + 1}. ${entry.description}${effectsPart}`);
        });
      }

      console.log("\n⏳ Generating event...");
      const start = Date.now();

      const event = await llm.generateEvent(context);

      const elapsed = Date.now() - start;
      console.log(`✓ Generated in ${elapsed}ms\n`);

      console.log("📄 Generated Event:");
      console.log(`  Type: ${event.type}`);
      console.log(`  Description: ${event.event}`);
      console.log(
        `  Effects: HP ${event.effects.health >= 0 ? "+" : ""}${
          event.effects.health
        }, ATK ${event.effects.attack >= 0 ? "+" : ""}${
          event.effects.attack
        }, DEF ${event.effects.defense >= 0 ? "+" : ""}${event.effects.defense}`
      );

      // Save this event WITH stats for next iteration's context
      eventHistory.push({
        description: event.event,
        type: event.type,
        effects: event.effects
      });

      // Apply effects to character for next iteration
      baseContext.character.health += event.effects.health;
      baseContext.character.attack += event.effects.attack;
      baseContext.character.defense += event.effects.defense;

      console.log(
        `\n📊 Updated Character Stats: HP ${baseContext.character.health}, ATK ${baseContext.character.attack}, DEF ${baseContext.character.defense}`
      );

      // Wait a bit between events (optional, for readability)
      if (i < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(
      "\n🎉 Test Complete! LLM Service with Context Chaining Works!\n"
    );

    console.log("📝 Full Event History (with stat changes):");
    eventHistory.forEach((entry, idx) => {
      const effectsStr = [];
      if (entry.effects.health !== 0)
        effectsStr.push(
          `HP ${entry.effects.health > 0 ? "+" : ""}${entry.effects.health}`
        );
      if (entry.effects.attack !== 0)
        effectsStr.push(
          `ATK ${entry.effects.attack > 0 ? "+" : ""}${entry.effects.attack}`
        );
      if (entry.effects.defense !== 0)
        effectsStr.push(
          `DEF ${entry.effects.defense > 0 ? "+" : ""}${entry.effects.defense}`
        );

      const effectsPart =
        effectsStr.length > 0
          ? ` [${effectsStr.join(", ")}]`
          : " [No stat changes]";
      console.log(
        `  ${idx + 1}. [${entry.type}] ${entry.description}${effectsPart}`
      );
    });
    console.log("");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
testLLMService();

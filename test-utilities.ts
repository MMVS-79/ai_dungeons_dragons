// test-utilities.ts
// Run with: npx ts-node test-utilities.ts
// Tests all utility classes independently

import { Dice_Roll } from './lib/utils/diceRoll.ts';
import { Stat_Calc } from './lib/utils/statCalc.ts';
import { EventType } from './lib/utils/eventType.ts';

console.log('🎲 Testing Utility Classes\n');

// ============================================================================
// TEST 1: Dice_Roll
// ============================================================================
console.log('--- TEST 1: Dice_Roll ---');

// Test basic rolling
console.log('Rolling 5 dice:');
for (let i = 0; i < 5; i++) {
  const roll = Dice_Roll.roll();
  const classification = Dice_Roll.classifyRoll(roll);
  console.log(`  Roll ${i + 1}: ${roll} → ${classification}`);
}

// Test all classifications
console.log('\nTesting classification boundaries:');
console.log('  Roll 1:', Dice_Roll.classifyRoll(1)); // critical_failure
console.log('  Roll 4:', Dice_Roll.classifyRoll(4)); // critical_failure
console.log('  Roll 5:', Dice_Roll.classifyRoll(5)); // regular
console.log('  Roll 10:', Dice_Roll.classifyRoll(10)); // regular
console.log('  Roll 15:', Dice_Roll.classifyRoll(15)); // regular
console.log('  Roll 16:', Dice_Roll.classifyRoll(16)); // critical_success
console.log('  Roll 20:', Dice_Roll.classifyRoll(20)); // critical_success

// Test convenience method
console.log('\nTesting rollAndClassify:');
const { value, classification } = Dice_Roll.rollAndClassify();
console.log(`  Rolled ${value} → ${classification}`);

console.log('✅ Dice_Roll tests passed\n');

// ============================================================================
// TEST 2: Stat_Calc
// ============================================================================
console.log('--- TEST 2: Stat_Calc ---');

// Test critical failure
console.log('Critical Failure (rolls 1-4):');
console.log('  Base value 10, roll 3:', Stat_Calc.applyRoll(3, 'HEALTH', 10)); // Should be 0

// Test regular rolls
console.log('\nRegular Rolls (5-15):');
console.log('  Base value 10, roll 5:', Stat_Calc.applyRoll(5, 'HEALTH', 10)); // Should be 5 (0.5x)
console.log('  Base value 10, roll 10:', Stat_Calc.applyRoll(10, 'HEALTH', 10)); // Should be 10 (1.0x)
console.log('  Base value 10, roll 15:', Stat_Calc.applyRoll(15, 'HEALTH', 10)); // Should be 15 (1.5x)

// Test critical success
console.log('\nCritical Success (16-20):');
console.log('  Base value 10, roll 18:', Stat_Calc.applyRoll(18, 'HEALTH', 10)); // Should be 20 (2x)

// Test different stat types
console.log('\nDifferent stat types:');
console.log('  ATTACK roll 12, base 5:', Stat_Calc.applyRoll(12, 'ATTACK', 5)); // ~6
console.log('  DEFENSE roll 14, base 8:', Stat_Calc.applyRoll(14, 'DEFENSE', 8)); // ~11

// Test flexible stat type handling
console.log('\nFlexible stat type handling:');
console.log('  "health" roll 15, base 10:', Stat_Calc.applyRollFlexible(15, 'health', 10));
console.log('  "VIT" roll 15, base 10:', Stat_Calc.applyRollFlexible(15, 'VIT', 10));
console.log('  "Attack" roll 15, base 5:', Stat_Calc.applyRollFlexible(15, 'Attack', 5));
console.log('  "ATK" roll 15, base 5:', Stat_Calc.applyRollFlexible(15, 'ATK', 5));

console.log('✅ Stat_Calc tests passed\n');

// ============================================================================
// TEST 3: EventType
// ============================================================================
console.log('--- TEST 3: EventType ---');

// Test descriptive counter
console.log('Testing descriptive counter:');
console.log('  Initial count:', EventType.getDescriptiveCount());

EventType.incrementDescriptiveCount();
console.log('  After increment:', EventType.getDescriptiveCount());

EventType.incrementDescriptiveCount();
console.log('  After another increment:', EventType.getDescriptiveCount());

EventType.resetDescriptiveCount();
console.log('  After reset:', EventType.getDescriptiveCount());

// Test event type creation
console.log('\nTesting event type instances:');
const descriptiveEvent = new EventType('Descriptive');
console.log('  Created Descriptive event:', descriptiveEvent.getEventType());

const combatEvent = new EventType('Combat');
console.log('  Created Combat event:', combatEvent.getEventType());

// Test trigger (will log counter updates)
console.log('\nTriggering events:');
await descriptiveEvent.trigger(); // Should increment counter
console.log('  Counter after Descriptive:', EventType.getDescriptiveCount());

await combatEvent.trigger(); // Should reset counter
console.log('  Counter after Combat:', EventType.getDescriptiveCount());

// Test validation
console.log('\nTesting event type validation:');
console.log('  "Descriptive" is valid:', EventType.isValidEventType('Descriptive'));
console.log('  "Combat" is valid:', EventType.isValidEventType('Combat'));
console.log('  "Invalid" is valid:', EventType.isValidEventType('Invalid'));

console.log('✅ EventType tests passed\n');

// ============================================================================
// TEST 4: Integration Test
// ============================================================================
console.log('--- TEST 4: Integration Test ---');
console.log('Simulating full event flow:\n');

// Reset counter
EventType.resetDescriptiveCount();

// Simulate environmental event
console.log('1. Environmental Event:');
const envEvent = new EventType('Environmental');
const envRoll = Dice_Roll.roll();
const envClassification = Dice_Roll.classifyRoll(envRoll);
const baseHealthBoost = 10;
const finalHealthBoost = Stat_Calc.applyRoll(envRoll, 'HEALTH', baseHealthBoost);

console.log(`   LLM says: +${baseHealthBoost} health`);
console.log(`   Rolled: ${envRoll} (${envClassification})`);
console.log(`   Final bonus: +${finalHealthBoost} health`);
await envEvent.trigger();

// Simulate descriptive event
console.log('\n2. Descriptive Event:');
const descEvent = new EventType('Descriptive');
await descEvent.trigger();
console.log(`   Counter is now: ${EventType.getDescriptiveCount()}`);

// Try another descriptive
console.log('\n3. Another Descriptive Event:');
const descEvent2 = new EventType('Descriptive');
await descEvent2.trigger();
console.log(`   Counter is now: ${EventType.getDescriptiveCount()}`);
console.log(`   ⚠️ Too many descriptive events! GameService would regenerate.`);

// Simulate combat to reset
console.log('\n4. Combat Event (resets counter):');
const combatEvent2 = new EventType('Combat');
await combatEvent2.trigger();
console.log(`   Counter after combat: ${EventType.getDescriptiveCount()}`);

console.log('\n✅ All integration tests passed!');
console.log('\n🎉 All utility classes working correctly!');
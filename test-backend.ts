// Create: test-backend.ts in your project root
// Run with: npx ts-node test-backend.ts

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GameService } from './lib/services/game.service.ts';
import type { PlayerAction } from './lib/types/game.types.ts';

async function testBackend() {
  console.log('🎮 Testing Game Service...\n');

  // Initialize game service (needs Gemini API key)
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY in .env.local');
  }

  const gameService = new GameService(apiKey);

  // Test 1: Generate an exploration event
  console.log('📍 Test 1: Generate exploration event');
  const explorationAction: PlayerAction = {
    campaignId: 1,
    actionType: 'continue',
    actionData: {}
  };

  try {
    const result1 = await gameService.processPlayerAction(explorationAction);
    console.log('✅ Event generated:', result1.message);
    console.log('📊 Current phase:', result1.gameState.currentPhase);
    console.log('🎯 Choices:', result1.choices);
    console.log('');

    // Test 2: Accept the event
    console.log('📍 Test 2: Accept the generated event');
    const acceptAction: PlayerAction = {
      campaignId: 1,
      actionType: 'accept_event',
      actionData: {}
    };

    const result2 = await gameService.processPlayerAction(acceptAction);
    console.log('✅ Event accepted:', result2.message);
    console.log('📊 New phase:', result2.gameState.currentPhase);
    
    if (result2.gameState.currentEnemy) {
      console.log('⚔️ Enemy encountered:', result2.gameState.currentEnemy.name);
      console.log('💪 Enemy HP:', result2.gameState.currentEnemy.hp);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBackend();
/**
 * API Route Tests - Frontend Integration
 * ========================================
 * 
 * These tests verify that the API routes properly handle requests from the frontend
 * and return the expected response formats. This ensures the contract between
 * the frontend and backend is maintained.
 * 
 * Coverage:
 * - GET /api/campaigns - Fetch user's campaigns
 * - POST /api/campaigns - Create new campaign
 * - GET /api/races - Fetch character races
 * - GET /api/classes - Fetch character classes
 * - POST /api/game/action - Process game actions
 * - GET /api/game/action - Get game state validation
 * 
 * Test Strategy:
 * We mock the backend services and NextAuth to isolate the API route logic.
 * This lets us verify that routes properly validate input, handle errors,
 * and return correctly formatted responses.
 */

import { NextRequest } from 'next/server';
import * as BackendService from '../lib/services/backend.service';
import { GameService } from '../lib/services/game.service';

// Mock dependencies
jest.mock('../lib/services/backend.service');
jest.mock('../lib/services/game.service');
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Import after mocking
import { getServerSession } from 'next-auth';

// Test data
const mockSession = {
  user: {
    email: 'test@example.com',
    name: 'Test User',
  },
};

const mockCampaigns = [
  {
    id: 1,
    account_id: 1,
    name: 'Adventure Quest',
    description: 'Epic adventure',
    state: 'active',
    event_number: 5,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-05'),
  },
  {
    id: 2,
    account_id: 1,
    name: 'Dragon Hunt',
    description: 'Find the dragon',
    state: 'active',
    event_number: 12,
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-06'),
  },
];

const mockRaces = [
  { id: 1, name: 'Human', health: 20, attack: 5, defense: 3 },
  { id: 2, name: 'Elf', health: 15, attack: 6, defense: 4 },
  { id: 3, name: 'Dwarf', health: 25, attack: 4, defense: 6 },
];

const mockClasses = [
  { id: 1, name: 'Warrior', health: 15, attack: 8, defense: 5 },
  { id: 2, name: 'Mage', health: 10, attack: 10, defense: 2 },
  { id: 3, name: 'Rogue', health: 12, attack: 9, defense: 3 },
];

const mockCharacter = {
  id: 1,
  campaign_id: 1,
  name: 'Aragorn',
  race_id: 1,
  class_id: 1,
  max_health: 35,
  current_health: 35,
  attack: 13,
  defense: 8,
  sprite_path: '/sprites/warrior.png',
  created_at: new Date(),
};

describe('API Routes - Frontend Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/campaigns', () => {
    it('should return campaigns for authenticated user', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.getCampaignsByAccount as jest.Mock).mockResolvedValue(mockCampaigns);

      // Import route dynamically to apply mocks
      const { GET } = await import('../app/api/campaigns/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.campaigns).toHaveLength(2);
      expect(data.campaigns[0].name).toBe('Adventure Quest');
      expect(data.campaigns[1].name).toBe('Dragon Hunt');
      
      // Verify backend service was called correctly
      expect(BackendService.getOrCreateAccount).toHaveBeenCalledWith('test@example.com');
      expect(BackendService.getCampaignsByAccount).toHaveBeenCalledWith(1);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { GET } = await import('../app/api/campaigns/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.getCampaignsByAccount as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const { GET } = await import('../app/api/campaigns/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch campaigns');
    });

    it('should return empty array when user has no campaigns', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.getCampaignsByAccount as jest.Mock).mockResolvedValue([]);

      const { GET } = await import('../app/api/campaigns/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.campaigns).toHaveLength(0);
    });
  });

  describe('POST /api/campaigns', () => {
    const validCampaignData = {
      campaignName: 'New Adventure',
      campaignDescription: 'A new quest begins',
      character: {
        name: 'Gandalf',
        raceId: 2,
        classId: 2,
        spritePath: '/sprites/mage.png',
      },
    };

    it('should create campaign with character for authenticated user', async () => {
      // Arrange
      const mockCampaign = {
        id: 3,
        account_id: 1,
        name: 'New Adventure',
        description: 'A new quest begins',
        state: 'active',
        event_number: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.getCampaignsByAccount as jest.Mock).mockResolvedValue([]);
      (BackendService.createCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (BackendService.createCharacter as jest.Mock).mockResolvedValue(mockCharacter);

      const { POST } = await import('../app/api/campaigns/route');

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(validCampaignData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.campaign).toBeDefined();
      expect(data.character).toBeDefined();
      expect(data.campaign.name).toBe('New Adventure');
      expect(data.character.name).toBe('Aragorn');

      // Verify services called with correct parameters
      expect(BackendService.createCampaign).toHaveBeenCalledWith(
        1,
        'New Adventure',
        'A new quest begins'
      );
      expect(BackendService.createCharacter).toHaveBeenCalledWith(
        3,
        'Gandalf',
        2,
        2,
        '/sprites/mage.png'
      );
    });

    it('should return 400 when campaign name is missing', async () => {
      // Arrange
      const invalidData = {
        campaignDescription: 'Test',
        character: {
          name: 'Test',
          raceId: 1,
          classId: 1,
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.getCampaignsByAccount as jest.Mock).mockResolvedValue([]);

      const { POST } = await import('../app/api/campaigns/route');

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 when campaign limit is reached', async () => {
      // Arrange
      const fiveCampaigns = Array(5).fill(mockCampaigns[0]);

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.getCampaignsByAccount as jest.Mock).mockResolvedValue(fiveCampaigns);

      const { POST } = await import('../app/api/campaigns/route');

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(validCampaignData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Campaign limit reached (max 5)');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('../app/api/campaigns/route');

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(validCampaignData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });
  });

  describe('GET /api/races', () => {
    it('should return all available races', async () => {
      // Arrange
      (BackendService.getAllRaces as jest.Mock).mockResolvedValue(mockRaces);

      const { GET } = await import('../app/api/races/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.races).toHaveLength(3);
      expect(data.races[0].name).toBe('Human');
      expect(data.races[1].name).toBe('Elf');
      expect(data.races[2].name).toBe('Dwarf');
      
      // Verify each race has required properties
      data.races.forEach((race: any) => {
        expect(race).toHaveProperty('id');
        expect(race).toHaveProperty('name');
        expect(race).toHaveProperty('health');
        expect(race).toHaveProperty('attack');
        expect(race).toHaveProperty('defense');
      });
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      (BackendService.getAllRaces as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const { GET } = await import('../app/api/races/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch races');
    });
  });

  describe('GET /api/classes', () => {
    it('should return all available classes', async () => {
      // Arrange
      (BackendService.getAllClasses as jest.Mock).mockResolvedValue(mockClasses);

      const { GET } = await import('../app/api/classes/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.classes).toHaveLength(3);
      expect(data.classes[0].name).toBe('Warrior');
      expect(data.classes[1].name).toBe('Mage');
      expect(data.classes[2].name).toBe('Rogue');

      // Verify each class has required properties
      data.classes.forEach((cls: any) => {
        expect(cls).toHaveProperty('id');
        expect(cls).toHaveProperty('name');
        expect(cls).toHaveProperty('health');
        expect(cls).toHaveProperty('attack');
        expect(cls).toHaveProperty('defense');
      });
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      (BackendService.getAllClasses as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const { GET } = await import('../app/api/classes/route');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch classes');
    });
  });

  describe('POST /api/game/action', () => {
    const mockGameState = {
      campaign: mockCampaigns[0],
      character: mockCharacter,
      equipment: {
        weapon: null,
        armor: null,
        shield: null,
      },
      inventory: [],
    };

    const mockGameResponse = {
      success: true,
      gameState: mockGameState,
      message: 'You venture deeper into the forest...',
      choices: ['continue'],
      combatResult: undefined,
      itemFound: undefined,
    };

    it('should process continue action successfully', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.verifyCampaignOwnership as jest.Mock).mockResolvedValue(mockCampaigns[0]);

      const mockGameService = {
        processPlayerAction: jest.fn().mockResolvedValue(mockGameResponse),
        getStoredInvestigationPrompt: jest.fn().mockReturnValue(null),
      };
      (GameService as jest.Mock).mockImplementation(() => mockGameService);

      const { POST } = await import('../app/api/game/action/route');

      const request = new NextRequest('http://localhost:3000/api/game/action', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: 1,
          actionType: 'continue',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.gameState).toBeDefined();
      expect(data.message).toBe('You venture deeper into the forest...');
      expect(data.choices).toContain('continue');

      // Verify game service was called with correct action
      expect(mockGameService.processPlayerAction).toHaveBeenCalledWith({
        campaignId: 1,
        actionType: 'continue',
        actionData: {},
      });
    });

    it('should return 400 when campaignId is missing', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);

      const { POST } = await import('../app/api/game/action/route');

      const request = new NextRequest('http://localhost:3000/api/game/action', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'continue',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when actionType is invalid', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.verifyCampaignOwnership as jest.Mock).mockResolvedValue(mockCampaigns[0]);

      const mockGameService = {
        getStoredInvestigationPrompt: jest.fn().mockReturnValue(null),
      };
      (GameService as jest.Mock).mockImplementation(() => mockGameService);

      const { POST } = await import('../app/api/game/action/route');

      const request = new NextRequest('http://localhost:3000/api/game/action', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: 1,
          actionType: 'invalid_action',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid actionType');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('../app/api/game/action/route');

      const request = new NextRequest('http://localhost:3000/api/game/action', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: 1,
          actionType: 'continue',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('should handle combat actions with proper response structure', async () => {
      // Arrange
      const combatResponse = {
        success: true,
        gameState: mockGameState,
        message: 'You strike the goblin for 8 damage!',
        choices: ['attack', 'flee', 'use_item_combat'],
        combatResult: {
          playerDamage: 8,
          enemyDamage: 3,
          enemyDefeated: false,
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.verifyCampaignOwnership as jest.Mock).mockResolvedValue(mockCampaigns[0]);

      const mockGameService = {
        processPlayerAction: jest.fn().mockResolvedValue(combatResponse),
        getStoredInvestigationPrompt: jest.fn().mockReturnValue(null),
      };
      (GameService as jest.Mock).mockImplementation(() => mockGameService);

      const { POST } = await import('../app/api/game/action/route');

      const request = new NextRequest('http://localhost:3000/api/game/action', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: 1,
          actionType: 'attack',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.combatResult).toBeDefined();
      expect(data.combatResult.playerDamage).toBe(8);
      expect(data.combatResult.enemyDamage).toBe(3);
      expect(data.choices).toContain('attack');
      expect(data.choices).toContain('flee');
    });
  });

  describe('GET /api/game/action (Game State Validation)', () => {
    const mockValidation = {
      isValid: true,
      campaign: mockCampaigns[0],
      character: mockCharacter,
      errors: [],
    };

    it('should return game state validation for valid campaign', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);
      (BackendService.verifyCampaignOwnership as jest.Mock).mockResolvedValue(mockCampaigns[0]);

      const mockGameService = {
        validateGameState: jest.fn().mockResolvedValue(mockValidation),
      };
      (GameService as jest.Mock).mockImplementation(() => mockGameService);

      const { GET } = await import('../app/api/game/action/route');

      const url = new URL('http://localhost:3000/api/game/action');
      url.searchParams.set('campaignId', '1');
      
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.validation).toBeDefined();
      expect(data.validation.isValid).toBe(true);
      expect(mockGameService.validateGameState).toHaveBeenCalledWith(1);
    });

    it('should return 400 when campaignId is missing', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);

      const { GET } = await import('../app/api/game/action/route');

      const request = new NextRequest('http://localhost:3000/api/game/action');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing campaignId parameter');
    });

    it('should return 400 when campaignId is not a number', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (BackendService.getOrCreateAccount as jest.Mock).mockResolvedValue(1);

      const { GET } = await import('../app/api/game/action/route');

      const url = new URL('http://localhost:3000/api/game/action');
      url.searchParams.set('campaignId', 'invalid');
      
      const request = new NextRequest(url);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid campaignId');
    });
  });
});

/**
 * Summary of API Tests:
 * 
 * These tests verify that the API routes correctly:
 * 1. Authenticate users and return proper 401 errors
 * 2. Validate input data and return 400 errors for invalid requests
 * 3. Handle database errors gracefully with 500 errors
 * 4. Return properly formatted JSON responses
 * 5. Call backend services with correct parameters
 * 6. Enforce business rules (e.g., campaign limit)
 * 
 * All tests use mocked dependencies to ensure we're only testing
 * the API route logic, not the underlying services.
 */

import { NextRequest, NextResponse } from "next/server";
import * as BackendService from "@/lib/services/backend.service";
import type { Campaign, Character } from "@/lib/types/game.types";

/**
 * GET /api/campaigns
 *
 * List all campaigns for the current user
 *
 * Purpose:
 *   Fetch all campaigns belonging to the authenticated user for display on
 *   the campaigns dashboard page.
 *
 * Query Parameters:
 *   - accountId: number (required until auth is implemented)
 *
 * Response:
 *   {
 *     success: boolean;
 *     campaigns: Campaign[];  // Ordered by updated_at DESC (most recent first)
 *   }
 *
 * Implementation:
 *   1. Validates accountId parameter is provided
 *   2. Calls BackendService.getCampaignsByAccount() to fetch all campaigns
 *   3. Returns campaigns ordered by updated_at DESC (most recent first)
 *   4. Returns empty array if no campaigns found (not an error)
 *
 * Error Handling:
 *   - 400: Missing accountId parameter
 *   - 500: Database query failure
 */
export async function GET(request: NextRequest) {
  try {
    // Extract accountId from query parameters
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    // Validate required accountId parameter
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Missing accountId parameter" },
        { status: 400 }
      );
    }

    // Query all campaigns for this user from database
    // Returns campaigns ordered by updated_at DESC (most recent first)
    const campaigns = await BackendService.getCampaignsByAccount(
      parseInt(accountId)
    );

    // TODO: Remove console.log after development
    console.log(
      `[API] GET /api/campaigns - Found ${campaigns.length} campaigns for account ${accountId}`
    );

    // Return successful response with campaigns array
    return NextResponse.json({
      success: true,
      campaigns: campaigns
    });
  } catch (error) {
    // Log error and return 500 response
    console.error("[API] List campaigns error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 *
 * Create new campaign with associated character
 *
 * Purpose:
 *   Start a new game campaign by creating both a campaign record and the player's
 *   initial character. Character stats are calculated based on race and class.
 *
 * Request Body:
 *   {
 *     accountId: number;              // User account ID (TODO: get from auth session)
 *     campaignName: string;           // Name of the campaign
 *     campaignDescription?: string;   // Optional campaign description
 *     character: {
 *       name: string;                 // Character name
 *       raceId: number;               // Race ID from races table
 *       classId: number;              // Class ID from classes table
 *     };
 *   }
 *
 * Response:
 *   {
 *     success: boolean;
 *     campaign: Campaign;             // Created campaign object with ID
 *     character: Character;           // Created character object with calculated stats
 *   }
 *
 * Implementation:
 *   1. Validates all required fields are present in request body
 *   2. Creates campaign record using BackendService.createCampaign()
 *   3. Creates character with calculated stats using BackendService.createCharacter()
 *      - Character stats = race base stats + class base stats
 *      - Links character to campaign via campaign_id
 *   4. Returns both created objects with generated IDs
 *
 * Error Handling:
 *   - 400: Missing required fields (accountId, campaignName, character data)
 *   - 500: Database insertion failure or invalid race/class IDs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate all required fields are present
    // Must have: accountId, campaignName, character.name, character.raceId, character.classId
    if (
      !body.accountId ||
      !body.campaignName ||
      !body.character?.name ||
      !body.character?.raceId ||
      !body.character?.classId
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 1: Create the campaign record
    const campaign = await BackendService.createCampaign(
      body.accountId,
      body.campaignName,
      body.campaignDescription
    );

    // Step 2: Create the player's character linked to the campaign
    // Stats are automatically calculated as: race base stats + class base stats
    const character = await BackendService.createCharacter(
      campaign.id,
      body.character.name,
      body.character.raceId,
      body.character.classId
    );

    // TODO: Remove console.log after development
    console.log(
      `[API] POST /api/campaigns - Created campaign ${campaign.id} with character ${character.id}`
    );

    // Return both created objects with their generated IDs
    return NextResponse.json({
      success: true,
      campaign,
      character
    });
  } catch (error) {
    // TODO: Remove console.log after development
    console.error("[API] Create campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

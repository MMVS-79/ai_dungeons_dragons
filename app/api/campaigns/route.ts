import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import * as BackendService from "@/lib/services/backend.service";

/**
 * GET /api/campaigns
 *
 * List all campaigns for the authenticated user
 *
 * Purpose:
 *   Fetch all campaigns belonging to the authenticated user for display on
 *   the campaigns dashboard page.
 *
 * Authentication:
 *   Requires valid session. User's email is used to look up their database
 *   account ID via getOrCreateAccount().
 *
 * Response:
 *   {
 *     success: boolean;
 *     campaigns: Campaign[];  // Ordered by updated_at DESC (most recent first)
 *   }
 *
 * Implementation:
 *   1. Gets session and validates user is authenticated
 *   2. Looks up database accountId from session email
 *   3. Calls BackendService.getCampaignsByAccount() to fetch all campaigns
 *   4. Returns campaigns ordered by updated_at DESC (most recent first)
 *   5. Returns empty array if no campaigns found (not an error)
 *
 * Error Handling:
 *   - 401: Not authenticated (no session or missing email)
 *   - 500: Database query failure
 */
export async function GET() {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    // Validate user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get database accountId from email (creates account if first login)
    const accountId = await BackendService.getOrCreateAccount(
      session.user.email
    );

    // Query all campaigns for this user from database
    // Returns campaigns ordered by updated_at DESC (most recent first)
    const campaigns = await BackendService.getCampaignsByAccount(accountId);

    // Return successful response with campaigns array
    return NextResponse.json({
      success: true,
      campaigns: campaigns
    });
  } catch {
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
 * Authentication:
 *   Requires valid session. User's email is used to look up their database
 *   account ID via getOrCreateAccount().
 *
 * Request Body:
 *   {
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
 *   1. Gets session and validates user is authenticated
 *   2. Looks up database accountId from session email
 *   3. Validates all required fields are present in request body
 *   4. Creates campaign record using BackendService.createCampaign()
 *   5. Creates character with calculated stats using BackendService.createCharacter()
 *      - Character stats = race base stats + class base stats
 *      - Links character to campaign via campaign_id
 *   6. Returns both created objects with generated IDs
 *
 * Error Handling:
 *   - 401: Not authenticated (no session or missing email)
 *   - 400: Missing required fields (campaignName, character data)
 *   - 500: Database insertion failure or invalid race/class IDs
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    // Validate user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get database accountId from email (creates account if first login)
    const accountId = await BackendService.getOrCreateAccount(
      session.user.email
    );

    // Parse request body
    const body = await request.json();

    // Validate all required fields are present
    // accountId comes from session, not body
    if (
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

    // Step 1: Create the campaign record (accountId from session)
    const campaign = await BackendService.createCampaign(
      accountId,
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

    // Return both created objects with their generated IDs
    return NextResponse.json({
      success: true,
      campaign,
      character
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

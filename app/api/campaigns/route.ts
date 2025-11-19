import { NextRequest, NextResponse } from "next/server";
import type { Campaign, Character } from "@/lib/types/game.types";

/**
 * GET /api/campaigns
 *
 * TODO: List all campaigns for the current user
 *
 * Purpose: Fetch all campaigns belonging to the authenticated user for display on dashboard/campaign list page
 *
 * Query Parameters:
 * - accountId: number (required until auth is implemented)
 * - status?: "active" | "completed" | "abandoned" (optional filter)
 *
 * Response:
 * {
 *   success: boolean;
 *   campaigns: Campaign[];
 * }
 *
 * Implementation Steps:
 * 1. Get accountId from query params (or from auth session when implemented)
 * 2. Call BackendService function to query campaigns table WHERE account_id = ?
 * 3. Apply optional status filter if provided
 * 4. Order by updated_at DESC to show most recent first
 * 5. Return array of campaigns
 * 6. Handle error if no campaigns found (return empty array, not error)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Missing accountId parameter" },
        { status: 400 }
      );
    }

    // Step 1: Query campaigns table WHERE account_id matches
    // Step 2: Apply optional status filter if provided
    // Step 3: Order by updated_at DESC to show most recent first
    // Step 4: Return campaigns array

    console.log(`[API] GET /api/campaigns - accountId: ${accountId}`);

    // MOCK DATA - Replace with actual database query
    return NextResponse.json({
      success: true,
      campaigns: []
    });
  } catch (error) {
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
 * TODO: Create new campaign with associated character
 *
 * Purpose: Start a new game campaign with character creation
 *
 * Request Body:
 * {
 *   accountId: number;
 *   campaignName: string;
 *   campaignDescription?: string;
 *   character: {
 *     name: string;
 *     raceId: number;
 *     classId: number;
 *     spritePath?: string;
 *   };
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   campaign: Campaign;
 *   character: Character;
 * }
 *
 * Implementation Steps:
 * 1. Validate request body (required fields)
 * 2. Start database transaction
 * 3. Create campaign record in campaigns table
 * 4. Get base stats for race/class combination
 * 5. Create character record in characters table with campaign_id
 * 6. Commit transaction
 * 7. Return both campaign and character data
 * 8. Rollback transaction on error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.accountId || !body.campaignName || !body.character?.name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 1: Begin database transaction
    // Step 2: Insert campaign record to campaigns table
    // Step 3: Get base stats from races/classes tables
    // Step 4: Insert character record to characters table with campaign_id
    // Step 5: Commit transaction (rollback on error)

    console.log(`[API] POST /api/campaigns - Creating: ${body.campaignName}`);

    // MOCK DATA - Replace with actual database insert
    return NextResponse.json({
      success: true,
      campaign: {
        id: 1,
        accountId: body.accountId,
        name: body.campaignName,
        description: body.campaignDescription || "",
        state: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      } as Campaign,
      character: {
        id: 1,
        name: body.character.name,
        currentHealth: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        raceId: body.character.raceId,
        classId: body.character.classId,
        campaignId: 1,
        spritePath: body.character.spritePath
      } as Character
    });
  } catch (error) {
    console.error("[API] Create campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

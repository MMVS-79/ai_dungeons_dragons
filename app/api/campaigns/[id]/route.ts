import { NextRequest, NextResponse } from "next/server";
import * as BackendService from "@/lib/services/backend.service";

/**
 * GET /api/campaigns/[id]
 *
 * Get full campaign details with character, equipment, inventory, and recent events
 *
 * Purpose:
 *   Load all data needed to display the campaign page. This includes the campaign
 *   metadata, the player's character with full stats, equipped items, inventory, and
 *   recent game events for the event log.
 *
 * URL Parameters:
 *   - id: Campaign ID (number)
 *
 * Response:
 *   {
 *     success: boolean;
 *     campaign: Campaign;              // Campaign metadata (name, state, etc.)
 *     character: Character;            // Player character with calculated stats
 *     equipment: Equipment;            // Currently equipped weapon, armor, shield
 *     inventory: Item[];               // All items in character's inventory
 *     recentEvents: GameEvent[];       // Last 10 game events for event log
 *   }
 *
 * Implementation:
 *   1. Validates campaign ID from URL parameter
 *   2. Fetches campaign record (throws if not found)
 *   3. Fetches character with full data including:
 *      - Base character stats
 *      - Equipped weapon/armor/shield
 *      - Complete inventory
 *   4. Fetches last 10 events ordered by event_number DESC
 *   5. Returns all data in single response to minimize round trips
 *
 * Error Handling:
 *   - 400: Invalid campaign ID (not a number)
 *   - 500: Campaign not found or database query failure
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15 requires params to be async
) {
  try {
    // Extract and parse campaign ID from URL parameter
    // Next.js 15 requires awaiting the params Promise
    const { id } = await context.params;
    const campaignId = parseInt(id);

    // Validate campaign ID is a valid number
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    // Fetch campaign metadata (name, description, state, timestamps)
    // Throws error if campaign not found
    const campaign = await BackendService.getCampaign(campaignId);

    // Fetch character with complete data:
    // - Character stats (HP, attack, defense)
    // - Equipped items (weapon, armor, shield) with their stats
    // - Full inventory of unequipped items
    const { character, equipment, inventory } =
      await BackendService.getCharacterWithFullData(campaignId);

    // Fetch last 10 game events for the event log
    // Ordered by event_number DESC (most recent first)
    const recentEvents = await BackendService.getRecentEvents(campaignId, 10);

    // TODO: Remove console.log after development
    console.log(
      `[API] GET /api/campaigns/${campaignId} - Loaded campaign, character, ${inventory.length} items, ${recentEvents.length} events`
    );

    // Return all data in single response to minimize client round trips
    return NextResponse.json({
      success: true,
      campaign,
      character,
      equipment,
      recentEvents,
      inventory
    });
  } catch (error) {
    // TODO: Remove console.log after development
    console.error("[API] Get campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 *
 * Delete campaign and all associated data
 *
 * Purpose:
 *   Permanently removes a campaign and all related data. This includes the campaign
 *   record, character, inventory items, and event logs. Uses database CASCADE to
 *   automatically clean up related records.
 *
 * URL Parameters:
 *   - id: Campaign ID (number)
 *
 * Response:
 *   {
 *     success: boolean;
 *     message: string;
 *   }
 *
 * Implementation:
 *   1. Validates campaign ID from URL parameter
 *   2. Verifies campaign exists (throws if not found)
 *   3. Deletes campaign record from database
 *   4. Database CASCADE automatically handles deletion of:
 *      - Character record (via campaign_id foreign key)
 *      - Character inventory items (via character_id foreign key)
 *      - Event logs (via campaign_id foreign key)
 *
 * Database Schema Dependencies:
 *   Requires ON DELETE CASCADE on foreign keys:
 *   - characters.campaign_id -> campaigns.id
 *   - character_items.character_id -> characters.id
 *   - logs.campaign_id -> campaigns.id
 *
 * Error Handling:
 *   - 400: Invalid campaign ID (not a number)
 *   - 500: Campaign not found or deletion failure
 *
 * Note:
 *   This is a hard delete. Consider implementing soft delete (state="deleted")
 *   for data recovery if needed in the future.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15 requires async params
) {
  try {
    // Extract and parse campaign ID from URL parameter
    const { id } = await context.params;
    const campaignId = parseInt(id);

    // Validate campaign ID is a valid number
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    // Delete campaign from database
    // This function:
    // 1. Verifies campaign exists (throws if not found)
    // 2. Deletes the campaign record
    // 3. Database CASCADE automatically deletes:
    //    - Character associated with this campaign
    //    - All items in character's inventory
    //    - All event logs for this campaign
    await BackendService.deleteCampaign(campaignId);

    // TODO: Remove console.log after development
    console.log(
      `[API] DELETE /api/campaigns/${campaignId} - Campaign and all associated data deleted successfully`
    );

    // Return success message
    return NextResponse.json({
      success: true,
      message: `Campaign ${campaignId} deleted successfully`
    });
  } catch (error) {
    // TODO: Remove console.log after development
    console.error("[API] Delete campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

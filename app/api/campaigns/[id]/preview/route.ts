/**
 * Campaign Preview API Route
 * ===========================
 *
 * GET /api/campaigns/[id]/preview
 * --------------------------------
 * Fetch preview data for a campaign to display on campaigns dashboard.
 *
 * Purpose:
 *   Provides data to show a campaign preview card without loading
 *   full game state
 *
 * Response:
 *   {
 *     success: boolean;
 *     preview: {
 *       campaign: Campaign;           // Basic campaign info
 *       character: Character;          // Character with stats
 *       equipment: Equipment;          // Current equipped items
 *       inventory: Item[];             // Full inventory array
 *       lastEvent: GameEvent | null;  // Most recent event for message display
 *       currentEventNumber: number;   // Turn/event counter
 *     };
 *     error?: string;
 *   }
 *
 * Implementation:
 *   1. Get campaign ID from URL params
 *   2. Load campaign from database
 *   3. Load character with equipment
 *   4. Get most recent event (1 event limit)
 *   5. Count inventory items
 *   6. Return preview data
 *
 * Error Responses:
 *   400 - Invalid campaign ID
 *   404 - Campaign not found
 *   500 - Server error
 */

import { NextRequest, NextResponse } from "next/server";
import * as BackendService from "@/lib/services/backend.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 },
      );
    }

    // Load campaign
    const campaign = await BackendService.getCampaign(campaignId);

    // Load character with full equipment data
    const { character, equipment, inventory } =
      await BackendService.getCharacterWithFullData(campaignId);

    // Get most recent event for last message
    const recentEvents = await BackendService.getRecentEvents(campaignId, 1);
    const lastEvent = recentEvents.length > 0 ? recentEvents[0] : null;

    // Get current event number from last event, or 0 if none
    const currentEventNumber = lastEvent ? lastEvent.eventNumber : 0;

    return NextResponse.json({
      success: true,
      preview: {
        campaign,
        character,
        equipment,
        inventory,
        lastEvent,
        currentEventNumber,
      },
    });
  } catch (error) {
    console.error("[API] Get campaign preview error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch campaign preview" },
      { status: 500 },
    );
  }
}

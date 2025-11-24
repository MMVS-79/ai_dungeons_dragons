import { NextResponse } from "next/server";
import * as BackendService from "@/lib/services/backend.service";

/**
 * GET /api/races
 *
 * List all race options for character creation
 *
 * Response:
 * {
 *   success: boolean;
 *   races: RaceRow[];
 *   error?: string;
 * }
 */

export async function GET() {
  try {
    const races = await BackendService.getAllRaces();

    return NextResponse.json({
      success: true,
      races: races,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch races",
      },
      { status: 500 },
    );
  }
}

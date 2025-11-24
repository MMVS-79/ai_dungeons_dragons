import { NextResponse } from "next/server";
import * as BackendService from "@/lib/services/backend.service";

/**
 * GET /api/classes
 *
 * List all class options for character creation
 *
 * Response:
 * {
 *   success: boolean;
 *   classes: ClassRow[];
 *   error?: string;
 * }
 */

export async function GET() {
  try {
    const classes = await BackendService.getAllClasses();

    return NextResponse.json({
      success: true,
      classes: classes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch classes",
      },
      { status: 500 },
    );
  }
}

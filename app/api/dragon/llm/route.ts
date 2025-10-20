import { NextResponse } from "next/server";
import { generateContent } from "@/utils/gemini/geminiClient";

export async function POST(req: Request) {
  let prompt: string;

  try {
    // Try parsing JSON first
    const body = await req.json().catch(() => null);
    if (body?.prompt) {
      prompt = body.prompt;
    } else {
      // Fallback: read raw text
      prompt = await req.text();
    }

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const responseText = await generateContent(prompt);
    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

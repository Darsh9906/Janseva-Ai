import { NextRequest, NextResponse } from "next/server";

import { inspectIssue } from "@/agents/civicInspector";
import { AIUnavailableError } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const analysis = await inspectIssue(image, mimeType || "image/jpeg");
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error(error);

    if (error instanceof AIUnavailableError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "The AI returned an unreadable result. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}

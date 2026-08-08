import { NextResponse } from "next/server";

import { askAssistant } from "@/agents/civicAssistant";
import { AIUnavailableError } from "@/services/gemini";
import type { Issue } from "@/types";

interface ChatBody {
  question?: string;
  issues?: Issue[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatBody;
    const question = (body.question ?? "").trim();
    const issues = Array.isArray(body.issues) ? body.issues : [];

    if (!question) {
      return NextResponse.json(
        { error: "A question is required." },
        { status: 400 }
      );
    }

    const answer = await askAssistant(question, issues);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);

    if (error instanceof AIUnavailableError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}

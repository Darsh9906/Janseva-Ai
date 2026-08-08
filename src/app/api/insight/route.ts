import { NextResponse } from "next/server";
import { generateInsights } from "@/agents/impactAnalytics";
import type { Issue } from "@/types";

export async function POST(req: Request) {
  try {
    const { issues } = (await req.json()) as { issues: Issue[] };
    const insights = await generateInsights(issues ?? []);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ insights: [] }, { status: 200 });
  }
}

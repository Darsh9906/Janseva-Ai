import { generateContent } from "@/services/gemini";
import type { Issue } from "@/types";

function parseStringArray(raw: string): string[] | null {
  if (!raw) return null;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^`(?:json)?/i, "").replace(/`$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    const strings = parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())  
      .filter(Boolean);
    return strings.length ? strings : null;
  } catch {
    return null;
  }
}

function tally(
  issues: Issue[],
  key: (i: Issue) => string
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of issues) {
    const k = key(i) || "Unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function topEntry(counts: Record<string, number>): [string, number] | null {
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function summarize(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "none";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

function localInsights(issues: Issue[]): string[] {
  if (!issues.length) return ["No issues have been reported yet."];

  const byCategory = tally(issues, (i) => i.category);
  const byStatus = tally(issues, (i) => i.status);
  const byArea = tally(issues, (i) => i.address?.trim() || "Unknown area");

  const insights: string[] = [];
  const topCat = topEntry(byCategory);

  if (topCat) {
    insights.push(
      `Most reported category: ${topCat[0]} (${topCat[1]} reports).`
    );
  }

  const resolved = byStatus["Resolved"] ?? 0;
  insights.push(
    `${resolved} of ${issues.length} issues are resolved (${Math.round(
      (resolved / issues.length) * 100
    )}%).`
  );

  const topArea = topEntry(byArea);
  if (topArea && topArea[0] !== "Unknown area") {
    insights.push(
      `Most affected area: ${topArea[0]} (${topArea[1]} reports).`
    );
  }

  insights.push(`Total reports tracked: ${issues.length}.`);
  return insights.slice(0, 4);
}

export async function generateInsights(issues: Issue[]): Promise<string[]> {
  if (!issues || issues.length === 0) {
    return ["No issues have been reported yet."];
  }

  try {
    const byCategory = tally(issues, (i) => i.category);
    const byStatus = tally(issues, (i) => i.status);
    const byArea = tally(issues, (i) => i.address?.trim() || "Unknown area");

    const prompt = `You are a civic data analyst for the "JanSeva" platform.

Summary of ${issues.length} reported issues:

- By category: ${summarize(byCategory)}
- By status: ${summarize(byStatus)}
- By area: ${summarize(byArea)}

Write exactly 4 short, specific, data-driven civic insight sentences based ONLY on
the numbers above. Each sentence should be useful to citizens or city officials.

Return ONLY a JSON array of 4 strings. No markdown, no code fences. Example:
["...", "...", "...", "..."]`;

    const res = await generateContent({ contents: prompt });
    const parsed = parseStringArray(res.text ?? "");

    if (parsed && parsed.length) return parsed.slice(0, 4);

    return localInsights(issues);
  } catch {
    return localInsights(issues);
  }
}
import { generateContent } from "@/services/gemini";
import type { Issue } from "@/types";

function relativeAge(createdAt: number, now: number): string {
  const diff = Math.max(0, now - createdAt);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function issueLine(issue: Issue, now: number): string {
  const area = issue.address?.trim() || "unknown area";
  return [
    `- "${issue.title}" [${issue.category}]`,
    `severity: ${issue.severity}`,
    `status: ${issue.status}`,
    `area: ${area}`,
    `confirms: ${issue.confirmCount ?? 0}`,
    `reported: ${relativeAge(issue.createdAt, now)}`,
  ].join(" | ");
}

export async function askAssistant(
  question: string,
  issues: Issue[]
): Promise<string> {
  const now = Date.now();
  const safeQuestion = (question ?? "").trim() || "What's happening nearby?";

  const context = issues
    .slice(0, 40)
    .map((i) => issueLine(i, now))
    .join("\n");

  const dataBlock =
    context.length > 0
      ? `Here is the current civic issues data (most recent first):\n${context}`
      : "There are currently NO issues reported in the data.";

  const prompt = `You are the "JanSeva Assistant", a helpful civic-issue guide for citizens.

${dataBlock}

Citizen's question:
${safeQuestion}

Answer the question grounded ONLY in the issues data above. Do not invent issues,
counts, dates, or locations that are not present in the data. If the data does not
contain the answer, say so plainly.

Rules:
- Reply in 2 to 5 short sentences.
- Friendly, clear, plain text only. NO markdown, NO headings, NO code blocks.
- You MAY use simple bullet lines that start with "•".
- If there are no issues, answer gracefully (e.g. "No issues reported yet...").`;

  const res = await generateContent({ contents: prompt });
  const text = (res.text ?? "").trim();
  return text || "No issues reported yet, so there's nothing to report right now.";
}
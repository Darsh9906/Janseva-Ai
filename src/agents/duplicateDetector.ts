import { generateContent } from "@/services/gemini";
import type { Issue } from "@/types";

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateOfId: string | null;
  confidence: number;
  reason: string;
}

export interface DuplicateCandidate {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
}

function parseJsonObject<T>(raw: string): T | null {
  if (!raw) return null;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

const SAFE_DEFAULT: DuplicateResult = {
  isDuplicate: false,
  duplicateOfId: null,
  confidence: 0,
  reason: "check skipped",
};

export async function detectDuplicate(
  candidate: DuplicateCandidate,
  nearby: Issue[]
): Promise<DuplicateResult> {
  if (!nearby || nearby.length === 0) {
    return {
      isDuplicate: false,
      duplicateOfId: null,
      confidence: 0,
      reason: "No nearby reports",
    };
  }

  try {
    const list = nearby
      .slice(0, 25)
      .map(
        (i) =>
          `- id: ${i.id} | category: ${i.category} | description: ${i.description}`
      )
      .join("\n");

    const prompt = `You are a duplicate-report detector for a civic issues platform.

A new report is being submitted:
- category: ${candidate.category}
- description: ${candidate.description}
- location: (${candidate.latitude}, ${candidate.longitude})

Existing NEARBY reports:
${list}

Decide whether the new report describes the SAME real-world problem as one of the
existing nearby reports (same category and clearly the same incident/object).

Return ONLY valid JSON, no markdown, no code fences, matching exactly:
{
  "isDuplicate": boolean,
  "duplicateOfId": string | null,
  "confidence": number,
  "reason": string
}

"confidence" is 0-100. "duplicateOfId" must be one of the existing ids above, or null.`;

    const res = await generateContent({ contents: prompt });
    const parsed = parseJsonObject<Partial<DuplicateResult>>(res.text ?? "");
    if (!parsed || typeof parsed.isDuplicate !== "boolean") {
      return { ...SAFE_DEFAULT };
    }

    const duplicateOfId =
      typeof parsed.duplicateOfId === "string" ? parsed.duplicateOfId : null;
    const confidence =
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(100, parsed.confidence))
        : 0;

    return {
      isDuplicate: parsed.isDuplicate,
      duplicateOfId: parsed.isDuplicate ? duplicateOfId : null,
      confidence,
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim()
          : "Analyzed against nearby reports",
    };
  } catch {
    return { ...SAFE_DEFAULT };
  }
}
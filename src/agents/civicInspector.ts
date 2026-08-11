import { generateContent } from "@/services/gemini";
import type { VisionAnalysis } from "@/types";

const CATEGORIES =
  "Pothole, Water Leakage, Streetlight, Waste Management, Road Damage, Drainage, Public Safety, Other";

export async function inspectIssue(
  base64Image: string,
  mimeType = "image/jpeg"
): Promise<VisionAnalysis> {
  const prompt = `
You are the JanSeva Vision Agent — think like a Municipal Engineer,
Urban Planner and Public Safety Officer.

Analyse the uploaded civic-issue image and return ONLY valid JSON (no markdown,
no code fences) with EXACTLY this schema:

{
  "category": "one of: ${CATEGORIES}",
  "severity": "Low | Medium | High | Critical",
  "department": "the responsible municipal department (e.g. Road Maintenance, Water Works, Sanitation, Electrical/Lighting)",
  "confidence": 0-100 integer,
  "title": "a short 3-7 word title for the issue",
  "description": "2-3 sentence factual description of what is visible and why it matters",
  "risk_score": 0-10 integer,
  "estimated_cost": "rough repair cost in INR, e.g. ₹15,000",
  "estimated_fix_time": "e.g. 3-5 days"
}

If the image shows no identifiable civic issue, use category "Other",
severity "Low", confidence below 40, and say so in the description.
`;

  const response = await generateContent({
    contents: [
      { inlineData: { mimeType, data: base64Image } },
      prompt,
    ],
  });

  const raw = (response.text ?? "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(raw) as VisionAnalysis;
  parsed.confidence = Number(parsed.confidence) || 0;
  parsed.risk_score = Number(parsed.risk_score) || 0;
  return parsed;
}
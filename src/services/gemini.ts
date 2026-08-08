import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Model fallback chain. The agents call generateContent() without a model;
// it tries these in order. Each is a separate capacity + free-tier quota pool,
// so when the primary is overloaded (503) or rate-limited (429), the next one
// usually still answers.
// NOTE: keep these current — older ids like "gemini-1.5-flash" are retired
// (404), and "gemini-2.0-flash" has limit:0 (no free quota) on this project.
// Model fallback chain. The agents call generateContent() without a model;
// it tries these in order. Each is a separate capacity + free-tier quota pool,
// so when one is overloaded (503) or rate-limited (429), the next usually
// still answers. Ordered fastest-recovering last so we end on a quick model.
// NOTE: keep these current — older ids like "gemini-1.5-flash" are retired
// (404), and "gemini-2.0-flash" has limit:0 (no free quota) on this project.
export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];
export const GEMINI_MODEL = GEMINI_MODELS[0];

type GenerateParams = Parameters<typeof ai.models.generateContent>[0];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Thrown when the AI is temporarily unreachable across the whole fallback
 * chain — either rate-limited (429) or overloaded (503). Carries the HTTP
 * status and user-facing message the API routes should return.
 */
export class AIUnavailableError extends Error {
  status: number;
  retryAfter: number;
  constructor(status: number, retryAfter: number, message: string) {
    super(message);
    this.name = "AIUnavailableError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const retryAfterFrom = (err: unknown) => {
  const m = ((err as Error)?.message ?? "").match(/retry in ([\d.]+)s/i);
  return m ? Math.ceil(Number(m[1])) : 30;
};

/**
 * generateContent with two layers of resilience:
 *  1. One quick retry per model on transient 503 ("high demand").
 *  2. Fallback across GEMINI_MODELS on persistent 503 or 429 (separate pools).
 * If the entire chain is unavailable, throws AIUnavailableError so routes can
 * return a clear "busy, try again" message instead of a generic 500.
 * If a caller passes an explicit `model`, only that one is used.
 */
export async function generateContent(
  params: Omit<GenerateParams, "model"> & { model?: string },
  retriesPerModel = 1
) {
  const models = params.model ? [params.model] : GEMINI_MODELS;
  let lastStatus: number | undefined;
  let lastError: unknown;
  let lastRetryAfter = 30;

  for (const model of models) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model,
        } as GenerateParams);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        lastError = err;
        lastStatus = status;
        if (status === 429) {
          // per-minute/day quota — won't clear fast; try the next model.
          lastRetryAfter = retryAfterFrom(err);
          break;
        }
        if (status === 503 && attempt < retriesPerModel) {
          // transient capacity spike — brief backoff, then retry same model.
          await sleep(600);
          continue;
        }
        if (status === 503) break; // still overloaded — fall back to next model
        throw err; // non-retryable (400, 404, etc.)
      }
    }
  }

  if (lastStatus === 429) {
    throw new AIUnavailableError(
      429,
      lastRetryAfter,
      `AI quota reached. Please try again in ~${lastRetryAfter}s.`
    );
  }
  if (lastStatus === 503) {
    throw new AIUnavailableError(
      503,
      10,
      "The AI service is briefly overloaded. Please try again in a moment."
    );
  }
  throw lastError;
}

export default ai;

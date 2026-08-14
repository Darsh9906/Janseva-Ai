import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];
export const GEMINI_MODEL = GEMINI_MODELS[0];

type GenerateParams = Parameters<typeof ai.models.generateContent>[0];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


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
          
          lastRetryAfter = retryAfterFrom(err);
          break;
        }
        if (status === 503 && attempt < retriesPerModel) {
          
          await sleep(600);
          continue;
        }
        if (status === 503) break; 
        throw err; 
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

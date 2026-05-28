import { GoogleGenerativeAI } from "@google/generative-ai";

import { env, hasGeminiEnv } from "@/lib/env";

export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

export async function createEmbedding(text: string): Promise<number[]> {
  if (!hasGeminiEnv || !env.geminiApiKey) {
    throw new Error("Gemini API key not configured for embeddings.");
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

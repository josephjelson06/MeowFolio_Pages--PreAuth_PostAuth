import OpenAI from "openai";
import type { z } from "zod";
import type { AiServiceHealth } from "../../src/types/ai";
import { loadServerEnv } from "./env";

loadServerEnv();

type TextProviderName = "groq";

interface TextProviderConfig {
  client: OpenAI;
  model: string;
  provider: TextProviderName;
}

interface EmbeddingProviderConfig {
  client: OpenAI;
  model: string;
}

function getConfiguredProvider() {
  return process.env.AI_PROVIDER?.trim().toLowerCase();
}

function getGroqTextProvider(): TextProviderConfig | null {
  const apiKey =
    process.env.GROQ_API_KEY?.trim() ||
    process.env.GROQ_API_KEY_2?.trim() ||
    process.env.GROQ_API_KEY_3?.trim();

  if (!apiKey) {
    return null;
  }

  return {
    client: new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    }),
    model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    provider: "groq"
  };
}

function resolveTextProvider(): TextProviderConfig | null {
  const configuredProvider = getConfiguredProvider();

  if (configuredProvider && configuredProvider !== "groq") {
    return null;
  }

  return getGroqTextProvider();
}

function resolveEmbeddingProvider(): EmbeddingProviderConfig | null {
  return null;
}

export function extractJsonObject(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("The AI response did not contain valid JSON.");
}

export function getAiServiceHealth(): AiServiceHealth {
  const textProvider = resolveTextProvider();
  const embeddingProvider = resolveEmbeddingProvider();

  return {
    configured: Boolean(textProvider),
    embeddingProvider: "none",
    provider: textProvider?.provider ?? "none",
    textModel: textProvider?.model ?? null
  };
}

export async function generateJsonText({
  system,
  temperature = 0.1,
  user
}: {
  system: string;
  temperature?: number;
  user: string;
}) {
  const provider = resolveTextProvider();

  if (!provider) {
    return null;
  }

  const completion = await provider.client.chat.completions.create({
    model: provider.model,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: user
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("The AI response was empty.");
  }

  return {
    content,
    modelUsed: provider.model,
    provider: provider.provider
  };
}

export async function generateStructuredObject<T>({
  schema,
  system,
  user
}: {
  schema: z.ZodType<T>;
  system: string;
  user: string;
}) {
  const raw = await generateJsonText({
    system,
    user
  });

  if (!raw) {
    return null;
  }

  const parsed = schema.parse(JSON.parse(extractJsonObject(raw.content)));

  return {
    modelUsed: raw.modelUsed,
    provider: raw.provider,
    value: parsed
  };
}

export async function createEmbeddings(inputs: string[]) {
  const provider = resolveEmbeddingProvider();

  if (!provider || inputs.length === 0) {
    return null;
  }

  const response = await provider.client.embeddings.create({
    model: provider.model,
    input: inputs
  });

  return {
    modelUsed: provider.model,
    provider: "openai" as const,
    vectors: response.data.map((item) => item.embedding)
  };
}

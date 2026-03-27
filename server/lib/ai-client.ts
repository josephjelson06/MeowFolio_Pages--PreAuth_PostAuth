import type { z } from "zod";
import type { AiServiceHealth } from "../../src/types/ai";
import { loadServerEnv } from "./env";

loadServerEnv();

type TextProviderName = "groq";

interface TextProviderConfig {
  apiKey: string;
  model: string;
  provider: TextProviderName;
}

interface GenerateJsonTextInput {
  debugLabel?: string;
  system: string;
  temperature?: number;
  user: string;
}

function getConfiguredProvider() {
  return process.env.AI_PROVIDER?.trim().toLowerCase();
}

function getGroqTextProvider(): TextProviderConfig | null {
  const apiKey = process.env.GROQ_API_KEY?.trim() || process.env.GROQ_API_KEY_2?.trim() || process.env.GROQ_API_KEY_3?.trim();

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
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

function shouldLogAiDebug() {
  const value = process.env.AI_DEBUG_LOGS?.trim().toLowerCase();
  return value !== "false";
}

function estimateTokens(value: string) {
  // Quick rough estimate for operational logging (not billing-accurate).
  return Math.ceil(value.length / 4);
}

function extractRateLimitHeaders(response: Response) {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (normalized.startsWith("x-ratelimit-") || normalized === "retry-after") {
      headers[key] = value;
    }
  });
  return headers;
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

  return {
    configured: Boolean(textProvider),
    embeddingProvider: "none",
    provider: textProvider?.provider ?? "none",
    textModel: textProvider?.model ?? null
  };
}

export async function generateJsonText({
  debugLabel = "ai-json",
  system,
  temperature = 0.1,
  user
}: GenerateJsonTextInput) {
  const provider = resolveTextProvider();

  if (!provider) {
    return null;
  }

  const requestTokenEstimate = estimateTokens(system) + estimateTokens(user);

  if (shouldLogAiDebug()) {
    console.log(
      `[ai-client] request ${debugLabel} provider=${provider.provider} model=${provider.model} estimated_tokens=${requestTokenEstimate} system_chars=${system.length} user_chars=${user.length}`
    );
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: system
        },
        {
          role: "user",
          content: user
        }
      ],
      model: provider.model,
      response_format: { type: "json_object" },
      temperature
    })
  });

  const rateHeaders = extractRateLimitHeaders(response);

  if (shouldLogAiDebug()) {
    console.log(`[ai-client] response ${debugLabel} status=${response.status} rate_headers=${JSON.stringify(rateHeaders)}`);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Groq request failed with ${response.status}: ${detail}${
        Object.keys(rateHeaders).length > 0 ? ` | rate_headers=${JSON.stringify(rateHeaders)}` : ""
      }`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content;

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
  debugLabel,
  schema,
  system,
  user
}: {
  debugLabel?: string;
  schema: z.ZodType<T>;
  system: string;
  user: string;
}) {
  const raw = await generateJsonText({
    debugLabel,
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

export async function createEmbeddings(_inputs: string[]) {
  return null;
}

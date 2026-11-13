import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const AGENT_MODEL = "claude-opus-5-5";
// Prezzi Claude Opus 5.5 in $ per milione di token (input, output, lettura cache).
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };

export type AgentUsage = { inputTokens: number; outputTokens: number; costUsd: number };

/**
 * Una chiamata a Claude con risposta JSON validata dallo schema Zod.
 * Fallback lato server attivo: se Opus rifiuta, la stessa richiesta passa al
 * modello di riserva scelto da Anthropic invece di fallire.
 */
export async function askClaude<T extends z.ZodType>(
  system: string,
  input: unknown,
  schema: T,
  opts: { effort?: "low" | "medium"; maxTokens?: number } = {},
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non impostata");
  const client = new Anthropic({ apiKey, timeout: 240_000 });

  const response = await client.beta.messages.parse({
    model: AGENT_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: JSON.stringify(input, null, 1) }],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude ha rifiutato la richiesta");
  if (response.stop_reason === "max_tokens") throw new Error("Risposta troncata (max_tokens)");
  if (!response.parsed_output) throw new Error("Risposta non conforme allo schema");

  const u = response.usage;
  const inputTokens = u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  const costUsd =
    (u.input_tokens * PRICE.input +
      (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
      (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite +
      u.output_tokens * PRICE.output) /
    1_000_000;

  return {
    data: response.parsed_output as z.infer<T>,
    model: response.model,
    usage: { inputTokens, outputTokens: u.output_tokens, costUsd } satisfies AgentUsage,
  };
}

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "./supabase";

// Cost per million tokens (USD) — as of Feb 2026
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
};

function getCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model] ?? { input: 3, output: 15 };
  const costUsd =
    (inputTokens / 1_000_000) * costs.input +
    (outputTokens / 1_000_000) * costs.output;
  return Math.round(costUsd * 100 * 100) / 100; // cents, 2 decimal places
}

/** Log a Claude API call to the usage_logs table */
export async function logUsage(opts: {
  userId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  operation: string;
  funnelId?: string;
}) {
  try {
    const sb = createServiceClient();
    const costCents = getCostCents(opts.model, opts.inputTokens, opts.outputTokens);
    await sb.from("usage_logs").insert({
      user_id: opts.userId ?? null,
      model: opts.model,
      input_tokens: opts.inputTokens,
      output_tokens: opts.outputTokens,
      cost_cents: costCents,
      operation: opts.operation,
      funnel_id: opts.funnelId ?? null,
    });
  } catch {
    // Table might not exist yet — fail silently
  }
}

// ── Async context for userId/funnelId ───────────────────────────────

let _currentUserId: string | undefined;
let _currentFunnelId: string | undefined;
let _currentOperation: string = "unknown";

export function setUsageContext(opts: {
  userId?: string;
  funnelId?: string;
  operation?: string;
}) {
  _currentUserId = opts.userId;
  _currentFunnelId = opts.funnelId;
  if (opts.operation) _currentOperation = opts.operation;
}

// ── Wrapped Anthropic client that auto-logs usage ───────────────────

const _rawClient = new Anthropic();

function createLoggingClient(): Anthropic {
  const handler: ProxyHandler<typeof _rawClient.messages> = {
    get(target, prop, receiver) {
      if (prop === "create") {
        return async (...args: Parameters<typeof target.create>) => {
          const result = await target.create(...args);
          // Extract usage from response
          const msg = result as Anthropic.Message;
          if (msg.usage) {
            const model = (args[0] as { model?: string })?.model ?? "unknown";
            logUsage({
              userId: _currentUserId,
              model,
              inputTokens: msg.usage.input_tokens,
              outputTokens: msg.usage.output_tokens,
              operation: _currentOperation,
              funnelId: _currentFunnelId,
            });
          }
          return result;
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  };

  const proxy = new Proxy(_rawClient, {
    get(target, prop, receiver) {
      if (prop === "messages") {
        return new Proxy(target.messages, handler);
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return proxy;
}

export const anthropicClient = createLoggingClient();

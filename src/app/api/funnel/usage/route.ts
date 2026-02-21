import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sb = createServiceClient();

  try {
    // Get aggregated usage stats
    const { data: logs } = await sb
      .from("usage_logs")
      .select("model, input_tokens, output_tokens, cost_cents, operation, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostCents: 0,
        callCount: 0,
        byOperation: {},
        byModel: {},
        recentCalls: [],
      });
    }

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostCents = 0;
    const byOperation: Record<string, { calls: number; costCents: number }> = {};
    const byModel: Record<string, { calls: number; costCents: number; inputTokens: number; outputTokens: number }> = {};

    for (const log of logs) {
      totalInputTokens += log.input_tokens;
      totalOutputTokens += log.output_tokens;
      totalCostCents += log.cost_cents;

      const op = log.operation || "unknown";
      if (!byOperation[op]) byOperation[op] = { calls: 0, costCents: 0 };
      byOperation[op].calls++;
      byOperation[op].costCents += log.cost_cents;

      const model = log.model || "unknown";
      if (!byModel[model]) byModel[model] = { calls: 0, costCents: 0, inputTokens: 0, outputTokens: 0 };
      byModel[model].calls++;
      byModel[model].costCents += log.cost_cents;
      byModel[model].inputTokens += log.input_tokens;
      byModel[model].outputTokens += log.output_tokens;
    }

    return NextResponse.json({
      totalInputTokens,
      totalOutputTokens,
      totalCostCents: Math.round(totalCostCents * 100) / 100,
      callCount: logs.length,
      byOperation,
      byModel,
      recentCalls: logs.slice(0, 20).map((l) => ({
        model: l.model,
        operation: l.operation,
        inputTokens: l.input_tokens,
        outputTokens: l.output_tokens,
        costCents: l.cost_cents,
        createdAt: l.created_at,
      })),
    });
  } catch {
    // Table might not exist
    return NextResponse.json({
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostCents: 0,
      callCount: 0,
      byOperation: {},
      byModel: {},
      recentCalls: [],
    });
  }
}

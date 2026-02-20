import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import {
  getExperiment,
  concludeExperiment,
  getPageSourceCode,
  upsertFunnelPage,
} from "@/lib/funnel-db";

let lastConcludeTime = 0;
const RATE_LIMIT_MS = 15_000;

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastConcludeTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastConcludeTime)) / 1000
    );
    return NextResponse.json(
      { error: `Rate limited. Try again in ${waitSec}s.` },
      { status: 429 }
    );
  }

  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { experimentId, winner } = body;

    if (!experimentId || !winner) {
      return NextResponse.json(
        { error: "Missing experimentId or winner" },
        { status: 400 }
      );
    }

    if (winner !== "control" && winner !== "test") {
      return NextResponse.json(
        { error: "Winner must be 'control' or 'test'" },
        { status: 400 }
      );
    }

    // 1. Find the experiment
    const result = await getExperiment(experimentId);
    if (!result) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    const { experiment, funnelId } = result;

    if (experiment.status === "concluded") {
      return NextResponse.json(
        { error: "Experiment already concluded" },
        { status: 409 }
      );
    }

    // 2. If test wins, copy test code to control slot
    if (winner === "test") {
      const testCode = await getPageSourceCode(funnelId, experiment.testComponent);
      if (testCode) {
        const fixedCode = testCode.replace(
          new RegExp(`\\b${experiment.testComponent}\\b`, "g"),
          experiment.controlComponent
        );
        await upsertFunnelPage(funnelId, experiment.controlComponent, 0, fixedCode);
      }
    }

    // 3. Mark experiment concluded
    await concludeExperiment(experimentId, winner);

    lastConcludeTime = Date.now();

    return NextResponse.json({
      status: "ok",
      experimentId,
      winner,
    });
  } catch (err) {
    console.error("Experiment conclude error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to conclude experiment",
      },
      { status: 500 }
    );
  }
}

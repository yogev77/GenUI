import { NextResponse } from "next/server";
import { improveFunnelPage } from "@/lib/funnel-claude";
import { createAuthClient } from "@/lib/supabase-server";
import { setUsageContext } from "@/lib/usage";
import {
  getFunnel,
  getEvents,
  getPageSourceCode,
  getRunningExperiment,
  countPastExperiments,
  createImprovementLog,
  createExperiment,
  upsertFunnelPage,
} from "@/lib/funnel-db";

export const maxDuration = 120;

let lastImproveTime = 0;
const RATE_LIMIT_MS = 60_000;

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastImproveTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastImproveTime)) / 1000
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

  setUsageContext({ userId: user.id, operation: "improve_page" });

  try {
    const body = await request.json();
    const { funnelId, pageName } = body;

    if (!funnelId || !pageName) {
      return NextResponse.json(
        { error: "Missing funnelId or pageName" },
        { status: 400 }
      );
    }

    // 1. Read funnel config
    const funnel = await getFunnel(funnelId);
    if (!funnel) {
      return NextResponse.json(
        { error: `Funnel "${funnelId}" not found` },
        { status: 404 }
      );
    }

    // Check for existing running experiment on this page
    const existingExp = await getRunningExperiment(funnelId, pageName);
    if (existingExp) {
      return NextResponse.json(
        { error: `An experiment is already running for "${pageName}". Conclude it first.` },
        { status: 409 }
      );
    }

    // 2. Read existing page code from DB
    const existingCode = await getPageSourceCode(funnelId, pageName);
    if (!existingCode) {
      return NextResponse.json(
        { error: `Page "${pageName}" source code not found` },
        { status: 404 }
      );
    }

    // 3. Read recent events
    const allEvents = await getEvents(funnelId);
    const recentEvents = allEvents.slice(0, 100);

    // 4. Improve with Claude
    const improved = await improveFunnelPage(
      pageName,
      existingCode,
      funnel.kpis,
      recentEvents
    );

    // Prepend @ts-nocheck
    if (!improved.code.includes("@ts-nocheck")) {
      improved.code = "// @ts-nocheck\n" + improved.code;
    }

    // 5. Determine version number for test variant
    const pastCount = await countPastExperiments(funnelId, pageName);
    const version = pastCount + 1;
    const testComponentName = `${pageName}_v${version}`;

    // 6. Record improvement log
    await createImprovementLog({
      funnelId,
      version: (funnel.logs?.length ?? 0) + 1,
      pageName,
      reasoning: improved.reasoning,
      kpiSnapshot: { ...funnel.kpis },
    });

    // 7. Store test variant source code in DB
    await upsertFunnelPage(funnelId, testComponentName, 99 + version, improved.code);

    // 8. Create experiment
    const experiment = await createExperiment({
      id: `${funnelId}-${pageName}-v${version}`,
      funnelId,
      pageName,
      controlComponent: pageName,
      testComponent: testComponentName,
    });

    lastImproveTime = Date.now();

    return NextResponse.json({
      page: pageName,
      testVariant: testComponentName,
      experimentId: experiment.id,
      reasoning: improved.reasoning,
    });
  } catch (err) {
    console.error("Funnel improve error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to improve page",
      },
      { status: 500 }
    );
  }
}

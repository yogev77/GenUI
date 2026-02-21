import { NextResponse } from "next/server";
import { generateExperimentIdeas } from "@/lib/funnel-claude";
import { createAuthClient } from "@/lib/supabase-server";
import { setUsageContext } from "@/lib/usage";
import { getFunnel, getEvents } from "@/lib/funnel-db";

export async function POST(request: Request) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  setUsageContext({ userId: user.id, operation: "experiment_ideas" });

  try {
    const { funnelId } = await request.json();
    if (!funnelId) {
      return NextResponse.json(
        { error: "Missing funnelId" },
        { status: 400 }
      );
    }

    const funnel = await getFunnel(funnelId);
    if (!funnel) {
      return NextResponse.json(
        { error: `Funnel "${funnelId}" not found` },
        { status: 404 }
      );
    }

    if (funnel.kpis.totalVisitors < 5) {
      return NextResponse.json({ ideas: [] });
    }

    const allEvents = await getEvents(funnelId);
    const recentEvents = allEvents.slice(0, 100);

    const ideas = await generateExperimentIdeas(
      funnel.pages,
      funnel.kpis,
      recentEvents
    );

    return NextResponse.json({ ideas });
  } catch (err) {
    console.error("Experiment ideas error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate ideas",
      },
      { status: 500 }
    );
  }
}

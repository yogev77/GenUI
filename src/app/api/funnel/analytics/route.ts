import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const funnelId = url.searchParams.get("funnelId");

  if (!funnelId) {
    return NextResponse.json({ error: "Missing funnelId" }, { status: 400 });
  }

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const sb = createServiceClient();

    // Get ordered pages
    const { data: pages } = await sb
      .from("funnel_pages")
      .select("component_name, page_order")
      .eq("funnel_id", funnelId)
      .order("page_order");

    if (!pages || pages.length === 0) {
      return NextResponse.json({ steps: [], summary: null });
    }

    // Get all events for this funnel
    const { data: events } = await sb
      .from("funnel_events")
      .select("page_name, session_id, visitor_id, type")
      .eq("funnel_id", funnelId);

    const allEvents = events || [];

    // Aggregate per page
    const steps = pages.map((page, i) => {
      const pageEvents = allEvents.filter(
        (e) => e.page_name === page.component_name
      );

      const visitorSet = new Set(
        pageEvents
          .filter((e) => e.type === "page_view")
          .map((e) => e.visitor_id || e.session_id)
      );
      const visitors = visitorSet.size;
      const ctaClicks = pageEvents.filter(
        (e) => e.type === "cta_click"
      ).length;
      const emails = pageEvents.filter(
        (e) => e.type === "email_capture"
      ).length;
      const purchases = pageEvents.filter(
        (e) => e.type === "purchase"
      ).length;

      return {
        pageName: page.component_name,
        pageOrder: page.page_order,
        visitors,
        ctaClicks,
        emails,
        purchases,
        dropOffPct: 0,
        conversionPct: 0,
      };
    });

    // Unique visitors across ALL pages (for rates)
    const allUniqueVisitors = new Set(
      allEvents
        .filter((e) => e.type === "page_view")
        .map((e) => e.visitor_id || e.session_id)
    );
    const totalUniqueVisitors = allUniqueVisitors.size;

    // Calculate drop-off and conversion percentages
    // conversionPct is relative to first step (funnel progression)
    const firstStepVisitors = steps[0]?.visitors || 0;
    for (let i = 0; i < steps.length; i++) {
      steps[i].conversionPct =
        firstStepVisitors > 0
          ? Math.round((steps[i].visitors / firstStepVisitors) * 100)
          : 0;
      if (i > 0) {
        const prev = steps[i - 1].visitors;
        steps[i].dropOffPct =
          prev > 0
            ? Math.round(((prev - steps[i].visitors) / prev) * 100)
            : 0;
      }
    }

    const totalPurchases = steps.reduce((sum, s) => sum + s.purchases, 0);

    return NextResponse.json({
      steps,
      summary: {
        totalVisitors: totalUniqueVisitors,
        totalPurchases,
        overallConversion:
          totalUniqueVisitors > 0
            ? Math.round((totalPurchases / totalUniqueVisitors) * 100)
            : 0,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load analytics",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { listFunnels, getFunnel, getFunnelByPageName } from "@/lib/funnel-db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lookup = url.searchParams.get("lookup");
  const funnelIdParam = url.searchParams.get("funnelId");

  // Public lookup: find funnelId for a page name (no auth required)
  if (lookup) {
    try {
      const funnel = await getFunnelByPageName(lookup);
      return NextResponse.json({ funnelId: funnel?.id ?? null });
    } catch {
      return NextResponse.json({ funnelId: null });
    }
  }

  // Public single-funnel query (for variant routing)
  if (funnelIdParam) {
    try {
      const funnel = await getFunnel(funnelIdParam);
      if (funnel) {
        return NextResponse.json({ funnel });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Full list: auth required (owner dashboard)
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const funnels = await listFunnels();
    return NextResponse.json({ funnels });
  } catch (err) {
    console.error("Funnel list error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list funnels" },
      { status: 500 }
    );
  }
}

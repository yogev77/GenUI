import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { getVisitors } from "@/lib/funnel-db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const funnelId = url.searchParams.get("funnelId");

  if (!funnelId) {
    return NextResponse.json({ error: "Missing funnelId" }, { status: 400 });
  }

  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const visitors = await getVisitors(funnelId);
    return NextResponse.json({ visitors });
  } catch (err) {
    console.error("Visitors error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load visitors" },
      { status: 500 }
    );
  }
}

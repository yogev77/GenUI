import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { getFunnel, restoreFunnel } from "@/lib/funnel-db";

export async function POST(request: Request) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { funnelId } = body;

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

    if (!funnel.hidden) {
      return NextResponse.json({ status: "ok", action: "already_active", funnelId });
    }

    await restoreFunnel(funnelId);
    return NextResponse.json({ status: "ok", action: "restored", funnelId });
  } catch (err) {
    console.error("Funnel restore error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to restore funnel",
      },
      { status: 500 }
    );
  }
}

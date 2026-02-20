import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { getFunnel, hideFunnel, deleteFunnelPermanently } from "@/lib/funnel-db";

let lastActionTime = 0;
const RATE_LIMIT_MS = 5_000;

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastActionTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastActionTime)) / 1000
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
    const { funnelId, permanent } = body;

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

    if (permanent) {
      await deleteFunnelPermanently(funnelId);
      lastActionTime = Date.now();
      return NextResponse.json({ status: "ok", action: "deleted", deletedId: funnelId });
    }

    // Soft hide
    await hideFunnel(funnelId);
    lastActionTime = Date.now();
    return NextResponse.json({ status: "ok", action: "hidden", funnelId });
  } catch (err) {
    console.error("Funnel delete error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to delete funnel",
      },
      { status: 500 }
    );
  }
}

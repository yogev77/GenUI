import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { getFunnel, updateFunnelProductInfo, replaceFunnelPages } from "@/lib/funnel-db";
import type { PageSpec } from "@/lib/funnel-types";

let lastBriefTime = 0;
const RATE_LIMIT_MS = 15_000;

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastBriefTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastBriefTime)) / 1000
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
    const { funnelId, productInfo, pageSpecs, designNotes } = body as {
      funnelId: string;
      productInfo: import("@/lib/funnel-claude").ProductInfo;
      pageSpecs?: PageSpec[];
      designNotes?: string;
    };

    if (!funnelId || !productInfo) {
      return NextResponse.json(
        { error: "Missing funnelId or productInfo" },
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

    // Store designNotes in style if provided
    if (designNotes && productInfo.style) {
      productInfo.style.styleNotes = designNotes;
    }

    await updateFunnelProductInfo(funnelId, productInfo);

    // Replace pages if new pageSpecs provided
    if (pageSpecs?.length) {
      const slug = funnel.id.replace(/-[a-z0-9]{6}$/, "");
      const pascal = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");

      const pages = pageSpecs.map((spec) => ({
        componentName: `${pascal}${spec.componentSuffix}`,
        pageSpec: spec,
      }));
      await replaceFunnelPages(funnelId, pages);
    }

    // Return updated funnel
    const updated = await getFunnel(funnelId);

    lastBriefTime = Date.now();
    return NextResponse.json({ status: "ok", funnel: updated });
  } catch (err) {
    console.error("Brief update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update brief" },
      { status: 500 }
    );
  }
}

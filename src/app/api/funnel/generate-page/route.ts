import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { getFunnel, upsertFunnelPage, getPageSpec } from "@/lib/funnel-db";
import { generateSinglePage, generatePageFromSpec, FUNNEL_PAGE_TYPES } from "@/lib/funnel-claude";
import type { FunnelPageType } from "@/lib/funnel-claude";

export const maxDuration = 60;

// Legacy 4-page funnels: landing, email(→landing fallback), checkout, thankyou
const LEGACY_PAGE_TYPES: FunnelPageType[] = ["landing", "landing", "checkout", "thankyou"];

export async function POST(request: Request) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { funnelId, pageIndex } = await request.json();

    if (!funnelId || pageIndex == null || pageIndex < 0) {
      return NextResponse.json(
        { error: "Invalid funnelId or pageIndex" },
        { status: 400 }
      );
    }

    const funnel = await getFunnel(funnelId);
    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    if (pageIndex >= funnel.pages.length) {
      return NextResponse.json(
        { error: `pageIndex ${pageIndex} out of range (0-${funnel.pages.length - 1})` },
        { status: 400 }
      );
    }

    const componentName = funnel.pages[pageIndex];
    if (!componentName) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check for page_spec (brief-based generation)
    const spec = await getPageSpec(funnelId, componentName);
    const hasNextUrl = pageIndex < funnel.pages.length - 1;

    let result: { componentName: string; code: string };

    if (spec) {
      // Spec-based generation from FunnelBrief
      const designNotes = funnel.productInfo.style?.styleNotes ?? "";
      result = await generatePageFromSpec(
        funnel.productInfo,
        componentName,
        spec,
        designNotes
      );
    } else {
      // Legacy type-based generation
      const isLegacy4Page = funnel.pages.length === 4;
      const pageType: FunnelPageType = isLegacy4Page
        ? (LEGACY_PAGE_TYPES[pageIndex] ?? FUNNEL_PAGE_TYPES[pageIndex])
        : FUNNEL_PAGE_TYPES[pageIndex];

      result = await generateSinglePage(
        funnel.productInfo,
        componentName,
        pageType,
        hasNextUrl
      );
    }

    let code = result.code;
    if (!code.includes("@ts-nocheck")) {
      code = "// @ts-nocheck\n" + code;
    }

    await upsertFunnelPage(funnelId, componentName, pageIndex, code);

    return NextResponse.json({
      componentName,
      pageIndex,
      status: "ok",
    });
  } catch (err) {
    console.error("Generate page error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}

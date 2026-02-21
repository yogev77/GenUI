import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import {
  getFunnel,
  upsertFunnelPage,
  getPageSpec,
  getAllUngeneratedPages,
} from "@/lib/funnel-db";
import {
  generateSinglePage,
  generatePageFromSpec,
  FUNNEL_PAGE_TYPES,
} from "@/lib/funnel-claude";
import type { FunnelPageType } from "@/lib/funnel-claude";
import { createServiceClient } from "@/lib/supabase";
import { setUsageContext } from "@/lib/usage";

export const maxDuration = 300;

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "";
const BATCH_SIZE = 5; // Generate 5 pages concurrently per invocation

const LEGACY_PAGE_TYPES: FunnelPageType[] = ["landing", "landing", "checkout", "thankyou"];

/** Store generation error — tries both funnel_pages column AND generation_logs table */
async function storePageError(funnelId: string, componentName: string, error: string) {
  const sb = createServiceClient();
  try {
    await sb
      .from("funnel_pages")
      .update({ generation_error: error })
      .eq("funnel_id", funnelId)
      .eq("component_name", componentName);
  } catch {
    // Column might not exist yet
  }
  try {
    await sb.from("generation_logs").insert({
      funnel_id: funnelId,
      page_name: componentName,
      error,
    });
  } catch {
    // Table might not exist yet
  }
}

/** Clear generation error on success */
async function clearPageError(funnelId: string, componentName: string) {
  try {
    const sb = createServiceClient();
    await sb
      .from("funnel_pages")
      .update({ generation_error: null })
      .eq("funnel_id", funnelId)
      .eq("component_name", componentName);
  } catch {
    // Column might not exist yet
  }
}

async function generateOnePage(
  funnelId: string,
  componentName: string,
  pageOrder: number,
  totalPages: number,
  productInfo: Parameters<typeof generatePageFromSpec>[0],
  spec: Awaited<ReturnType<typeof getPageSpec>>
): Promise<{ generated: boolean; componentName: string; error?: string }> {
  const hasNextUrl = pageOrder < totalPages - 1;

  let result: { componentName: string; code: string };

  try {
    if (spec) {
      const designNotes = productInfo.style?.styleNotes ?? "";
      result = await generatePageFromSpec(
        productInfo,
        componentName,
        spec,
        designNotes
      );
    } else {
      const isLegacy4Page = totalPages === 4;
      const pageType: FunnelPageType = isLegacy4Page
        ? (LEGACY_PAGE_TYPES[pageOrder] ?? FUNNEL_PAGE_TYPES[pageOrder])
        : FUNNEL_PAGE_TYPES[pageOrder];

      result = await generateSinglePage(
        productInfo,
        componentName,
        pageType,
        hasNextUrl
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown generation error";
    console.error(`[generate-all] Claude error for ${componentName}:`, msg);
    await storePageError(funnelId, componentName, msg);
    return { generated: false, componentName, error: msg };
  }

  let code = result.code;
  if (!code.includes("@ts-nocheck")) {
    code = "// @ts-nocheck\n" + code;
  }

  await upsertFunnelPage(funnelId, componentName, pageOrder, code);
  await clearPageError(funnelId, componentName);
  return { generated: true, componentName };
}


export async function POST(request: Request) {
  const isInternal =
    INTERNAL_SECRET &&
    request.headers.get("x-internal-key") === INTERNAL_SECRET;

  let userId: string | undefined;
  if (!isInternal) {
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    userId = user.id;
  }

  try {
    const body = await request.json();
    const { funnelId, _userId } = body as { funnelId: string; _userId?: string };

    if (!funnelId) {
      return NextResponse.json({ error: "Missing funnelId" }, { status: 400 });
    }

    const funnel = await getFunnel(funnelId);
    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    const totalPages = funnel.pages.length;
    const remaining = await getAllUngeneratedPages(funnelId);

    if (remaining.length === 0) {
      return NextResponse.json({
        generating: false,
        pagesReady: totalPages,
        totalPages,
      });
    }

    // Set usage context for logging
    const effectiveUserId = userId ?? _userId;
    setUsageContext({ userId: effectiveUserId, funnelId, operation: "generate_page" });

    // Generate all remaining pages in batches within this single request
    let totalGenerated = 0;
    const allErrors: { page: string; error: string }[] = [];
    let toGenerate = remaining;

    while (toGenerate.length > 0) {
      const batch = toGenerate.slice(0, BATCH_SIZE);

      // Fetch all specs in parallel
      const specs = await Promise.all(
        batch.map((p) => getPageSpec(funnelId, p.componentName))
      );

      // Generate all pages in the batch concurrently
      const results = await Promise.allSettled(
        batch.map((p, i) =>
          generateOnePage(
            funnelId,
            p.componentName,
            p.pageOrder,
            totalPages,
            funnel.productInfo,
            specs[i]
          )
        )
      );

      let batchGenerated = 0;
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.generated) {
          batchGenerated++;
        } else if (r.status === "fulfilled" && !r.value.generated) {
          allErrors.push({ page: r.value.componentName, error: r.value.error || "Unknown" });
        } else if (r.status === "rejected") {
          allErrors.push({ page: "unknown", error: String(r.reason) });
        }
      }

      totalGenerated += batchGenerated;

      // If entire batch failed, stop to avoid infinite loop
      if (batchGenerated === 0) break;

      // Move to next batch
      toGenerate = toGenerate.slice(BATCH_SIZE);
    }

    const pagesReady = totalPages - remaining.length + totalGenerated;
    const moreRemaining = remaining.length - totalGenerated > 0;

    // If stopped due to failures, report error
    if (moreRemaining && allErrors.length > 0) {
      return NextResponse.json({
        generating: false,
        pagesReady,
        totalPages,
        error: allErrors[0].error,
        errors: allErrors,
      });
    }

    return NextResponse.json({
      generating: false,
      pagesReady,
      totalPages,
      batchGenerated: totalGenerated,
      ...(allErrors.length > 0 ? { errors: allErrors } : {}),
    });
  } catch (err) {
    console.error("[generate-all] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import type { ProductInfo } from "@/lib/funnel-claude";
import { generateStyle } from "@/lib/funnel-claude";
import { createAuthClient } from "@/lib/supabase-server";
import { createFunnel } from "@/lib/funnel-db";
import type { FunnelBrief } from "@/lib/funnel-types";
import { setUsageContext } from "@/lib/usage";

let lastCreateTime = 0;
const RATE_LIMIT_MS = 60_000;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toPascal(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastCreateTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastCreateTime)) / 1000
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

  setUsageContext({ userId: user.id, operation: "create_funnel" });

  try {
    const body = await request.json();
    const brief: FunnelBrief | undefined = body.brief;
    const productInfo: ProductInfo = brief?.productInfo ?? body.productInfo;

    if (!productInfo?.productName || !productInfo?.description) {
      return NextResponse.json(
        { error: "Missing required product info" },
        { status: 400 }
      );
    }

    const slug = toSlug(productInfo.productName);
    const pascal = toPascal(slug);
    const funnelId = slug + "-" + Math.random().toString(36).slice(2, 8);

    // Generate style if not provided (e.g. manual creation without URL scan)
    if (!productInfo.style) {
      try {
        productInfo.style = await generateStyle(productInfo);
        productInfo.colors = productInfo.style.colors;
      } catch (e) {
        console.warn("Style generation failed, using defaults:", e);
      }
    }

    // Store designNotes in style if provided via brief
    if (brief?.designNotes && productInfo.style) {
      productInfo.style.styleNotes = brief.designNotes;
    }

    let pages: { componentName: string; pageSpec?: import("@/lib/funnel-types").PageSpec }[];
    let pageNames: string[];

    if (brief?.pageSpecs?.length) {
      // Dynamic pages from brief
      pageNames = brief.pageSpecs.map((spec) => `${pascal}${spec.componentSuffix}`);
      pages = brief.pageSpecs.map((spec) => ({
        componentName: `${pascal}${spec.componentSuffix}`,
        pageSpec: spec,
      }));
    } else {
      // Legacy 3-page hardcoded
      pageNames = [
        `${pascal}Landing`,
        `${pascal}Checkout`,
        `${pascal}ThankYou`,
      ];
      pages = pageNames.map((name) => ({ componentName: name }));
    }

    const config = await createFunnel(funnelId, productInfo, pages);

    lastCreateTime = Date.now();

    return NextResponse.json({
      funnel: config,
      pages: pageNames,
      status: "ok",
    });
  } catch (err) {
    console.error("Funnel create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create funnel" },
      { status: 500 }
    );
  }
}

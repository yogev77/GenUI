import { NextRequest } from "next/server";
import { buildStandaloneHTML } from "@/lib/standalone-template";
import {
  getPageByComponentName,
  getFunnel,
  getRunningExperiment,
  getFunnelPages,
} from "@/lib/funnel-db";

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const pageName = slug[0];

  if (!pageName) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    // 1. Look up the page
    const pageData = await getPageByComponentName(pageName);
    if (!pageData || !pageData.sourceCode) {
      return new Response("Page not found", { status: 404 });
    }

    const { funnelId, sourceCode } = pageData;
    let resolvedCode = sourceCode;
    let resolvedPageName = pageName;

    // 2. Check for A/B experiment
    const funnel = await getFunnel(funnelId);
    if (funnel) {
      const experiment = await getRunningExperiment(funnelId, pageName);
      if (experiment) {
        // Assign variant based on cookie or random
        const cookies = request.cookies;
        let sessionId = cookies.get("funnel-session-id")?.value;
        if (!sessionId) {
          sessionId = Math.random().toString(36).slice(2, 10);
        }

        const hashValue = (simpleHash(sessionId + experiment.id) % 1000) / 1000;
        const variant = hashValue < experiment.trafficSplit ? "control" : "test";

        if (variant === "test") {
          // Load test variant source code
          const testPage = await getPageByComponentName(experiment.testComponent);
          if (testPage?.sourceCode) {
            resolvedCode = testPage.sourceCode;
            resolvedPageName = experiment.testComponent;
          }
        }
      }
    }

    // 3. Determine next page URL for funnel step navigation
    let nextUrl: string | null = null;
    const allPages = await getFunnelPages(funnelId);
    const currentIdx = allPages.findIndex((p) => p.componentName === pageName);
    if (currentIdx >= 0 && currentIdx < allPages.length - 1) {
      nextUrl = `/f/${allPages[currentIdx + 1].componentName}`;
    }

    // 4. Determine API base URL
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const apiBase = `${proto}://${host}`;

    // 5. Build standalone HTML
    const html = buildStandaloneHTML({
      componentCode: resolvedCode,
      funnelId,
      pageName: resolvedPageName,
      apiBase,
      nextUrl,
      style: funnel?.productInfo.style ?? null,
      colors: funnel?.productInfo.colors ?? null,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("Standalone page error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

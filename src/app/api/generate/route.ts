import { NextResponse } from "next/server";
import { getFileContent, commitFiles } from "@/lib/github";
import { generateFeature } from "@/lib/claude";
import { verifyCode } from "@/lib/auth";
import type { HistoryEntry, SiteHistory } from "@/lib/history";
import type { AggregateUsage, UsageData } from "@/lib/usage";
import { summarizeForPrompt, summarizeAggregate } from "@/lib/usage";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Simple in-memory rate limiter
let lastGenerateTime = 0;
const RATE_LIMIT_MS = 60_000; // 1 minute

const HISTORY_PATH = "src/data/history.json";
const AGGREGATE_PATH = "src/data/aggregate-usage.json";

function mergeUserIntoAggregate(
  agg: AggregateUsage,
  userData: UsageData
): AggregateUsage {
  // Merge this user's usage into the aggregate
  for (const [name, usage] of Object.entries(userData.features)) {
    if (!agg.features[name]) {
      agg.features[name] = {
        totalInteractions: 0,
        totalViewTimeMs: 0,
        uniqueSessions: 0,
      };
    }
    const f = agg.features[name];
    f.totalInteractions += usage.interactions;
    f.totalViewTimeMs += usage.viewTimeMs;
    f.uniqueSessions += usage.sessions;
  }
  agg.totalSessions += userData.totalSessions;
  agg.lastUpdated = new Date().toISOString();
  return agg;
}

export async function POST(request: Request) {
  // Rate limit
  const now = Date.now();
  if (now - lastGenerateTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastGenerateTime)) / 1000
    );
    return NextResponse.json(
      { error: `Rate limited. Try again in ${waitSec}s.` },
      { status: 429 }
    );
  }

  // Verify access code
  const accessCode = request.headers.get("x-access-code") || "";
  if (!verifyCode(accessCode)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // 1. Read the current barrel file from GitHub
    const barrelPath = "src/components/features/index.ts";
    let barrelContent: string;
    try {
      const file = await getFileContent(barrelPath);
      barrelContent = file.content;
    } catch {
      barrelContent =
        "// GenUI Features - auto-generated barrel file\nexport {};\n";
    }

    // 2. Read existing history + aggregate usage
    let history: SiteHistory;
    try {
      const file = await getFileContent(HISTORY_PATH);
      history = JSON.parse(file.content);
    } catch {
      history = { entries: [], totalFeatures: 0, totalLinesOfCode: 0 };
    }

    let aggregate: AggregateUsage;
    try {
      const file = await getFileContent(AGGREGATE_PATH);
      aggregate = JSON.parse(file.content);
    } catch {
      aggregate = {
        features: {},
        totalUsers: 0,
        totalSessions: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    // 3. Parse existing feature names
    const existingFeatures: string[] = [];
    const exportRegex = /export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from/g;
    let match;
    while ((match = exportRegex.exec(barrelContent)) !== null) {
      existingFeatures.push(match[1]);
    }

    // 4. Read request body — preferences + usage data + requested idea
    let userPrefs = null;
    let localUsage: UsageData | null = null;
    let requestedIdea: string | null = null;
    try {
      const body = await request.json();
      userPrefs = body.preferences || null;
      localUsage = body.usage || null;
      requestedIdea = body.requestedIdea || null;
    } catch {
      // No body or invalid JSON
    }

    // 5. Merge user usage into aggregate
    if (localUsage) {
      aggregate.totalUsers++; // rough count (no dedup yet — future: accounts)
      mergeUserIntoAggregate(aggregate, localUsage);
    }

    // 6. Build behavioral context for Claude
    let behaviorContext = "";
    if (localUsage) {
      const localSummary = summarizeForPrompt(localUsage);
      if (localSummary) behaviorContext += "\n" + localSummary;
    }
    const aggSummary = summarizeAggregate(aggregate);
    if (aggSummary) behaviorContext += "\n" + aggSummary;

    // 7. Claude decides what to build
    const feature = await generateFeature(
      existingFeatures,
      userPrefs,
      behaviorContext,
      requestedIdea
    );

    // 8. Prepend @ts-nocheck
    if (!feature.code.includes("@ts-nocheck")) {
      feature.code = "// @ts-nocheck\n" + feature.code;
    }
    if (!feature.code.includes("export default")) {
      return NextResponse.json(
        { error: "Generated code missing default export. Try again." },
        { status: 500 }
      );
    }

    // 9. Build updated barrel
    const newExportLine = `export { default as ${feature.componentName} } from './${feature.fileName}';\n`;
    const cleanedBarrel = barrelContent.replace(
      /^export\s*\{\s*\};\s*\n?/m,
      ""
    );
    const updatedBarrel = cleanedBarrel.includes("export {")
      ? cleanedBarrel + newExportLine
      : cleanedBarrel + "\n" + newExportLine;

    // 10. Update history
    const linesOfCode = feature.code.split("\n").length;
    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      feature: feature.componentName,
      reasoning: feature.reasoning,
      linesOfCode,
    };
    history.entries.push(entry);
    history.totalFeatures = history.entries.length;
    history.totalLinesOfCode = history.entries.reduce(
      (sum, e) => sum + e.linesOfCode,
      0
    );

    const historyJson = JSON.stringify(history, null, 2);
    const aggregateJson = JSON.stringify(aggregate, null, 2);

    // 11. Write locally (dev only — Vercel filesystem is read-only)
    const isVercel = !!process.env.VERCEL;
    if (!isVercel) {
      const featuresDir = join(process.cwd(), "src/components/features");
      const dataDir = join(process.cwd(), "src/data");
      await mkdir(featuresDir, { recursive: true });
      await mkdir(dataDir, { recursive: true });
      await writeFile(
        join(featuresDir, `${feature.fileName}.tsx`),
        feature.code
      );
      await writeFile(join(featuresDir, "index.ts"), updatedBarrel);
      await writeFile(join(dataDir, "history.json"), historyJson);
      await writeFile(join(dataDir, "aggregate-usage.json"), aggregateJson);
    }

    // 12. Commit to GitHub (triggers Vercel redeploy in production)
    await commitFiles(
      [
        {
          path: `src/components/features/${feature.fileName}.tsx`,
          content: feature.code,
        },
        {
          path: barrelPath,
          content: updatedBarrel,
        },
        {
          path: HISTORY_PATH,
          content: historyJson,
        },
        {
          path: AGGREGATE_PATH,
          content: aggregateJson,
        },
      ],
      `feat: add ${feature.componentName} — ${feature.reasoning.slice(0, 60)}`
    );

    lastGenerateTime = Date.now();

    return NextResponse.json({
      feature: feature.componentName,
      reasoning: feature.reasoning,
      linesOfCode,
      status: "ok",
      deploying: isVercel, // true = needs Vercel redeploy to show
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}

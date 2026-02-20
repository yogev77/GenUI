/**
 * One-time migration: JSON files on GitHub → Supabase Postgres.
 *
 * Reads funnels.json and funnel-events.json from GitHub, then inserts
 * all data into the Supabase tables created by the schema SQL.
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   GITHUB_TOKEN=xxx GITHUB_OWNER=xxx GITHUB_REPO=xxx \
 *   node scripts/migrate-to-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchGitHubFile(path) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.log(`  Skipping GitHub fetch (no credentials): ${path}`);
    return null;
  }
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    console.log(`  Could not fetch ${path} (${res.status})`);
    return null;
  }
  const data = await res.json();
  return Buffer.from(data.content, "base64").toString("utf-8");
}

async function fetchComponentSource(fileName) {
  const content = await fetchGitHubFile(`src/components/funnel/${fileName}.tsx`);
  return content;
}

async function main() {
  console.log("=== GenFunnel → Supabase Migration ===\n");

  // 1. Load funnels.json
  console.log("1. Loading funnels.json from GitHub...");
  const funnelsRaw = await fetchGitHubFile("src/data/funnels.json");
  const funnels = funnelsRaw ? JSON.parse(funnelsRaw) : [];
  console.log(`   Found ${funnels.length} funnels\n`);

  // 2. Load events
  console.log("2. Loading funnel-events.json from GitHub...");
  const eventsRaw = await fetchGitHubFile("src/data/funnel-events.json");
  const events = eventsRaw ? JSON.parse(eventsRaw) : [];
  console.log(`   Found ${events.length} events\n`);

  // 3. Insert funnels
  console.log("3. Inserting funnels...");
  for (const f of funnels) {
    const { error } = await sb.from("funnels").upsert({
      id: f.id,
      product_name: f.productInfo.productName,
      product_type: f.productInfo.productType,
      description: f.productInfo.description,
      price: f.productInfo.price,
      target_audience: f.productInfo.targetAudience || "",
      unique_selling_points: f.productInfo.uniqueSellingPoints || [],
      tone: f.productInfo.tone,
      hidden: f.hidden || false,
      created_at: f.createdAt,
      total_visitors: f.kpis?.totalVisitors || 0,
      cta_clicks: f.kpis?.ctaClicks || 0,
      email_captures: f.kpis?.emailCaptures || 0,
      fake_purchases: f.kpis?.fakePurchases || 0,
      avg_scroll_depth: f.kpis?.avgScrollDepth || 0,
      conversion_rate: f.kpis?.conversionRate || 0,
    });
    if (error) {
      console.error(`   Error inserting funnel ${f.id}:`, error.message);
    } else {
      console.log(`   ✓ ${f.id}`);
    }

    // Insert pages
    for (let i = 0; i < f.pages.length; i++) {
      const pageName = f.pages[i];
      const sourceCode = await fetchComponentSource(pageName);
      const { error: pErr } = await sb.from("funnel_pages").upsert(
        {
          funnel_id: f.id,
          component_name: pageName,
          page_order: i,
          source_code: sourceCode,
        },
        { onConflict: "funnel_id,component_name" }
      );
      if (pErr) {
        console.error(`   Error inserting page ${pageName}:`, pErr.message);
      } else {
        console.log(`     page: ${pageName} ${sourceCode ? "(with source)" : "(no source)"}`);
      }
    }

    // Insert experiments
    if (f.experiments) {
      for (const exp of f.experiments) {
        const { error: eErr } = await sb.from("experiments").upsert({
          id: exp.id,
          funnel_id: f.id,
          page_name: exp.pageName,
          status: exp.status,
          control_component: exp.controlComponent,
          test_component: exp.testComponent,
          traffic_split: exp.trafficSplit,
          significance_threshold: exp.significanceThreshold,
          started_at: exp.startedAt,
          concluded_at: exp.concludedAt || null,
          winner: exp.winner || null,
          control_visitors: exp.controlStats?.visitors || 0,
          control_conversions: exp.controlStats?.conversions || 0,
          test_visitors: exp.testStats?.visitors || 0,
          test_conversions: exp.testStats?.conversions || 0,
        });
        if (eErr) console.error(`   Error inserting experiment:`, eErr.message);
        else console.log(`     experiment: ${exp.id}`);
      }
    }

    // Insert improvement logs
    if (f.logs) {
      for (const log of f.logs) {
        const { error: lErr } = await sb.from("improvement_logs").insert({
          funnel_id: f.id,
          version: log.version,
          page_name: log.pageName,
          reasoning: log.reasoning,
          created_at: log.timestamp,
          kpi_visitors: log.kpiSnapshot?.totalVisitors || 0,
          kpi_cta_clicks: log.kpiSnapshot?.ctaClicks || 0,
          kpi_emails: log.kpiSnapshot?.emailCaptures || 0,
          kpi_purchases: log.kpiSnapshot?.fakePurchases || 0,
          kpi_scroll_depth: log.kpiSnapshot?.avgScrollDepth || 0,
          kpi_conversion_rate: log.kpiSnapshot?.conversionRate || 0,
        });
        if (lErr) console.error(`   Error inserting log:`, lErr.message);
        else console.log(`     log: v${log.version} ${log.pageName}`);
      }
    }
  }

  // 4. Insert events
  console.log("\n4. Inserting events...");
  const BATCH_SIZE = 100;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE).map((e) => ({
      funnel_id: e.funnelId,
      page_name: e.pageName,
      session_id: e.sessionId,
      type: e.type,
      value: e.value != null ? String(e.value) : null,
      variant: e.variant || null,
      created_at: e.timestamp,
    }));

    const { error } = await sb.from("funnel_events").insert(batch);
    if (error) {
      console.error(`   Error inserting events batch at ${i}:`, error.message);
    } else {
      console.log(`   ✓ ${i + batch.length}/${events.length}`);
    }
  }

  console.log("\n=== Migration complete! ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

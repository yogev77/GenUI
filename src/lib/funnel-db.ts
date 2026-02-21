import { createServiceClient } from "./supabase";
import type {
  FunnelConfig,
  FunnelKPIs,
  FunnelStyle,
  ProductInfo,
  FunnelEvent,
  ImprovementLog,
  Experiment,
} from "./funnel-claude";
import type { PageSpec } from "./funnel-types";

// ── Row types (matching DB schema) ──────────────────────────────────

interface FunnelRow {
  id: string;
  product_name: string;
  product_type: string;
  description: string;
  price: string;
  target_audience: string;
  unique_selling_points: string[];
  tone: string;
  hidden: boolean;
  created_at: string;
  total_visitors: number;
  page_views: number;
  cta_clicks: number;
  email_captures: number;
  fake_purchases: number;
  avg_scroll_depth: number;
  conversion_rate: number;
  owner_id?: string;
  color_palette?: { primary: string; secondary: string; accent: string; background: string; dark: string } | null;
  style?: FunnelStyle | null;
  image_urls?: string[] | null;
  logo_url?: string | null;
  image_contexts?: { url: string; context: string }[] | null;
}

interface FunnelPageRow {
  id: number;
  funnel_id: string;
  component_name: string;
  page_order: number;
  source_code: string | null;
  page_spec: PageSpec | null;
}

interface EventRow {
  id: number;
  funnel_id: string;
  page_name: string;
  session_id: string;
  visitor_id: string | null;
  type: string;
  value: string | null;
  variant: string | null;
  created_at: string;
}

interface ExperimentRow {
  id: string;
  funnel_id: string;
  page_name: string;
  status: string;
  control_component: string;
  test_component: string;
  traffic_split: number;
  significance_threshold: number;
  started_at: string;
  concluded_at: string | null;
  winner: string | null;
  control_visitors: number;
  control_conversions: number;
  test_visitors: number;
  test_conversions: number;
}

interface ImprovementLogRow {
  id: number;
  funnel_id: string;
  version: number;
  page_name: string;
  reasoning: string;
  created_at: string;
  kpi_visitors: number;
  kpi_cta_clicks: number;
  kpi_emails: number;
  kpi_purchases: number;
  kpi_scroll_depth: number;
  kpi_conversion_rate: number;
}

// ── Converters ──────────────────────────────────────────────────────

function rowToFunnelConfig(
  row: FunnelRow,
  pages: string[],
  logs: ImprovementLog[],
  experiments: Experiment[],
  pagesReady = pages.length
): FunnelConfig {
  // Build style: prefer `style` column, fall back to `color_palette`
  const style: FunnelStyle | undefined = row.style
    ? row.style
    : row.color_palette
      ? { colors: row.color_palette, fonts: { heading: "system-ui", body: "system-ui" }, styleNotes: "" }
      : undefined;

  return {
    id: row.id,
    productInfo: {
      productName: row.product_name,
      productType: row.product_type as ProductInfo["productType"],
      description: row.description,
      price: row.price,
      targetAudience: row.target_audience,
      uniqueSellingPoints: row.unique_selling_points,
      tone: row.tone as ProductInfo["tone"],
      ...(style ? { style, colors: style.colors } : {}),
      ...(row.image_urls?.length ? { imageUrls: row.image_urls } : {}),
      ...(row.logo_url ? { logoUrl: row.logo_url } : {}),
      ...(row.image_contexts?.length ? { imageContexts: row.image_contexts } : {}),
    },
    pages,
    pagesReady,
    createdAt: row.created_at,
    kpis: {
      totalVisitors: row.total_visitors,
      pageViews: row.page_views ?? 0,
      ctaClicks: row.cta_clicks,
      emailCaptures: row.email_captures,
      fakePurchases: row.fake_purchases,
      avgScrollDepth: row.avg_scroll_depth,
      conversionRate: row.conversion_rate,
    },
    logs,
    experiments,
    hidden: row.hidden,
  };
}

function experimentRowToExperiment(row: ExperimentRow): Experiment {
  return {
    id: row.id,
    funnelId: row.funnel_id,
    pageName: row.page_name,
    status: row.status as "running" | "concluded",
    controlComponent: row.control_component,
    testComponent: row.test_component,
    trafficSplit: row.traffic_split,
    significanceThreshold: row.significance_threshold,
    startedAt: row.started_at,
    concludedAt: row.concluded_at ?? undefined,
    winner: row.winner as "control" | "test" | undefined,
    controlStats: {
      visitors: row.control_visitors,
      conversions: row.control_conversions,
    },
    testStats: {
      visitors: row.test_visitors,
      conversions: row.test_conversions,
    },
  };
}

function logRowToLog(row: ImprovementLogRow): ImprovementLog {
  return {
    version: row.version,
    pageName: row.page_name,
    reasoning: row.reasoning,
    timestamp: row.created_at,
    kpiSnapshot: {
      totalVisitors: row.kpi_visitors,
      pageViews: 0,
      ctaClicks: row.kpi_cta_clicks,
      emailCaptures: row.kpi_emails,
      fakePurchases: row.kpi_purchases,
      avgScrollDepth: row.kpi_scroll_depth,
      conversionRate: row.kpi_conversion_rate,
    },
  };
}

// ── Funnel CRUD ─────────────────────────────────────────────────────

export async function listFunnels(): Promise<FunnelConfig[]> {
  const sb = createServiceClient();

  const { data: rows, error } = await sb
    .from("funnels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r: FunnelRow) => r.id);

  const [pagesRes, logsRes, expsRes] = await Promise.all([
    sb.from("funnel_pages").select("*").in("funnel_id", ids).order("page_order"),
    sb.from("improvement_logs").select("*").in("funnel_id", ids).order("version"),
    sb.from("experiments").select("*").in("funnel_id", ids).order("started_at"),
  ]);

  const pagesByFunnel = new Map<string, string[]>();
  const pagesReadyByFunnel = new Map<string, number>();
  for (const p of (pagesRes.data ?? []) as FunnelPageRow[]) {
    const list = pagesByFunnel.get(p.funnel_id) ?? [];
    list.push(p.component_name);
    pagesByFunnel.set(p.funnel_id, list);
    if (p.source_code) {
      pagesReadyByFunnel.set(p.funnel_id, (pagesReadyByFunnel.get(p.funnel_id) ?? 0) + 1);
    }
  }

  const logsByFunnel = new Map<string, ImprovementLog[]>();
  for (const l of (logsRes.data ?? []) as ImprovementLogRow[]) {
    const list = logsByFunnel.get(l.funnel_id) ?? [];
    list.push(logRowToLog(l));
    logsByFunnel.set(l.funnel_id, list);
  }

  const expsByFunnel = new Map<string, Experiment[]>();
  for (const e of (expsRes.data ?? []) as ExperimentRow[]) {
    const list = expsByFunnel.get(e.funnel_id) ?? [];
    list.push(experimentRowToExperiment(e));
    expsByFunnel.set(e.funnel_id, list);
  }

  return rows.map((r: FunnelRow) => {
    const pages = pagesByFunnel.get(r.id) ?? [];
    return rowToFunnelConfig(
      r,
      pages,
      logsByFunnel.get(r.id) ?? [],
      expsByFunnel.get(r.id) ?? [],
      pagesReadyByFunnel.get(r.id) ?? 0
    );
  });
}

export async function getFunnel(funnelId: string): Promise<FunnelConfig | null> {
  const sb = createServiceClient();

  const { data: row, error } = await sb
    .from("funnels")
    .select("*")
    .eq("id", funnelId)
    .single();

  if (error || !row) return null;

  const [pagesRes, logsRes, expsRes] = await Promise.all([
    sb.from("funnel_pages").select("*").eq("funnel_id", funnelId).order("page_order"),
    sb.from("improvement_logs").select("*").eq("funnel_id", funnelId).order("version"),
    sb.from("experiments").select("*").eq("funnel_id", funnelId).order("started_at"),
  ]);

  const pageRows = (pagesRes.data ?? []) as FunnelPageRow[];
  const pages = pageRows.map((p) => p.component_name);
  const pagesReady = pageRows.filter((p) => p.source_code).length;
  const logs = ((logsRes.data ?? []) as ImprovementLogRow[]).map(logRowToLog);
  const exps = ((expsRes.data ?? []) as ExperimentRow[]).map(experimentRowToExperiment);

  return rowToFunnelConfig(row as FunnelRow, pages, logs, exps, pagesReady);
}

export async function getFunnelByPageName(pageName: string): Promise<FunnelConfig | null> {
  const sb = createServiceClient();

  const { data: pageRow } = await sb
    .from("funnel_pages")
    .select("funnel_id")
    .eq("component_name", pageName)
    .single();

  if (!pageRow) return null;
  return getFunnel(pageRow.funnel_id);
}

export async function createFunnel(
  id: string,
  productInfo: ProductInfo,
  pages: { componentName: string; sourceCode?: string; pageSpec?: PageSpec }[]
): Promise<FunnelConfig> {
  const sb = createServiceClient();

  const funnelInsert: Record<string, unknown> = {
    id,
    product_name: productInfo.productName,
    product_type: productInfo.productType,
    description: productInfo.description,
    price: productInfo.price,
    target_audience: productInfo.targetAudience,
    unique_selling_points: productInfo.uniqueSellingPoints,
    tone: productInfo.tone,
  };
  if (productInfo.style) funnelInsert.style = productInfo.style;
  if (productInfo.colors) funnelInsert.color_palette = productInfo.colors;
  if (productInfo.imageUrls?.length) funnelInsert.image_urls = productInfo.imageUrls;
  if (productInfo.logoUrl) funnelInsert.logo_url = productInfo.logoUrl;
  if (productInfo.imageContexts?.length) funnelInsert.image_contexts = productInfo.imageContexts;

  let { error: fErr } = await sb.from("funnels").insert(funnelInsert);

  // Fallback: if new columns don't exist yet, retry without them
  if (fErr?.message && /style|image_urls|logo_url|color_palette|image_contexts/.test(fErr.message)) {
    delete funnelInsert.style;
    delete funnelInsert.color_palette;
    delete funnelInsert.image_urls;
    delete funnelInsert.logo_url;
    delete funnelInsert.image_contexts;
    const retry = await sb.from("funnels").insert(funnelInsert);
    fErr = retry.error;
  }

  if (fErr) throw new Error(fErr.message);

  if (pages.length > 0) {
    const rows = pages.map((p, i) => {
      const row: Record<string, unknown> = {
        funnel_id: id,
        component_name: p.componentName,
        page_order: i,
        source_code: p.sourceCode ?? null,
      };
      if (p.pageSpec) row.page_spec = p.pageSpec;
      return row;
    });

    let { error: pErr } = await sb.from("funnel_pages").insert(rows);

    // Fallback: if page_spec column doesn't exist yet
    if (pErr?.message && /page_spec/.test(pErr.message)) {
      const fallbackRows = rows.map((r) => {
        const { page_spec: _, ...rest } = r;
        return rest;
      });
      const retry = await sb.from("funnel_pages").insert(fallbackRows);
      pErr = retry.error;
    }

    if (pErr) throw new Error(pErr.message);
  }

  const funnel = await getFunnel(id);
  if (!funnel) throw new Error("Failed to read back created funnel");
  return funnel;
}

export async function updateFunnelProductInfo(
  funnelId: string,
  productInfo: ProductInfo
): Promise<void> {
  const sb = createServiceClient();

  const update: Record<string, unknown> = {
    product_name: productInfo.productName,
    product_type: productInfo.productType,
    description: productInfo.description,
    price: productInfo.price,
    target_audience: productInfo.targetAudience,
    unique_selling_points: productInfo.uniqueSellingPoints,
    tone: productInfo.tone,
    image_urls: productInfo.imageUrls ?? null,
    logo_url: productInfo.logoUrl ?? null,
    image_contexts: productInfo.imageContexts ?? null,
  };
  if (productInfo.style) update.style = productInfo.style;

  let { error } = await sb
    .from("funnels")
    .update(update)
    .eq("id", funnelId);

  // Fallback: if new columns don't exist yet
  if (error?.message && /style|image_urls|logo_url|image_contexts/.test(error.message)) {
    delete update.style;
    delete update.image_urls;
    delete update.logo_url;
    delete update.image_contexts;
    const retry = await sb.from("funnels").update(update).eq("id", funnelId);
    error = retry.error;
  }

  if (error) throw new Error(error.message);
}

export async function hideFunnel(funnelId: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("funnels")
    .update({ hidden: true })
    .eq("id", funnelId);
  if (error) throw new Error(error.message);
}

export async function restoreFunnel(funnelId: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("funnels")
    .update({ hidden: false })
    .eq("id", funnelId);
  if (error) throw new Error(error.message);
}

export async function deleteFunnelPermanently(funnelId: string): Promise<void> {
  const sb = createServiceClient();
  // CASCADE will delete funnel_pages, funnel_events, experiments, improvement_logs
  const { error } = await sb.from("funnels").delete().eq("id", funnelId);
  if (error) throw new Error(error.message);
}

// ── KPI updates ─────────────────────────────────────────────────────

export async function updateFunnelKPIs(
  funnelId: string,
  kpis: Partial<FunnelKPIs>
): Promise<void> {
  const sb = createServiceClient();
  const update: Record<string, unknown> = {};
  if (kpis.totalVisitors !== undefined) update.total_visitors = kpis.totalVisitors;
  if (kpis.pageViews !== undefined) update.page_views = kpis.pageViews;
  if (kpis.ctaClicks !== undefined) update.cta_clicks = kpis.ctaClicks;
  if (kpis.emailCaptures !== undefined) update.email_captures = kpis.emailCaptures;
  if (kpis.fakePurchases !== undefined) update.fake_purchases = kpis.fakePurchases;
  if (kpis.avgScrollDepth !== undefined) update.avg_scroll_depth = kpis.avgScrollDepth;
  if (kpis.conversionRate !== undefined) update.conversion_rate = kpis.conversionRate;

  const { error } = await sb.from("funnels").update(update).eq("id", funnelId);
  if (error) throw new Error(error.message);
}

// ── Events ──────────────────────────────────────────────────────────

export async function trackEvent(event: {
  funnelId: string;
  pageName: string;
  sessionId: string;
  visitorId?: string;
  type: string;
  value?: string | number;
  variant?: string;
}): Promise<void> {
  const sb = createServiceClient();

  const { error } = await sb.from("funnel_events").insert({
    funnel_id: event.funnelId,
    page_name: event.pageName,
    session_id: event.sessionId,
    visitor_id: event.visitorId ?? null,
    type: event.type,
    value: event.value != null ? String(event.value) : null,
    variant: event.variant ?? null,
  });

  if (error) throw new Error(error.message);

  // Update denormalized KPIs on the funnel
  const { data: funnel } = await sb
    .from("funnels")
    .select("total_visitors, page_views, cta_clicks, email_captures, fake_purchases, avg_scroll_depth")
    .eq("id", event.funnelId)
    .single();

  if (funnel) {
    const update: Record<string, unknown> = {};
    switch (event.type) {
      case "page_view": {
        // Always increment page_views (every page load)
        update.page_views = (funnel.page_views ?? 0) + 1;

        // Only increment total_visitors for new unique visitors
        if (event.visitorId) {
          const { data: existing } = await sb
            .from("funnel_events")
            .select("id")
            .eq("funnel_id", event.funnelId)
            .eq("visitor_id", event.visitorId)
            .eq("type", "page_view")
            .limit(2);
          // We just inserted one, so if there's only 1 row it's a new visitor
          if (!existing || existing.length <= 1) {
            update.total_visitors = funnel.total_visitors + 1;
          }
        } else {
          // No visitor ID (legacy) — fall back to counting as unique
          update.total_visitors = funnel.total_visitors + 1;
        }
        break;
      }
      case "cta_click":
        update.cta_clicks = funnel.cta_clicks + 1;
        break;
      case "email_capture":
        update.email_captures = funnel.email_captures + 1;
        break;
      case "purchase":
        update.fake_purchases = funnel.fake_purchases + 1;
        break;
      case "scroll_depth":
        if (event.value != null) {
          const n = funnel.total_visitors || 1;
          update.avg_scroll_depth =
            (funnel.avg_scroll_depth * (n - 1) + Number(event.value)) / n;
        }
        break;
    }

    // Recalculate conversion rate based on unique visitors
    const visitors = (update.total_visitors as number) ?? funnel.total_visitors;
    const purchases = (update.fake_purchases as number) ?? funnel.fake_purchases;
    update.conversion_rate = visitors > 0 ? purchases / visitors : 0;

    if (Object.keys(update).length > 0) {
      await sb.from("funnels").update(update).eq("id", event.funnelId);
    }
  }

  // Update experiment stats if variant is present
  if (event.variant) {
    const { data: exp } = await sb
      .from("experiments")
      .select("*")
      .eq("funnel_id", event.funnelId)
      .eq("page_name", event.pageName)
      .eq("status", "running")
      .single();

    if (exp) {
      const updates: Record<string, unknown> = {};
      if (event.variant === "control") {
        if (event.type === "page_view") updates.control_visitors = exp.control_visitors + 1;
        if (event.type === "purchase" || event.type === "email_capture")
          updates.control_conversions = exp.control_conversions + 1;
      } else {
        if (event.type === "page_view") updates.test_visitors = exp.test_visitors + 1;
        if (event.type === "purchase" || event.type === "email_capture")
          updates.test_conversions = exp.test_conversions + 1;
      }
      if (Object.keys(updates).length > 0) {
        await sb.from("experiments").update(updates).eq("id", exp.id);
      }
    }
  }
}

export async function getEvents(funnelId: string): Promise<FunnelEvent[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("funnel_events")
    .select("*")
    .eq("funnel_id", funnelId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

  return ((data ?? []) as EventRow[]).map((r) => ({
    funnelId: r.funnel_id,
    pageName: r.page_name,
    sessionId: r.session_id,
    visitorId: r.visitor_id ?? undefined,
    type: r.type as FunnelEvent["type"],
    value: r.value != null ? (isNaN(Number(r.value)) ? r.value : Number(r.value)) : undefined,
    variant: r.variant as "control" | "test" | undefined,
    timestamp: r.created_at,
  }));
}

// ── Sessions (aggregated) ───────────────────────────────────────────

export interface AggregatedSession {
  sessionId: string;
  pages: string[];
  events: { type: string; pageName: string; timestamp: string; value?: string | number }[];
  startedAt: string;
  endedAt: string;
  durationMs: number;
  outcome: "converted" | "engaged" | "bounced";
  variant?: "control" | "test";
}

export async function getSessions(funnelId: string): Promise<AggregatedSession[]> {
  const events = await getEvents(funnelId);

  const bySession = new Map<string, FunnelEvent[]>();
  for (const event of events) {
    const list = bySession.get(event.sessionId) || [];
    list.push(event);
    bySession.set(event.sessionId, list);
  }

  const sessions: AggregatedSession[] = [];
  for (const [sessionId, sessionEvents] of bySession) {
    const sorted = sessionEvents.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const pages = [...new Set(sorted.map((e) => e.pageName))];
    const startedAt = sorted[0].timestamp;
    const endedAt = sorted[sorted.length - 1].timestamp;
    const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();

    const hasPurchase = sorted.some((e) => e.type === "purchase");
    const hasClick = sorted.some(
      (e) => e.type === "cta_click" || e.type === "email_capture"
    );
    const outcome: AggregatedSession["outcome"] = hasPurchase
      ? "converted"
      : hasClick
        ? "engaged"
        : "bounced";

    const variant = sorted.find((e) => e.variant)?.variant;

    sessions.push({
      sessionId,
      pages,
      events: sorted.map((e) => ({
        type: e.type,
        pageName: e.pageName,
        timestamp: e.timestamp,
        value: e.value,
      })),
      startedAt,
      endedAt,
      durationMs,
      outcome,
      variant,
    });
  }

  sessions.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return sessions;
}

// ── Visitors (aggregated by visitorId) ──────────────────────────────

export interface AggregatedVisitor {
  visitorId: string;
  email: string | null;
  pages: string[];
  totalPages: number;
  completionPct: number;
  purchased: boolean;
  lastSeenAt: string;
  sessionCount: number;
}

export async function getVisitors(funnelId: string): Promise<AggregatedVisitor[]> {
  const events = await getEvents(funnelId);

  // Get total page count for this funnel
  const sb = createServiceClient();
  const { data: pageRows } = await sb
    .from("funnel_pages")
    .select("component_name")
    .eq("funnel_id", funnelId);
  const totalFunnelPages = pageRows?.length ?? 1;

  const byVisitor = new Map<string, FunnelEvent[]>();
  for (const event of events) {
    const key = event.visitorId || event.sessionId; // fallback for legacy
    const list = byVisitor.get(key) || [];
    list.push(event);
    byVisitor.set(key, list);
  }

  const visitors: AggregatedVisitor[] = [];
  for (const [visitorId, visitorEvents] of byVisitor) {
    const sorted = visitorEvents.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const emailEvent = sorted.find(
      (e) => e.type === "email_capture" && typeof e.value === "string" && e.value.includes("@")
    );
    const email = emailEvent ? String(emailEvent.value) : null;

    const pages = [...new Set(sorted.map((e) => e.pageName))];
    const purchased = sorted.some((e) => e.type === "purchase");
    const lastSeenAt = sorted[sorted.length - 1].timestamp;
    const sessionIds = new Set(sorted.map((e) => e.sessionId));

    visitors.push({
      visitorId,
      email,
      pages,
      totalPages: totalFunnelPages,
      completionPct: Math.round((pages.length / totalFunnelPages) * 100),
      purchased,
      lastSeenAt,
      sessionCount: sessionIds.size,
    });
  }

  visitors.sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );

  return visitors;
}

// ── Experiments ─────────────────────────────────────────────────────

export async function createExperiment(experiment: {
  id: string;
  funnelId: string;
  pageName: string;
  controlComponent: string;
  testComponent: string;
  trafficSplit?: number;
  significanceThreshold?: number;
}): Promise<Experiment> {
  const sb = createServiceClient();

  const { error } = await sb.from("experiments").insert({
    id: experiment.id,
    funnel_id: experiment.funnelId,
    page_name: experiment.pageName,
    status: "running",
    control_component: experiment.controlComponent,
    test_component: experiment.testComponent,
    traffic_split: experiment.trafficSplit ?? 0.5,
    significance_threshold: experiment.significanceThreshold ?? 0.95,
  });

  if (error) throw new Error(error.message);

  const { data: row } = await sb
    .from("experiments")
    .select("*")
    .eq("id", experiment.id)
    .single();

  return experimentRowToExperiment(row as ExperimentRow);
}

export async function getRunningExperiment(
  funnelId: string,
  pageName: string
): Promise<Experiment | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("experiments")
    .select("*")
    .eq("funnel_id", funnelId)
    .eq("page_name", pageName)
    .eq("status", "running")
    .single();

  return data ? experimentRowToExperiment(data as ExperimentRow) : null;
}

export async function getExperiment(experimentId: string): Promise<{
  experiment: Experiment;
  funnelId: string;
} | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("experiments")
    .select("*")
    .eq("id", experimentId)
    .single();

  if (!data) return null;
  return {
    experiment: experimentRowToExperiment(data as ExperimentRow),
    funnelId: data.funnel_id,
  };
}

export async function concludeExperiment(
  experimentId: string,
  winner: "control" | "test"
): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("experiments")
    .update({
      status: "concluded",
      concluded_at: new Date().toISOString(),
      winner,
    })
    .eq("id", experimentId);

  if (error) throw new Error(error.message);
}

export async function countPastExperiments(
  funnelId: string,
  pageName: string
): Promise<number> {
  const sb = createServiceClient();
  const { count, error } = await sb
    .from("experiments")
    .select("*", { count: "exact", head: true })
    .eq("funnel_id", funnelId)
    .eq("page_name", pageName);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ── Improvement Logs ────────────────────────────────────────────────

export async function createImprovementLog(log: {
  funnelId: string;
  version: number;
  pageName: string;
  reasoning: string;
  kpiSnapshot: FunnelKPIs;
}): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("improvement_logs").insert({
    funnel_id: log.funnelId,
    version: log.version,
    page_name: log.pageName,
    reasoning: log.reasoning,
    kpi_visitors: log.kpiSnapshot.totalVisitors,
    kpi_cta_clicks: log.kpiSnapshot.ctaClicks,
    kpi_emails: log.kpiSnapshot.emailCaptures,
    kpi_purchases: log.kpiSnapshot.fakePurchases,
    kpi_scroll_depth: log.kpiSnapshot.avgScrollDepth,
    kpi_conversion_rate: log.kpiSnapshot.conversionRate,
  });
  if (error) throw new Error(error.message);
}

// ── Funnel Pages (source code) ──────────────────────────────────────

export async function getPageSourceCode(
  funnelId: string,
  componentName: string
): Promise<string | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("funnel_pages")
    .select("source_code")
    .eq("funnel_id", funnelId)
    .eq("component_name", componentName)
    .single();

  return data?.source_code ?? null;
}

export async function upsertFunnelPage(
  funnelId: string,
  componentName: string,
  pageOrder: number,
  sourceCode: string
): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("funnel_pages").upsert(
    {
      funnel_id: funnelId,
      component_name: componentName,
      page_order: pageOrder,
      source_code: sourceCode,
    },
    { onConflict: "funnel_id,component_name" }
  );
  if (error) throw new Error(error.message);
}

export async function getFunnelPages(
  funnelId: string
): Promise<{ componentName: string; pageOrder: number }[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("funnel_pages")
    .select("component_name, page_order")
    .eq("funnel_id", funnelId)
    .order("page_order");

  if (error) throw new Error(error.message);
  return ((data ?? []) as { component_name: string; page_order: number }[]).map(
    (r) => ({ componentName: r.component_name, pageOrder: r.page_order })
  );
}

export async function getPageByComponentName(
  componentName: string
): Promise<{ funnelId: string; sourceCode: string | null } | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("funnel_pages")
    .select("funnel_id, source_code")
    .eq("component_name", componentName)
    .single();

  if (!data) return null;
  return { funnelId: data.funnel_id, sourceCode: data.source_code };
}

export async function getPageSpec(
  funnelId: string,
  componentName: string
): Promise<PageSpec | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("funnel_pages")
    .select("page_spec")
    .eq("funnel_id", funnelId)
    .eq("component_name", componentName)
    .single();

  return (data?.page_spec as PageSpec | null) ?? null;
}

export async function getNextUngeneratedPage(
  funnelId: string
): Promise<{ componentName: string; pageOrder: number } | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("funnel_pages")
    .select("component_name, page_order")
    .eq("funnel_id", funnelId)
    .is("source_code", null)
    .order("page_order")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    componentName: (data as { component_name: string; page_order: number }).component_name,
    pageOrder: (data as { component_name: string; page_order: number }).page_order,
  };
}

export async function getAllUngeneratedPages(
  funnelId: string
): Promise<{ componentName: string; pageOrder: number }[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("funnel_pages")
    .select("component_name, page_order")
    .eq("funnel_id", funnelId)
    .is("source_code", null)
    .order("page_order");

  if (error) throw new Error(error.message);
  if (!data) return [];
  return (data as { component_name: string; page_order: number }[]).map((d) => ({
    componentName: d.component_name,
    pageOrder: d.page_order,
  }));
}

export async function replaceFunnelPages(
  funnelId: string,
  pages: { componentName: string; pageSpec?: PageSpec }[]
): Promise<void> {
  const sb = createServiceClient();

  // Delete existing pages
  const { error: delErr } = await sb
    .from("funnel_pages")
    .delete()
    .eq("funnel_id", funnelId);
  if (delErr) throw new Error(delErr.message);

  // Insert new pages
  if (pages.length > 0) {
    const rows = pages.map((p, i) => {
      const row: Record<string, unknown> = {
        funnel_id: funnelId,
        component_name: p.componentName,
        page_order: i,
        source_code: null,
      };
      if (p.pageSpec) row.page_spec = p.pageSpec;
      return row;
    });

    let { error: pErr } = await sb.from("funnel_pages").insert(rows);

    // Fallback: if page_spec column doesn't exist yet
    if (pErr?.message && /page_spec/.test(pErr.message)) {
      const fallbackRows = rows.map((r) => {
        const { page_spec: _, ...rest } = r;
        return rest;
      });
      const retry = await sb.from("funnel_pages").insert(fallbackRows);
      pErr = retry.error;
    }

    if (pErr) throw new Error(pErr.message);
  }
}

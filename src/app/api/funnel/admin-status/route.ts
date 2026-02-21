import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase";

const ADMIN_EMAIL = "yogev77@gmail.com";

export async function GET() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sb = createServiceClient();

  const { data: funnels } = await sb
    .from("funnels")
    .select("id, product_name, created_at, hidden")
    .order("created_at", { ascending: false });

  if (!funnels) {
    return NextResponse.json({ funnels: [], logs: [] });
  }

  const ids = funnels.map((f) => f.id);

  // Get pages — try with generation_error, fall back without
  let pageRows: Record<string, unknown>[] = [];
  const { data: pagesWithErr, error: errColErr } = await sb
    .from("funnel_pages")
    .select("funnel_id, component_name, page_order, source_code, generation_error")
    .in("funnel_id", ids)
    .order("page_order");

  if (errColErr) {
    // Column doesn't exist — query without it
    const { data: pagesPlain } = await sb
      .from("funnel_pages")
      .select("funnel_id, component_name, page_order, source_code")
      .in("funnel_id", ids)
      .order("page_order");
    pageRows = (pagesPlain ?? []) as Record<string, unknown>[];
  } else {
    pageRows = (pagesWithErr ?? []) as Record<string, unknown>[];
  }

  // Get recent error logs (best-effort)
  let errorLogs: { funnel_id: string; page_name: string; error: string; created_at: string }[] = [];
  try {
    const { data: logs } = await sb
      .from("generation_logs")
      .select("funnel_id, page_name, error, created_at")
      .in("funnel_id", ids)
      .order("created_at", { ascending: false })
      .limit(50);
    errorLogs = (logs ?? []) as typeof errorLogs;
  } catch {
    // Table might not exist
  }

  const result = funnels.map((f) => {
    const fPages = pageRows.filter((p) => p.funnel_id === f.id);
    const fLogs = errorLogs.filter((l) => l.funnel_id === f.id);
    return {
      id: f.id,
      productName: f.product_name,
      createdAt: f.created_at,
      hidden: f.hidden,
      totalPages: fPages.length,
      pagesReady: fPages.filter((p) => p.source_code).length,
      pages: fPages.map((p) => ({
        name: p.component_name,
        order: p.page_order,
        ready: !!p.source_code,
        error: (p.generation_error as string) ?? null,
      })),
      recentErrors: fLogs.slice(0, 5),
    };
  });

  return NextResponse.json({ funnels: result });
}

import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { funnelId, oldUrl, newUrl } = await request.json();

    if (!funnelId || !oldUrl || !newUrl) {
      return NextResponse.json(
        { error: "Missing funnelId, oldUrl, or newUrl" },
        { status: 400 }
      );
    }

    const sb = createServiceClient();

    // Verify ownership
    const { data: funnel } = await sb
      .from("funnels")
      .select("user_id")
      .eq("id", funnelId)
      .single();

    if (!funnel || funnel.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get all pages for this funnel
    const { data: pages } = await sb
      .from("funnel_pages")
      .select("component_name, page_order, source_code")
      .eq("funnel_id", funnelId)
      .order("page_order");

    let replaced = 0;

    for (const page of pages ?? []) {
      if (!page.source_code || !page.source_code.includes(oldUrl)) continue;

      const updated = page.source_code.replaceAll(oldUrl, newUrl);

      await sb
        .from("funnel_pages")
        .update({ source_code: updated })
        .eq("funnel_id", funnelId)
        .eq("component_name", page.component_name);

      replaced++;
    }

    return NextResponse.json({ replaced });
  } catch (err) {
    console.error("Replace image error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Replace failed" },
      { status: 500 }
    );
  }
}

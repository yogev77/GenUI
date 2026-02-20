import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/funnel-db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const event = await request.json();

    if (!event.funnelId || !event.type || !event.sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    await trackEvent({
      funnelId: event.funnelId,
      pageName: event.pageName,
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      type: event.type,
      value: event.value,
      variant: event.variant,
    });

    return NextResponse.json({ status: "ok" }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Invalid event data" },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

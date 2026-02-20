import { NextResponse } from "next/server";
import { verifyCode } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    if (verifyCode(code)) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid code" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

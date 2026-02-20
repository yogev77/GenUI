import { NextResponse } from "next/server";
import { getFileContent, commitFiles } from "@/lib/github";
import { improveFeature } from "@/lib/claude";
import { verifyCode } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Simple in-memory rate limiter
let lastImproveTime = 0;
const RATE_LIMIT_MS = 60_000;

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastImproveTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastImproveTime)) / 1000
    );
    return NextResponse.json(
      { error: `Rate limited. Try again in ${waitSec}s.` },
      { status: 429 }
    );
  }

  const accessCode = request.headers.get("x-access-code") || "";
  if (!verifyCode(accessCode)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { componentName } = body;

    if (!componentName || typeof componentName !== "string") {
      return NextResponse.json(
        { error: "Missing componentName" },
        { status: 400 }
      );
    }

    // Derive fileName from componentName
    const fileName = componentName;
    const filePath = `src/components/features/${fileName}.tsx`;

    // Read existing code from GitHub
    let existingCode: string;
    try {
      const file = await getFileContent(filePath);
      existingCode = file.content;
    } catch {
      return NextResponse.json(
        { error: `Feature "${componentName}" not found on GitHub` },
        { status: 404 }
      );
    }

    // Ask Claude to improve it
    const improved = await improveFeature(
      componentName,
      fileName,
      existingCode
    );

    // Prepend @ts-nocheck
    if (!improved.code.includes("@ts-nocheck")) {
      improved.code = "// @ts-nocheck\n" + improved.code;
    }
    if (!improved.code.includes("export default")) {
      return NextResponse.json(
        { error: "Improved code missing default export. Try again." },
        { status: 500 }
      );
    }

    // Write locally in dev
    const isVercel = !!process.env.VERCEL;
    if (!isVercel) {
      const featuresDir = join(process.cwd(), "src/components/features");
      await mkdir(featuresDir, { recursive: true });
      await writeFile(join(featuresDir, `${fileName}.tsx`), improved.code);
    }

    // Commit to GitHub
    await commitFiles(
      [{ path: filePath, content: improved.code }],
      `improve: ${componentName} — ${improved.reasoning.slice(0, 60)}`
    );

    lastImproveTime = Date.now();

    return NextResponse.json({
      feature: componentName,
      reasoning: improved.reasoning,
      deploying: isVercel,
    });
  } catch (err) {
    console.error("Improve error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Improvement failed" },
      { status: 500 }
    );
  }
}

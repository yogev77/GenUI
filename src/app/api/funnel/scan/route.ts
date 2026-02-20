import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractProductInfo } from "@/lib/funnel-claude";
import { createAuthClient } from "@/lib/supabase-server";
import { uploadImageFromUrl } from "@/lib/funnel-storage";
import type { FunnelImage } from "@/lib/funnel-types";

const anthropic = new Anthropic();

let lastScanTime = 0;
const RATE_LIMIT_MS = 15_000;

// ── HQ image extraction ──────────────────────────────────────────────

interface RawImage {
  url: string;
  priority: number; // lower = better
}

function extractImages(html: string, baseUrl: string): { images: RawImage[]; logo: string | null } {
  const images: RawImage[] = [];
  let logo: string | null = null;

  const resolve = (src: string): string | null => {
    try {
      const url = new URL(src, baseUrl);
      // Force HTTPS to avoid mixed content warnings
      if (url.protocol === "http:") url.protocol = "https:";
      return url.href;
    } catch { return null; }
  };

  // ── Amazon-specific extraction ──────────────────────────────────

  // 1. data-a-dynamic-image: JSON map of {url: [w, h]}
  const dynamicImageMatches = html.matchAll(/data-a-dynamic-image="([^"]+)"/gi);
  for (const m of dynamicImageMatches) {
    try {
      const decoded = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const parsed = JSON.parse(decoded) as Record<string, [number, number]>;
      // Pick the largest image
      let bestUrl = "";
      let bestArea = 0;
      for (const [url, dims] of Object.entries(parsed)) {
        const area = (dims[0] ?? 0) * (dims[1] ?? 0);
        if (area > bestArea) {
          bestArea = area;
          bestUrl = url;
        }
      }
      if (bestUrl) {
        const resolved = resolve(bestUrl);
        if (resolved) images.push({ url: resolved, priority: 0 });
      }
    } catch { /* ignore parse errors */ }
  }

  // 2. colorImages / imageGalleryData in <script> tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const script = scriptMatch[1];

    // colorImages': { 'initial': [{...}] }
    const colorImagesMatch = script.match(/'colorImages'\s*:\s*\{[^}]*'initial'\s*:\s*(\[[\s\S]*?\])\s*\}/);
    if (colorImagesMatch) {
      try {
        const items = JSON.parse(colorImagesMatch[1]) as { hiRes?: string; large?: string }[];
        for (const item of items) {
          const url = item.hiRes || item.large;
          if (url) {
            const resolved = resolve(url);
            if (resolved) images.push({ url: resolved, priority: 1 });
          }
        }
      } catch { /* ignore */ }
    }

    // imageGalleryData
    const galleryMatch = script.match(/imageGalleryData\s*:\s*(\[[\s\S]*?\])\s*[,;]/);
    if (galleryMatch) {
      try {
        const items = JSON.parse(galleryMatch[1]) as { mainUrl?: string; hiRes?: string }[];
        for (const item of items) {
          const url = item.hiRes || item.mainUrl;
          if (url) {
            const resolved = resolve(url);
            if (resolved) images.push({ url: resolved, priority: 1 });
          }
        }
      } catch { /* ignore */ }
    }
  }

  // 3. Amazon URL upscaling: replace small size markers with 1500px
  for (const img of images) {
    img.url = img.url.replace(/\._AC_S[LXY]\d+_\./, "._AC_SL1500_.");
  }

  // ── OG image ────────────────────────────────────────────────────
  const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  if (ogMatch) {
    const resolved = resolve(ogMatch[1]);
    if (resolved) images.push({ url: resolved, priority: 2 });
  }

  // ── Favicon / apple-touch-icon as logo ──────────────────────────
  const iconMatch = html.match(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]+href="([^"]+)"/i)
    ?? html.match(/<link[^>]+href="([^"]+)"[^>]+rel="(?:icon|apple-touch-icon)"/i);
  if (iconMatch) {
    const resolved = resolve(iconMatch[1]);
    if (resolved) logo = resolved;
  }

  // ── <img> tags with srcset and data-src ─────────────────────────
  const imgTagRegex = /<img\s([^>]+)>/gi;
  let imgMatch;
  while ((imgMatch = imgTagRegex.exec(html)) !== null) {
    const attrs = imgMatch[1];

    // Skip tiny/tracking images
    const widthMatch = attrs.match(/width\s*=\s*["']?(\d+)/i);
    const heightMatch = attrs.match(/height\s*=\s*["']?(\d+)/i);
    if (widthMatch && parseInt(widthMatch[1]) < 200) continue;
    if (heightMatch && parseInt(heightMatch[1]) < 200) continue;

    // Try srcset first (pick highest resolution)
    const srcsetMatch = attrs.match(/srcset\s*=\s*["']([^"']+)["']/i);
    if (srcsetMatch) {
      const candidates = srcsetMatch[1].split(",").map(s => s.trim());
      let bestSrc = "";
      let bestW = 0;
      for (const candidate of candidates) {
        const parts = candidate.split(/\s+/);
        const src = parts[0];
        const descriptor = parts[1] ?? "";
        const w = parseInt(descriptor) || 0;
        if (w > bestW || !bestSrc) {
          bestW = w;
          bestSrc = src;
        }
      }
      if (bestSrc) {
        const resolved = resolve(bestSrc);
        if (resolved) images.push({ url: resolved, priority: 3 });
        continue;
      }
    }

    // Try data-src / data-lazy-src (lazy-loaded)
    const dataSrcMatch = attrs.match(/data-(?:lazy-)?src\s*=\s*["']([^"']+)["']/i);
    if (dataSrcMatch) {
      const src = dataSrcMatch[1];
      if (!src.startsWith("data:") && !isTrackingPixel(src)) {
        const resolved = resolve(src);
        if (resolved) images.push({ url: resolved, priority: 4 });
        continue;
      }
    }

    // Regular src
    const srcMatch = attrs.match(/(?:^|\s)src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1];
      if (!src.startsWith("data:") && !isTrackingPixel(src)) {
        const resolved = resolve(src);
        if (resolved) images.push({ url: resolved, priority: 5 });
      }
    }
  }

  // ── Deduplicate by base URL (ignore query params for CDN images) ──
  const seen = new Set<string>();
  const deduped: RawImage[] = [];
  for (const img of images.sort((a, b) => a.priority - b.priority)) {
    const key = deduplicateKey(img.url);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(img);
  }

  return { images: deduped.slice(0, 12), logo };
}

function isTrackingPixel(src: string): boolean {
  return /tracking|pixel|1x1|spacer|beacon|analytics/i.test(src);
}

function deduplicateKey(url: string): string {
  try {
    const u = new URL(url);
    // For Amazon CDN, strip query params and size suffixes
    if (u.hostname.includes("amazon") || u.hostname.includes("ssl-images")) {
      return u.pathname.replace(/\._AC_S[LXY]\d+_/, "._AC_SL1500_");
    }
    // For other CDNs, use pathname only
    return u.hostname + u.pathname;
  } catch {
    return url;
  }
}

// ── Font extraction ──────────────────────────────────────────────────

function extractFonts(html: string): string[] {
  const fonts: string[] = [];
  const gfMatches = html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"&]+)/gi);
  for (const m of gfMatches) {
    fonts.push(
      ...decodeURIComponent(m[1])
        .split("|")
        .map((f) => f.split(":")[0].replace(/\+/g, " "))
    );
  }
  return [...new Set(fonts)];
}

// ── AI image context generation ──────────────────────────────────────

async function generateImageContexts(
  imageUrls: string[],
  productName: string,
  pageText: string
): Promise<string[]> {
  if (imageUrls.length === 0) return [];

  const truncatedText = pageText.slice(0, 2000);
  const urlList = imageUrls.map((u, i) => `${i + 1}. ${u}`).join("\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Product: ${productName}
Page text (excerpt): ${truncatedText}

These images were found on the product page:
${urlList}

For each image, write a brief context description (3-8 words) like "Product front view, white background" or "Lifestyle shot, product in use" or "Size chart" or "Brand logo".

Return ONLY a JSON array of strings, one per image, in the same order:
["description 1", "description 2", ...]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const contexts = JSON.parse(cleaned) as string[];
    // Pad with empty strings if AI returned fewer
    while (contexts.length < imageUrls.length) contexts.push("Product image");
    return contexts;
  } catch {
    return imageUrls.map(() => "Product image");
  }
}

// ── Main route ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastScanTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil(
      (RATE_LIMIT_MS - (now - lastScanTime)) / 1000
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

  try {
    const body = await request.json();
    const url: string = body.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing URL" },
        { status: 400 }
      );
    }

    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    let parsed: URL;
    try {
      parsed = new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    if (!parsed.protocol.startsWith("http")) {
      return NextResponse.json(
        { error: "Only HTTP/HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    // Fetch the page (30s timeout for slow sites)
    let res: Response;
    try {
      res = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (fetchErr) {
      const isTimeout = fetchErr instanceof DOMException && fetchErr.name === "TimeoutError"
        || (fetchErr instanceof Error && /abort|timeout/i.test(fetchErr.message));
      if (isTimeout) {
        return NextResponse.json(
          { error: "This site took too long to respond. It may block automated access. Try a different URL or paste the product info manually." },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: `Could not reach the site. Check the URL and try again.` },
        { status: 422 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page (${res.status}). The site may block automated access.` },
        { status: 422 }
      );
    }

    const html = await res.text();

    // Extract images and fonts from raw HTML
    const { images: rawImages, logo: logoUrl } = extractImages(html, normalizedUrl);
    const fonts = extractFonts(html);

    // Strip HTML to plain text for AI analysis
    const pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText.length < 50) {
      return NextResponse.json(
        { error: "Page has too little text content to analyze" },
        { status: 422 }
      );
    }

    // Upload images to Supabase Storage in parallel
    const rawImageUrls = rawImages.map(i => i.url);
    const uploadResults = await Promise.allSettled(
      rawImageUrls.map(imgUrl => uploadImageFromUrl(imgUrl, user.id))
    );

    // Build uploaded image list (skip failed uploads — keep original URL as fallback)
    const uploadedUrls: string[] = [];
    const originalUrls: string[] = [];
    for (let i = 0; i < uploadResults.length; i++) {
      const result = uploadResults[i];
      if (result.status === "fulfilled") {
        uploadedUrls.push(result.value);
        originalUrls.push(rawImageUrls[i]);
      } else {
        // Fallback: use original URL if upload fails (force HTTPS)
        const safeUrl = rawImageUrls[i].replace(/^http:\/\//i, "https://");
        uploadedUrls.push(safeUrl);
        originalUrls.push(safeUrl);
      }
    }

    // Upload logo too
    let uploadedLogo: string | null = null;
    if (logoUrl) {
      try {
        uploadedLogo = await uploadImageFromUrl(logoUrl, user.id);
      } catch {
        uploadedLogo = logoUrl; // fallback
      }
    }

    // Generate AI context for each image
    const contexts = await generateImageContexts(
      originalUrls,
      pageText.slice(0, 200), // product name hint from page text
      pageText
    );

    // Build FunnelImage array
    const funnelImages: FunnelImage[] = uploadedUrls.map((uploadedUrl, i) => ({
      url: uploadedUrl,
      originalUrl: originalUrls[i],
      context: contexts[i] ?? "Product image",
      isLogo: false,
    }));

    // Add logo as a FunnelImage if found
    if (uploadedLogo) {
      funnelImages.unshift({
        url: uploadedLogo,
        originalUrl: logoUrl!,
        context: "Brand logo",
        isLogo: true,
      });
    }

    // Extract product info (pass uploaded URLs for downstream use)
    const productInfo = await extractProductInfo(pageText, normalizedUrl, {
      fonts,
      imageUrls: funnelImages.filter(i => !i.isLogo).map(i => i.url),
      logoUrl: uploadedLogo,
    });

    lastScanTime = Date.now();

    return NextResponse.json({ productInfo, images: funnelImages });
  } catch (err) {
    console.error("Funnel scan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to scan URL" },
      { status: 500 }
    );
  }
}

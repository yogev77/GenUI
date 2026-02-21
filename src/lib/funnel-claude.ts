import type { PageSpec } from "./funnel-types";
import { anthropicClient as client, setUsageContext } from "./usage";

// ── Types ──────────────────────────────────────────────────────────

export interface FunnelColors {
  primary: string;   // CTA buttons, key accents (hex)
  secondary: string; // headings, bold accents (hex)
  accent: string;    // badges, highlights (hex)
  background: string; // page background (hex)
  dark: string;      // dark sections, footers (hex)
}

export interface FunnelStyle {
  colors: FunnelColors;
  fonts: {
    heading: string;   // e.g. "Poppins" or "system-ui"
    body: string;      // e.g. "Inter" or "system-ui"
  };
  styleNotes: string;  // AI-generated styling instructions
}

export interface ProductInfo {
  productName: string;
  productType: "physical" | "digital" | "service" | "saas";
  description: string;
  price: string;
  targetAudience: string;
  uniqueSellingPoints: string[];
  tone: "professional" | "casual" | "urgent" | "luxury";
  style?: FunnelStyle;
  imageUrls?: string[];
  logoUrl?: string;
  imageContexts?: { url: string; context: string }[];
  /** @deprecated Use style.colors instead */
  colors?: FunnelColors;
}

export interface FunnelKPIs {
  totalVisitors: number;
  pageViews: number;
  ctaClicks: number;
  emailCaptures: number;
  fakePurchases: number;
  avgScrollDepth: number;
  conversionRate: number;
}

export interface ImprovementLog {
  version: number;
  pageName: string;
  reasoning: string;
  timestamp: string;
  kpiSnapshot: FunnelKPIs;
}

export interface Experiment {
  id: string;
  funnelId: string;
  pageName: string;
  status: "running" | "concluded";
  controlComponent: string;
  testComponent: string;
  trafficSplit: number;
  significanceThreshold: number;
  startedAt: string;
  concludedAt?: string;
  winner?: "control" | "test";
  controlStats: { visitors: number; conversions: number };
  testStats: { visitors: number; conversions: number };
}

export interface FunnelConfig {
  id: string;
  productInfo: ProductInfo;
  pages: string[];
  pagesReady: number;
  createdAt: string;
  kpis: FunnelKPIs;
  logs: ImprovementLog[];
  experiments: Experiment[];
  hidden?: boolean;
}

export interface FunnelEvent {
  funnelId: string;
  pageName: string;
  sessionId: string;
  visitorId?: string;
  type:
    | "page_view"
    | "cta_click"
    | "scroll_depth"
    | "email_capture"
    | "purchase"
    | "bounce";
  value?: string | number;
  variant?: "control" | "test";
  timestamp: string;
}

export interface ExperimentIdea {
  pageName: string;
  title: string;
  description: string;
  targetMetric: string;
  reasoning: string;
}

export interface GeneratedFunnelPage {
  componentName: string;
  fileName: string;
  code: string;
  reasoning: string;
}

export interface GeneratedFunnel {
  pages: GeneratedFunnelPage[];
}

// ── Retry wrapper for Anthropic 529 errors ──────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (i === maxRetries || status !== 529) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

// ── JSON repair for truncated AI responses ──────────────────────

async function repairJSON(
  truncatedText: string,
  parseError: string
): Promise<{ componentName: string; code: string }> {
  // Take the last ~2000 chars for context
  const tail = truncatedText.slice(-2000);

  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `A JSON response was truncated and cannot be parsed.

ERROR: ${parseError}

The JSON has this structure:
{ "componentName": "...", "code": "full React component source code" }

Here is the END of the truncated response (last ~2000 chars):
---
${tail}
---

Complete the truncated "code" value and close the JSON properly. The code was cut off mid-component — finish the remaining JSX/logic naturally, close all open tags and braces, and end the component.

Return ONLY valid JSON (no markdown, no code fences):
{ "componentName": "...", "code": "the COMPLETE repaired component code" }`,
        },
      ],
    })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function parseGeneratedPage(rawText: string): { componentName: string; code: string } {
  const cleaned = rawText
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Style generation ──────────────────────────────────────────────

export async function generateStyle(
  productInfo: ProductInfo
): Promise<FunnelStyle> {
  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Generate a visual style for a sales funnel for this product:
Name: ${productInfo.productName}
Type: ${productInfo.productType}
Tone: ${productInfo.tone}
Description: ${productInfo.description}

Return ONLY a JSON object (no markdown):
{
  "colors": {
    "primary": "#hex — main CTA button color, bold and clickable",
    "secondary": "#hex — headings, complementary to primary",
    "accent": "#hex — badges/highlights, a pop color",
    "background": "#hex — very light page background tint",
    "dark": "#hex — dark sections/footer"
  },
  "fonts": {
    "heading": "a Google Font name for headings, e.g. Poppins, Montserrat",
    "body": "a Google Font name for body text, e.g. Inter, Open Sans"
  },
  "styleNotes": "2-3 word visual style description, e.g. minimalist, rounded, airy"
}

Pick colors that match the product's brand feel and tone. Make primary bold and high-contrast. Make background very light (near white). Pick fonts that match the tone.`,
        },
      ],
    })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as FunnelStyle;
}

/** @deprecated Use generateStyle instead */
export async function generateColorPalette(
  productInfo: ProductInfo
): Promise<FunnelColors> {
  const style = await generateStyle(productInfo);
  return style.colors;
}

// ── Extraction ────────────────────────────────────────────────────

export async function extractProductInfo(
  pageText: string,
  url: string,
  hints?: { fonts?: string[]; imageUrls?: string[]; logoUrl?: string | null }
): Promise<ProductInfo> {
  const truncated = pageText.slice(0, 8000);

  const fontHint = hints?.fonts?.length
    ? `\nFONTS FOUND ON PAGE: ${hints.fonts.join(", ")}`
    : "";

  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Extract product information from this web page text. The page URL is: ${url}
${fontHint}

PAGE TEXT:
${truncated}

Return ONLY a JSON object (no markdown, no code fences) with these fields:
{
  "productName": "the product name",
  "productType": "physical" | "digital" | "service" | "saas",
  "description": "a concise 1-3 sentence description of the product",
  "price": "the price if found, or a reasonable estimate like '29.99'",
  "targetAudience": "who this product is for",
  "uniqueSellingPoints": ["point 1", "point 2", "point 3"],
  "tone": "professional" | "casual" | "urgent" | "luxury",
  "style": {
    "colors": {
      "primary": "#hex — main CTA button color, extract from the page's brand or pick a fitting one",
      "secondary": "#hex — headings/bold accent, complementary to primary",
      "accent": "#hex — badges/highlights, a lighter or contrasting pop color",
      "background": "#hex — page background, usually a very light tint of the brand",
      "dark": "#hex — dark sections/footer, a dark shade that works with the palette"
    },
    "fonts": {
      "heading": "font name — use fonts from the page if identified, else pick a fitting Google Font",
      "body": "font name — use fonts from the page if identified, else pick a fitting Google Font"
    },
    "styleNotes": "2-3 word visual style description, e.g. minimalist, rounded, airy"
  }
}

For the colors: if you can identify the brand's primary color from the page text or URL, base the palette on that. Otherwise, pick a palette that fits the product type and tone. All colors must be valid hex codes.
For the fonts: if page fonts were provided above, use those. Otherwise pick Google Fonts that match the tone.
Infer any fields you cannot find directly. Be concise and accurate.`,
        },
      ],
    })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as ProductInfo;

  // Attach images from scan hints
  if (hints?.imageUrls?.length) parsed.imageUrls = hints.imageUrls;
  if (hints?.logoUrl) parsed.logoUrl = hints.logoUrl;

  // Backward compat: populate colors from style
  if (parsed.style && !parsed.colors) {
    parsed.colors = parsed.style.colors;
  }

  return parsed;
}

// ── Generation ─────────────────────────────────────────────────────

export async function generateFunnelPages(
  productInfo: ProductInfo
): Promise<GeneratedFunnel> {
  const message = await withRetry(() =>
    client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 12000,
    messages: [
      {
        role: "user",
        content: `You are building a sales funnel for a product. Generate exactly 3 React page components for a conversion funnel.

PRODUCT INFORMATION:
- Name: ${productInfo.productName}
- Type: ${productInfo.productType}
- Description: ${productInfo.description}
- Price: ${productInfo.price}
- Target Audience: ${productInfo.targetAudience}
- Unique Selling Points: ${productInfo.uniqueSellingPoints.join(", ")}
- Tone: ${productInfo.tone}

Generate these 3 pages:
1. **Landing Page** — Hero section with compelling headline, benefits overview, social proof, and a strong CTA button
2. **Details Page** — Deeper dive into features, testimonials, FAQ section, and email capture form
3. **Checkout Page** — Final persuasion, pricing summary, and integration with a checkout component

CRITICAL REQUIREMENTS:
- Each component is a "use client" React component
- Each component receives a single prop: \`onEvent: (type: string, value?: string | number) => void\`
- Call \`onEvent("cta_click")\` when ANY call-to-action button is clicked
- Call \`onEvent("email_capture", emailValue)\` when an email is submitted
- The checkout page should NOT include its own payment form — instead import and render FakeCheckout:
  \`import FakeCheckout from "@/components/funnel/FakeCheckout";\`
  Pass it: \`<FakeCheckout price="${productInfo.price}" productName="${productInfo.productName}" onPurchase={(email) => { onEvent("email_capture", email); onEvent("purchase"); }} />\`
- Use ONLY Tailwind CSS for styling
- COLOR PALETTE: White-dominant lemonade theme with leaf-* accent colors:
  - Use bg-white for main backgrounds, bg-gray-50 for secondary surfaces
  - text-gray-900 for headings, text-gray-600 for body, text-gray-400 for muted
  - bg-leaf-400 (#F79A19) — orange, primary accent for CTAs and buttons
  - text-leaf-700 / bg-leaf-700 (#BBCB64) — olive green, secondary accents
  - bg-leaf-200 (#FFE52A) — bright yellow, badges and highlights
  - bg-leaf-100 (#FFF9DB) — light yellow, subtle background sections
  - bg-leaf-900 (#CF0F0F) — red, for urgency elements only
  - border-gray-200 for borders, rounded-xl for cards
- Self-contained (no external images, no fetch calls, no localStorage)
- Fully responsive using w-full, max-w-*, flex, grid
- TypeScript: type all useRef and useState calls
- Do NOT import anything except React hooks from 'react' and FakeCheckout (checkout page only)

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "pages": [
    {
      "componentName": "ProductNameLanding",
      "fileName": "ProductNameLanding",
      "reasoning": "brief explanation",
      "code": "full component code"
    },
    {
      "componentName": "ProductNameDetails",
      "fileName": "ProductNameDetails",
      "reasoning": "brief explanation",
      "code": "full component code"
    },
    {
      "componentName": "ProductNameCheckout",
      "fileName": "ProductNameCheckout",
      "reasoning": "brief explanation",
      "code": "full component code"
    }
  ]
}

Use PascalCase for component names derived from the product name. Keep names concise.`,
      },
    ],
  })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  return {
    pages: parsed.pages.map(
      (p: { componentName: string; fileName: string; code: string; reasoning: string }) => ({
        componentName: p.componentName,
        fileName: p.fileName,
        code: p.code,
        reasoning: p.reasoning || "",
      })
    ),
  };
}

// ── Single-page generation (per-step) ─────────────────────────────

export const FUNNEL_PAGE_TYPES = ["landing", "checkout", "thankyou"] as const;
export type FunnelPageType = (typeof FUNNEL_PAGE_TYPES)[number];

const PAGE_LABELS: Record<FunnelPageType, string> = {
  landing: "Landing Page",
  checkout: "Checkout",
  thankyou: "Thank You",
};

// ── Shared prompt helpers ────────────────────────────────────────────

export function buildColorGuide(productInfo: ProductInfo): string {
  const c = productInfo.style?.colors ?? productInfo.colors;
  return c
    ? `- COLOR PALETTE (use these leaf-* Tailwind classes — they are mapped to the brand colors):
  - bg-leaf-100 (${c.background}) — brand background for page sections
  - bg-leaf-400 (${c.primary}) / text-white — primary CTA buttons and key accents
  - text-leaf-700 / bg-leaf-700 (${c.secondary}) — headings and bold accents
  - bg-leaf-900 (${c.accent}) — highlights, badges, emphasis
  - bg-leaf-950 (${c.dark}) — dark sections, footers
  - Use bg-white for card backgrounds, text-gray-900 for strong text, text-gray-500 for muted`
    : `- COLOR PALETTE (use these leaf-* Tailwind classes):
  - bg-leaf-100 (#e8f1fb) — light blue tint for page backgrounds and sections
  - bg-leaf-400 (#338bd5) / text-white — blue for primary CTA buttons and key accents
  - text-leaf-700 / bg-leaf-700 (#2d1f93) — deep purple for headings and bold accents
  - bg-leaf-900 (#2e2e2e) — near-black for dark sections, footers, emphasis
  - Use bg-white for card backgrounds, text-gray-900 for strong text, text-gray-500 for muted`;
}

export function buildFontGuide(productInfo: ProductInfo): string {
  const fonts = productInfo.style?.fonts;
  return fonts && (fonts.heading !== "system-ui" || fonts.body !== "system-ui")
    ? `\n- FONTS: Use font-['${fonts.heading.replace(/ /g, "_")}'] for headings, font-['${fonts.body.replace(/ /g, "_")}'] for body text (Google Fonts loaded via CDN)`
    : "";
}

export function buildImageGuide(productInfo: ProductInfo): string {
  let imageGuide = "";

  if (productInfo.imageContexts?.length) {
    // Rich context: per-image descriptions
    const lines = productInfo.imageContexts
      .filter((ic) => ic.context !== "Brand logo")
      .slice(0, 8)
      .map((ic) => `  - "${ic.url}" — ${ic.context}`);
    if (lines.length > 0) {
      imageGuide = `\n- PRODUCT IMAGES (use these in <img> tags with appropriate alt text):\n${lines.join("\n")}`;
    }
  } else if (productInfo.imageUrls?.length) {
    imageGuide = `\n- PRODUCT IMAGES: You may use these image URLs in <img> tags: ${productInfo.imageUrls.slice(0, 5).map((u) => `"${u}"`).join(", ")}`;
  }

  const logoGuide = productInfo.logoUrl
    ? `\n- BRAND LOGO: Available at "${productInfo.logoUrl}" — use it in the header or hero section`
    : "";
  return imageGuide + logoGuide;
}

function getPagePrompt(
  type: FunnelPageType,
  productInfo: ProductInfo,
  componentName: string,
  hasNextUrl: boolean
): string {
  const colorGuide = buildColorGuide(productInfo);
  const fontGuide = buildFontGuide(productInfo);

  const styleNotes = productInfo.style?.styleNotes
    ? `\n- VISUAL STYLE: ${productInfo.style.styleNotes}`
    : "";

  const imageGuide = buildImageGuide(productInfo);

  const propsType = hasNextUrl
    ? `{ onEvent: (type: string, value?: string | number) => void, nextUrl: string }`
    : `{ onEvent: (type: string, value?: string | number) => void }`;

  const commonReqs = `
CRITICAL REQUIREMENTS:
- The component is a "use client" React component named ${componentName}
- Props: \`${propsType}\`
- Use ONLY Tailwind CSS for styling — use leaf-* custom colors as shown above
${colorGuide}${fontGuide}${styleNotes}${imageGuide}
- Self-contained (no fetch calls, no localStorage). External product images from the URLs above ARE allowed.
- MOBILE FIRST: Design for 375px mobile first, then enhance for larger screens. Stack layouts vertically on mobile (flex-col), horizontal on sm:+ (sm:flex-row). Buttons full-width on mobile (w-full sm:w-auto). Touch targets min 44px. No horizontal scroll. Use responsive text sizes (text-sm on mobile, sm:text-base+).
- Fully responsive using w-full, max-w-*, flex, grid
- TypeScript: type all useRef and useState calls
- Do NOT import anything except React hooks from 'react'${type === "checkout" ? " and FakeCheckout" : ""}

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "componentName": "${componentName}",
  "code": "full component code"
}`;

  switch (type) {
    case "landing":
      return `Generate a sales funnel LANDING PAGE React component.

PRODUCT: ${productInfo.productName} (${productInfo.productType})
Description: ${productInfo.description}
Price: $${productInfo.price}
Target Audience: ${productInfo.targetAudience}
Selling Points: ${productInfo.uniqueSellingPoints.join(", ")}
Tone: ${productInfo.tone}

This page should include:
- A compelling hero section with headline and subheadline on a bg-leaf-100 background
- Key benefits section using the selling points
- Social proof section (realistic testimonials or stats)
- A strong CTA button (bg-leaf-400 text-white) that calls \`onEvent("cta_click")\` and navigates: \`window.location.href = nextUrl\`
${commonReqs}`;

    case "checkout":
      return `Generate a sales funnel CHECKOUT PAGE React component.

PRODUCT: ${productInfo.productName} (${productInfo.productType})
Description: ${productInfo.description}
Price: $${productInfo.price}
Tone: ${productInfo.tone}

This page should:
- Show an order summary card with product name and price
- Include urgency/scarcity elements (limited time, limited stock)
- Import and render FakeCheckout:
  \`import FakeCheckout from "@/components/funnel/FakeCheckout";\`
  \`<FakeCheckout price="${productInfo.price}" productName="${productInfo.productName}" onPurchase={(email) => { onEvent("email_capture", email); onEvent("purchase"); window.location.href = nextUrl; }} />\`
- Include trust badges and a money-back guarantee note below the checkout
- Use bg-leaf-100 for the page background
- DO NOT create your own payment form — use FakeCheckout for that
${commonReqs}`;

    case "thankyou":
      return `Generate a sales funnel THANK YOU / CONFIRMATION PAGE React component.

PRODUCT: ${productInfo.productName} (${productInfo.productType})
Description: ${productInfo.description}
Price: $${productInfo.price}
Tone: ${productInfo.tone}

This page should:
- Display a success/celebration message with a checkmark icon (inline SVG)
- Confirm the purchase with product name and price
- Include a "What happens next" section with 2-3 steps
- Add a small note that this was a demo purchase (no real payment was processed)
- Use bg-leaf-100 for the page background
- This is the final page — no navigation needed
${commonReqs}`;
  }
}

export async function generateSinglePage(
  productInfo: ProductInfo,
  componentName: string,
  pageType: FunnelPageType,
  hasNextUrl: boolean
): Promise<{ componentName: string; code: string }> {
  const prompt = getPagePrompt(pageType, productInfo, componentName, hasNextUrl);

  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return parseGeneratedPage(text);
  } catch (e) {
    console.warn("JSON parse failed, attempting AI repair:", (e as Error).message);
    return repairJSON(text, (e as Error).message);
  }
}

export { PAGE_LABELS };

// ── Spec-based generation (from FunnelBrief) ─────────────────────────

export async function generatePageFromSpec(
  productInfo: ProductInfo,
  componentName: string,
  spec: PageSpec,
  designNotes: string
): Promise<{ componentName: string; code: string }> {
  const colorGuide = buildColorGuide(productInfo);
  const fontGuide = buildFontGuide(productInfo);
  const imageGuide = buildImageGuide(productInfo);

  const styleNotesGuide = designNotes
    ? `\n- DESIGN NOTES: ${designNotes}`
    : productInfo.style?.styleNotes
      ? `\n- VISUAL STYLE: ${productInfo.style.styleNotes}`
      : "";

  const checkoutInstructions = spec.hasCheckout
    ? `\n- This page has a checkout. Import and render FakeCheckout:
  \`import FakeCheckout from "@/components/funnel/FakeCheckout";\`
  \`<FakeCheckout price="${productInfo.price}" productName="${productInfo.productName}" onPurchase={(email) => { onEvent("email_capture", email); onEvent("purchase"); }} />\`
  - DO NOT create your own payment form — use FakeCheckout for that`
    : "";

  const prompt = `Generate a sales funnel page React component: "${spec.name}"

PRODUCT: ${productInfo.productName} (${productInfo.productType})
Description: ${productInfo.description}
Price: $${productInfo.price}
Target Audience: ${productInfo.targetAudience}
Selling Points: ${productInfo.uniqueSellingPoints.join(", ")}
Tone: ${productInfo.tone}

PAGE DESCRIPTION:
${spec.description}

CRITICAL REQUIREMENTS:
- The component is a "use client" React component named ${componentName}
- Props: \`{ onEvent: (type: string, value?: string | number) => void, nextUrl: string }\`
- Call \`onEvent("cta_click")\` when ANY call-to-action button is clicked
- Call \`onEvent("email_capture", emailValue)\` when an email is submitted
- Use ONLY Tailwind CSS for styling — use leaf-* custom colors as shown above
${colorGuide}${fontGuide}${styleNotesGuide}${imageGuide}${checkoutInstructions}
- Self-contained (no fetch calls, no localStorage). External product images from the URLs above ARE allowed.
- MOBILE FIRST: Design for 375px mobile first, then enhance for larger screens. Stack layouts vertically on mobile (flex-col), horizontal on sm:+ (sm:flex-row). Buttons full-width on mobile (w-full sm:w-auto). Touch targets min 44px. No horizontal scroll. Use responsive text sizes (text-sm on mobile, sm:text-base+).
- Fully responsive using w-full, max-w-*, flex, grid
- TypeScript: type all useRef and useState calls
- Do NOT import anything except React hooks from 'react'${spec.hasCheckout ? " and FakeCheckout" : ""}

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "componentName": "${componentName}",
  "code": "full component code"
}`;

  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return parseGeneratedPage(text);
  } catch (e) {
    console.warn("JSON parse failed (spec), attempting AI repair:", (e as Error).message);
    return repairJSON(text, (e as Error).message);
  }
}

// ── Improvement ────────────────────────────────────────────────────

export async function improveFunnelPage(
  pageName: string,
  existingCode: string,
  kpis: FunnelKPIs,
  recentEvents: FunnelEvent[]
): Promise<GeneratedFunnelPage> {
  const eventSummary = summarizeEvents(recentEvents);

  const message = await withRetry(() =>
    client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `You are improving a sales funnel page based on real visitor performance data.

CURRENT PAGE: "${pageName}"

PERFORMANCE DATA:
- Total Visitors: ${kpis.totalVisitors}
- CTA Clicks: ${kpis.ctaClicks} (${kpis.totalVisitors > 0 ? ((kpis.ctaClicks / kpis.totalVisitors) * 100).toFixed(1) : 0}% click rate)
- Email Captures: ${kpis.emailCaptures}
- Purchases: ${kpis.fakePurchases}
- Avg Scroll Depth: ${kpis.avgScrollDepth.toFixed(0)}%
- Conversion Rate: ${(kpis.conversionRate * 100).toFixed(1)}%

RECENT VISITOR BEHAVIOR:
${eventSummary}

CURRENT CODE:
\`\`\`tsx
${existingCode}
\`\`\`

IMPROVE this page to increase conversions. Based on the data:
${kpis.ctaClicks / Math.max(kpis.totalVisitors, 1) < 0.05 ? "- CTA click rate is very low — improve headline, CTA copy, button visibility and placement" : ""}
${kpis.avgScrollDepth < 40 ? "- Most visitors don't scroll far — move key content and CTAs higher" : ""}
${kpis.emailCaptures / Math.max(kpis.totalVisitors, 1) < 0.02 ? "- Email capture rate is low — add better incentive, simplify form" : ""}
${kpis.conversionRate < 0.01 ? "- Conversion rate is very low — add urgency, social proof, reduce friction" : ""}

REQUIREMENTS:
- Keep the same component name and prop signature: \`onEvent: (type: string, value?: string | number) => void\`
- Keep calling onEvent for cta_click, email_capture events
- Use leaf-* Tailwind color palette (leaf-100=#e8f1fb light blue, leaf-400=#338bd5 blue, leaf-700=#2d1f93 purple, leaf-900=#2e2e2e dark)
- Self-contained, responsive, TypeScript-safe
- Make meaningful improvements — better copy, layout, visual hierarchy, social proof, urgency elements

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "componentName": "${pageName}",
  "fileName": "${pageName}",
  "reasoning": "1-2 sentences on what you improved and why",
  "code": "the full improved component code"
}`,
      },
    ],
  })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  return {
    componentName: parsed.componentName,
    fileName: parsed.fileName,
    code: parsed.code,
    reasoning: parsed.reasoning || "",
  };
}

function summarizeEvents(events: FunnelEvent[]): string {
  if (events.length === 0) return "No events recorded yet.";

  const byType: Record<string, number> = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }

  const lines = Object.entries(byType).map(
    ([type, count]) => `- ${type}: ${count} events`
  );

  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;
  lines.push(`- Unique sessions: ${uniqueSessions}`);

  return lines.join("\n");
}

// ── Experiment Ideas ─────────────────────────────────────────────────

export async function generateExperimentIdeas(
  pages: string[],
  kpis: FunnelKPIs,
  recentEvents: FunnelEvent[]
): Promise<ExperimentIdea[]> {
  if (kpis.totalVisitors < 5) return [];

  const eventSummary = summarizeEvents(recentEvents);

  const clickRate = kpis.totalVisitors > 0
    ? ((kpis.ctaClicks / kpis.totalVisitors) * 100).toFixed(1)
    : "0";
  const emailRate = kpis.totalVisitors > 0
    ? ((kpis.emailCaptures / kpis.totalVisitors) * 100).toFixed(1)
    : "0";

  const message = await withRetry(() =>
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a conversion rate optimization expert. Analyze this sales funnel data and suggest 2-4 concrete A/B test experiment ideas.

FUNNEL PAGES: ${pages.join(", ")}

PERFORMANCE DATA:
- Total Visitors: ${kpis.totalVisitors}
- CTA Click Rate: ${clickRate}%
- Email Capture Rate: ${emailRate}%
- Purchases: ${kpis.fakePurchases}
- Avg Scroll Depth: ${kpis.avgScrollDepth.toFixed(0)}%
- Conversion Rate: ${(kpis.conversionRate * 100).toFixed(1)}%

RECENT BEHAVIOR:
${eventSummary}

${kpis.ctaClicks / Math.max(kpis.totalVisitors, 1) < 0.05 ? "WARNING: CTA click rate is very low." : ""}
${kpis.avgScrollDepth < 40 ? "WARNING: Most visitors don't scroll far." : ""}
${kpis.emailCaptures / Math.max(kpis.totalVisitors, 1) < 0.02 ? "WARNING: Email capture rate is very low." : ""}
${kpis.conversionRate < 0.01 ? "WARNING: Conversion rate is very low." : ""}

Return ONLY a JSON array (no markdown, no code fences) of 2-4 experiment ideas:
[
  {
    "pageName": "exact page name from the list above",
    "title": "short title, e.g. Simplify hero CTA",
    "description": "what specific change to make in 1-2 sentences",
    "targetMetric": "the metric this aims to improve, e.g. CTA click rate",
    "reasoning": "why this change is suggested based on the data, 1-2 sentences"
  }
]

Focus on the weakest metrics. Each idea should target a specific page and a specific, measurable improvement.`,
        },
      ],
    })
  );

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const ideas = JSON.parse(cleaned) as ExperimentIdea[];
    // Validate page names — only return ideas for pages that exist
    return ideas.filter((idea) => pages.includes(idea.pageName));
  } catch {
    return [];
  }
}

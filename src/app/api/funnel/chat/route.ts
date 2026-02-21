import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import type { ChatMessage, FunnelBrief } from "@/lib/funnel-types";
import type { ProductInfo } from "@/lib/funnel-claude";
import { anthropicClient as client, setUsageContext } from "@/lib/usage";

let lastChatTime = 0;
const RATE_LIMIT_MS = 3_000;

const SYSTEM_PROMPT = `You are a sales funnel design assistant. Help the user plan their funnel through a brief conversation.

FLOW:
1. Understand their product/service
2. Discuss funnel structure: which pages, in what order
3. Discuss design preferences
4. Present a brief for confirmation — the UI shows a nice card, so keep your text SHORT
5. Wait for the user to explicitly confirm, THEN mark as confirmed

RULES:
- Stay focused on funnel design. Redirect off-topic requests politely.
- Be concise: 2-4 sentences per response, plus a question.
- Suggest 2-3 quick directions after each response (prefixed with >>).
- Do NOT default to 3 pages. Ask what they need. Common patterns:
  - Single landing page (1 page)
  - Landing + Checkout + ThankYou (3)
  - Landing + Features + Pricing + Checkout + ThankYou (5)
  - Landing + Quiz steps + Results + Checkout + ThankYou (6+)
- Limit to 1-20 pages. Block non-funnel requests (app building, etc.).

PRESENTING THE BRIEF:
- When ready, include <brief>JSON</brief> tags with the structured data.
- Your visible reply should be SHORT — just say something like "Here's your funnel plan!" The UI will render a visual card from the JSON. Do NOT describe every page in your text — the card handles that.
- NEVER include <confirmed/> in the same response as <brief>. Always wait for the user to confirm first.
- After the user explicitly confirms (says ok, yes, looks good, etc.), THEN include <confirmed/> in your response.

BRIEF FORMAT (inside <brief> tags):
{
  "pageSpecs": [
    {
      "name": "Landing Page",
      "componentSuffix": "Landing",
      "description": "50-100 word detailed page content description",
      "hasCheckout": false
    }
  ],
  "designNotes": "style/design preferences from conversation"
}

IMPORTANT:
- componentSuffix must be PascalCase with no spaces (e.g. "Landing", "QuizStep1", "Features", "ThankYou")
- hasCheckout should be true for pages that need a payment form
- description should be detailed enough to generate the page (mention specific sections, content, layout)
- Do NOT include productInfo in the brief — it's provided separately
- WHEN UPDATING AN EXISTING FUNNEL: The brief REPLACES all pages. You MUST include every page in pageSpecs — unchanged existing pages AND any new/modified ones. If you omit existing pages, they will be permanently deleted.
- STYLE-ONLY CHANGES: If the user only wants to change colors, fonts, or visual style without modifying page structure, produce a brief with the SAME pageSpecs (identical componentSuffix values in the same order). The system will detect this and apply style changes instantly without regenerating pages.

SUGGESTION FORMAT (always include 2-3 after your response):
>> suggestion text
>> another suggestion`;

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: {
    scanData?: ProductInfo;
    existingFunnel?: {
      productName: string;
      pages: string[];
      productInfo: ProductInfo;
    };
  };
}

function buildContextPrefix(context?: ChatRequestBody["context"]): string {
  if (!context) return "";

  const parts: string[] = [];

  if (context.scanData) {
    const s = context.scanData;
    parts.push(
      `User scanned a URL. Here's what we found:\n` +
      `- Product: ${s.productName} (${s.productType})\n` +
      `- Description: ${s.description}\n` +
      `- Price: $${s.price}\n` +
      `- Audience: ${s.targetAudience}\n` +
      `- Selling Points: ${s.uniqueSellingPoints.join(", ")}\n` +
      `- Tone: ${s.tone}\n` +
      `Use this info as the starting point. Ask the user about their funnel structure.`
    );
  }

  if (context.existingFunnel) {
    const f = context.existingFunnel;
    parts.push(
      `User has an existing funnel for "${f.productName}" with these pages (in order): ${f.pages.join(" → ")}.\n` +
      `They want to update it. Ask what changes they'd like to make.\n\n` +
      `CRITICAL: When you produce the <brief>, you MUST include ALL pages in pageSpecs — both existing pages that stay unchanged AND any new/modified pages. The brief REPLACES the entire funnel. If you only include new pages, the existing pages will be deleted. Always list every page in order.`
    );
  }

  return parts.join("\n\n");
}

function parseResponse(text: string): {
  reply: string;
  done: boolean;
  brief: FunnelBrief | null;
  suggestions: string[];
} {
  let reply = text;
  let done = false;
  let brief: FunnelBrief | null = null;
  const suggestions: string[] = [];

  // Extract <confirmed/>
  if (reply.includes("<confirmed/>") || reply.includes("<confirmed />")) {
    done = true;
    reply = reply.replace(/<confirmed\s*\/>/g, "").trim();
  }

  // Extract <brief>JSON</brief> (or truncated <brief>JSON with no closing tag)
  const briefMatch = reply.match(/<brief>([\s\S]*?)<\/brief>/);
  const truncatedBriefMatch = !briefMatch ? reply.match(/<brief>([\s\S]*)/) : null;
  const briefJson = briefMatch?.[1] ?? truncatedBriefMatch?.[1];
  if (briefJson) {
    try {
      // Try parsing as-is first; if truncated, attempt to repair
      let jsonStr = briefJson.trim();
      if (truncatedBriefMatch) {
        // Try to close truncated JSON: add missing brackets
        if (!jsonStr.endsWith("}")) {
          // Close any open strings, arrays, objects
          jsonStr = jsonStr.replace(/,\s*$/, "");
          jsonStr += ']}';
        }
      }
      const parsed = JSON.parse(jsonStr);
      // brief from AI doesn't include productInfo — we merge it later
      brief = parsed as FunnelBrief;
    } catch {
      // If JSON parse fails, leave brief as null
    }
    // Strip brief tags (and any truncated brief) from visible reply
    reply = reply.replace(/<brief>[\s\S]*?(<\/brief>|$)/g, "").trim();
  }

  // Extract >> suggestions
  const lines = reply.split("\n");
  const replyLines: string[] = [];
  for (const line of lines) {
    const suggestionMatch = line.match(/^>>\s*(.+)/);
    if (suggestionMatch) {
      suggestions.push(suggestionMatch[1].trim());
    } else {
      replyLines.push(line);
    }
  }
  reply = replyLines.join("\n").trim();

  return { reply, done, brief, suggestions };
}

export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastChatTime < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Too fast. Wait a moment." },
      { status: 429 }
    );
  }

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body: ChatRequestBody = await request.json();
    const { messages, context } = body;

    // Build messages for Claude
    const contextPrefix = buildContextPrefix(context);
    const systemPrompt = contextPrefix
      ? `${SYSTEM_PROMPT}\n\nCONTEXT:\n${contextPrefix}`
      : SYSTEM_PROMPT;

    const claudeMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // If no messages yet, add a starter prompt
    if (claudeMessages.length === 0) {
      claudeMessages.push({
        role: "user",
        content: "Hi, I'd like to create a sales funnel.",
      });
    }

    setUsageContext({ userId: user.id, operation: "chat" });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: claudeMessages,
    });

    lastChatTime = Date.now();

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const parsed = parseResponse(text);

    // If we have a brief and context with scanData/existingFunnel, merge productInfo
    if (parsed.brief && context?.scanData) {
      parsed.brief.productInfo = context.scanData;
    } else if (parsed.brief && context?.existingFunnel?.productInfo) {
      parsed.brief.productInfo = context.existingFunnel.productInfo;
    }

    return NextResponse.json({
      reply: parsed.reply,
      done: parsed.done,
      brief: parsed.brief,
      suggestions: parsed.suggestions,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}

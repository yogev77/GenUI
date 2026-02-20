import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAuthClient } from "@/lib/supabase-server";
import type { ChatMessage, FunnelBrief } from "@/lib/funnel-types";
import type { ProductInfo } from "@/lib/funnel-claude";

const client = new Anthropic();

let lastChatTime = 0;
const RATE_LIMIT_MS = 3_000;

const SYSTEM_PROMPT = `You are a sales funnel design assistant. Help the user plan their funnel through a brief conversation.

FLOW:
1. Understand their product/service
2. Discuss funnel structure: which pages, in what order
3. Discuss design preferences
4. Present a structured brief for confirmation

RULES:
- Stay focused on funnel design. Redirect off-topic requests politely.
- Be concise: 2-4 sentences per response, plus a question.
- Suggest 2-3 quick directions after each response (prefixed with >>).
- Do NOT default to 3 pages. Ask what they need. Common patterns:
  - Single landing page (1 page)
  - Landing + Checkout + ThankYou (3)
  - Landing + Features + Pricing + Checkout + ThankYou (5)
  - Landing + Quiz steps + Results + Checkout + ThankYou (6+)
- Limit to 1-10 pages. Block non-funnel requests (app building, etc.).
- When ready, present brief inside <brief>JSON</brief> tags, then ask to confirm.
- After user confirms, include <confirmed/> in your response.

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

  // Extract <brief>JSON</brief>
  const briefMatch = reply.match(/<brief>([\s\S]*?)<\/brief>/);
  if (briefMatch) {
    try {
      const parsed = JSON.parse(briefMatch[1]);
      // brief from AI doesn't include productInfo — we merge it later
      brief = parsed as FunnelBrief;
    } catch {
      // If JSON parse fails, leave brief as null
    }
    reply = reply.replace(/<brief>[\s\S]*?<\/brief>/g, "").trim();
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

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
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

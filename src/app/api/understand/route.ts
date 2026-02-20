import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyCode } from "@/lib/auth";

const client = new Anthropic();

export async function POST(request: Request) {
  // Verify access code
  const accessCode = request.headers.get("x-access-code") || "";
  if (!verifyCode(accessCode)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { message, existingFeatures, conversationHistory } =
      await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const existingList =
      existingFeatures?.length > 0
        ? `Features already on the site: ${existingFeatures.join(", ")}`
        : "No features exist yet.";

    // Build conversation context from prior exchanges
    const priorContext =
      conversationHistory?.length > 0
        ? "\nConversation so far:\n" +
          conversationHistory
            .slice(-6) // last 6 messages for context
            .map(
              (m: { role: string; text: string }) =>
                `${m.role === "user" ? "User" : "GenUI"}: ${m.text}`
            )
            .join("\n")
        : "";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are GenUI's conversational interface. A user is telling you what they want from the site. Your job is to UNDERSTAND their intent and offer 2-4 concrete options as next steps.

${existingList}${priorContext}

The user says: "${message}"

Rules:
- NEVER just agree or execute — always respond with structured options
- Each option should be a concrete, actionable proposal (a specific widget/feature idea or a clarifying question)
- Options should be diverse — offer different interpretations or approaches
- Keep your intro message brief (1 sentence max) — the options are what matters
- If the user is vague, options should help narrow down what they want
- If the user is specific, options should be variations on their idea
- One option can always be "Something else entirely" to let them redirect

SAFETY — NEVER suggest options that would:
- Modify the site's core UI, chat area, generate button, layout, or navigation
- Create admin panels, settings editors, or site management tools
- Build features that control, override, or interact with other features on the site
- Access browser storage, make network requests, or navigate the page
- If the user asks for any of these, politely redirect toward a self-contained widget/toy/tool instead

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "message": "Brief 1-sentence acknowledgment of what they want",
  "options": [
    {
      "label": "Short label (3-6 words)",
      "description": "One sentence describing this option",
      "action": "generate" | "clarify",
      "idea": "If action=generate, the specific feature idea to build. If action=clarify, the follow-up question to ask."
    }
  ]
}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text
      .replace(/^```json?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Understand error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to understand" },
      { status: 500 }
    );
  }
}

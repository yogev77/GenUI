import Anthropic from "@anthropic-ai/sdk";
import type { SitePreferences } from "@/lib/preferences";

const client = new Anthropic();

export interface GeneratedFeature {
  componentName: string;
  fileName: string;
  code: string;
  reasoning: string;
}

export async function generateFeature(
  existingFeatures: string[],
  userPrefs?: SitePreferences | null,
  behaviorContext?: string,
  requestedIdea?: string | null
): Promise<GeneratedFeature> {
  const existingList =
    existingFeatures.length > 0
      ? `Features already on the site (do NOT duplicate): ${existingFeatures.join(", ")}`
      : "The site is empty — you're generating the very first feature!";

  let prefsContext = "";
  if (userPrefs) {
    const parts: string[] = [];
    if (userPrefs.wantMore.length > 0)
      parts.push(
        `User wants more: ${userPrefs.wantMore.join(", ")}`
      );
    if (userPrefs.uiFeedback.length > 0)
      parts.push(
        `UI feedback: ${userPrefs.uiFeedback.join(", ")}`
      );
    if (userPrefs.interactions.length > 0)
      parts.push(
        `Recent interactions: ${userPrefs.interactions.slice(-5).join(" → ")}`
      );
    if (parts.length > 0) {
      prefsContext = `\n\nUser preferences (from their feedback — prioritize these):\n${parts.join("\n")}`;
    }
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are the creative brain of GenUI — a website that evolves itself. Each time a user clicks "Generate", you decide what to add next and build it.

${existingList}${prefsContext}${behaviorContext ? "\n\nBehavioral signals from usage data (use this to decide what to build — lean into what's popular):\n" + behaviorContext : ""}

${requestedIdea ? `\n**USER REQUESTED THIS SPECIFIC FEATURE — build exactly this:**\n"${requestedIdea}"\n` : ""}
You can create ANY of these:
- **Interactive widgets**: mini games, creative tools, sound toys, visual generators, satisfying animations
- **Useful utilities**: timers, converters, calculators, generators, testers
- **Meta / self-aware features**: the site reflecting on its own evolution — a changelog viewer, code stats dashboard, design style randomizer, view mode switcher, site theme generator
- **Improvements to the site experience**: new ways to browse features, visual enhancements, organizational tools

Think about what would be most valuable RIGHT NOW given what already exists and what the user has asked for. Explain your reasoning briefly.

Requirements for the component:
- First line MUST be: "use client";
- Export default a functional React component
- Use ONLY Tailwind CSS for styling (no CSS modules, no styled-components)
- Fully self-contained in a single file — NO external API calls, NO external images/assets, NO external URLs
- You may use inline SVG, CSS animations via Tailwind, Web Audio API, Canvas API
- Use React hooks (useState, useEffect, useRef, useCallback) as needed
- Interactive and visually appealing, compact (~300px card width)
- Do NOT import anything except React hooks from 'react'
- CRITICAL TypeScript rules:
  - Type ALL useRef calls: useRef<HTMLCanvasElement>(null), useRef<number | null>(null), useRef<NodeJS.Timeout | null>(null)
  - Type ALL useState calls with explicit generics when the initial value doesn't convey the type
  - Never use untyped arrays — use proper interfaces or type annotations
  - Guard all .current access on refs with null checks

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "componentName": "PascalCaseName",
  "fileName": "PascalCaseName",
  "reasoning": "1-2 sentences on why you chose this and what value it adds",
  "code": "the full component code as a string"
}`,
      },
    ],
  });

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

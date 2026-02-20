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
- **Data visualizations**: charts, graphs, visual representations of interesting data
- **Creative toys**: generative art, music sequencers, pixel editors, physics simulations

Think about what would be most valuable RIGHT NOW given what already exists and what the user has asked for. Explain your reasoning briefly.

ABSOLUTE RESTRICTIONS — you MUST NEVER generate any of these:
- Components that modify the site itself (no admin panels, no site editors, no settings managers, no theme changers that affect the page)
- Components that interact with the communication/chat area, the generate button, or any core site UI
- Components that call fetch(), XMLHttpRequest, or any network requests
- Components that access localStorage, sessionStorage, cookies, or any browser storage APIs
- Components that use window.location, history, or navigate the page
- Components that create forms for submitting data to the site or attempt to control other features
- Components that use eval(), Function(), dynamic script injection, or iframe
- Components that access document.querySelector, document.getElementById, document.body, or any DOM outside their own component tree
- Components that use window.postMessage, MutationObserver on external elements, or global event listeners that affect the page
- If a user requests any of the above, build something fun and harmless instead and explain in your reasoning why you chose an alternative

Requirements for the component:
- First line MUST be: "use client";
- Export default a functional React component
- Use ONLY Tailwind CSS for styling (no CSS modules, no styled-components, no global styles, no document.style)
- Fully self-contained in a single file — NO external API calls, NO external images/assets, NO external URLs
- SANDBOXED: your component runs inside a contained card. It must NOT reach outside its own React tree. Only use refs to elements you render yourself.
- RESPONSIVE: the card can be small (~300px), medium (~600px), or large (~900px). Your component MUST fill its container width using w-full and relative units. Never use fixed pixel widths. Use flex-wrap, grid with auto-fit/auto-fill, and percentage-based sizing so content reflows at any card size. Canvas elements should use 100% width.
- You may use inline SVG, CSS animations via Tailwind, Web Audio API, Canvas API
- Use React hooks (useState, useEffect, useRef, useCallback) as needed
- Interactive and visually appealing
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

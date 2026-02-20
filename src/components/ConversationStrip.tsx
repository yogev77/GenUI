"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Features from "@/components/features";
import { getPreferences } from "@/lib/preferences";
import { getUsage } from "@/lib/usage";
import { getCode } from "@/lib/auth";

interface ChatMessage {
  role: "user" | "site";
  text: string;
  options?: OptionItem[];
}

interface OptionItem {
  label: string;
  description: string;
  action: "generate" | "clarify";
  idea: string;
}

export default function ConversationStrip({
  frustrationHint,
}: {
  frustrationHint?: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHintRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-expand when there are new messages or loading
  useEffect(() => {
    if (messages.length > 0 || loading || generating) {
      setExpanded(true);
    }
  }, [messages, loading, generating]);

  // Collapse on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (!loading && !generating) {
          setExpanded(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [loading, generating]);

  // When frustration is detected, proactively inject a site message
  useEffect(() => {
    if (!frustrationHint || frustrationHint === lastHintRef.current) return;
    lastHintRef.current = frustrationHint;

    const hints = [
      "I noticed you might be looking for something. Can I help?",
      "Seems like something isn't working as expected. What are you trying to do?",
      "Having trouble? Tell me what you need and I can build it.",
    ];
    const hint = hints[frustrationHint % hints.length];

    setMessages((prev) => [
      ...prev,
      {
        role: "site",
        text: hint,
        options: [
          {
            label: "Something is broken",
            description: "A feature isn't working right",
            action: "clarify" as const,
            idea: "Which feature is giving you trouble? Describe what you expected vs what happened.",
          },
          {
            label: "I want something new",
            description: "Build me a new feature",
            action: "clarify" as const,
            idea: "What kind of feature would be useful to you? Describe your idea.",
          },
          {
            label: "I'm fine, thanks",
            description: "Dismiss this suggestion",
            action: "clarify" as const,
            idea: "No problem! I'm here if you need anything.",
          },
        ],
      },
    ]);
  }, [frustrationHint]);

  const existingFeatures = Object.keys(Features);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", text: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/understand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-code": getCode(),
        },
        body: JSON.stringify({
          message: text.trim(),
          existingFeatures,
          conversationHistory: updated.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const siteMsg: ChatMessage = {
        role: "site",
        text: data.message,
        options: data.options,
      };
      setMessages((prev) => [...prev, siteMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "site", text: "Sorry, something went wrong. Try again?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOption = useCallback(
    async (option: OptionItem) => {
      if (option.action === "clarify") {
        setMessages((prev) => [
          ...prev,
          { role: "user", text: option.label },
          { role: "site", text: option.idea },
        ]);
        inputRef.current?.focus();
        return;
      }

      setGenerating(option.label);
      setMessages((prev) => [...prev, { role: "user", text: option.label }]);

      try {
        const prefs = getPreferences();
        const usage = getUsage();
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-code": getCode(),
          },
          body: JSON.stringify({
            preferences: prefs,
            usage,
            requestedIdea: option.idea,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.deploying) {
          // Production — need Vercel redeploy
          setMessages((prev) => [
            ...prev,
            {
              role: "site",
              text: `Built ${data.feature.replace(/([A-Z])/g, " $1").trim()}! Deploying now — page will refresh shortly.`,
            },
          ]);
          setGenerating(null);
          await new Promise((r) => setTimeout(r, 50000));
          window.location.reload();
          return;
        }

        // Dev — HMR handles it
        setMessages((prev) => [
          ...prev,
          {
            role: "site",
            text: `Built ${data.feature.replace(/([A-Z])/g, " $1").trim()}! ${data.reasoning}`,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "site",
            text: `Couldn't build that — ${err instanceof Error ? err.message : "try again?"}`,
          },
        ]);
      } finally {
        setGenerating(null);
      }
    },
    [existingFeatures]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
    if (e.key === "Escape") {
      setExpanded(false);
      inputRef.current?.blur();
    }
  }

  const isActive = loading || !!generating;
  const hasMessages = messages.length > 0;

  return (
    <div
      ref={containerRef}
      className="sticky top-4 z-30 mx-auto max-w-xl mb-8 transition-all duration-300"
    >
      <div
        className={`rounded-2xl border bg-gray-900/95 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 ${
          expanded
            ? "border-violet-500/40 shadow-violet-500/10"
            : "border-gray-800 hover:border-gray-700"
        }`}
      >
        {/* Messages — only visible when expanded */}
        {expanded && hasMessages && (
          <div
            ref={scrollRef}
            className="flex flex-col gap-1.5 px-3 py-2 overflow-y-auto max-h-[160px] scrollbar-thin animate-in fade-in duration-200"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-2.5 py-1.5 ${
                  msg.role === "user"
                    ? "bg-violet-600/15 self-end max-w-[80%]"
                    : "bg-gray-800/50 self-start max-w-[90%]"
                }`}
              >
                <p
                  className={`text-xs leading-relaxed ${
                    msg.role === "user" ? "text-violet-300" : "text-gray-400"
                  }`}
                >
                  {msg.text}
                </p>

                {msg.options && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {msg.options.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => handleOption(opt)}
                        disabled={isActive}
                        className="rounded-md border border-gray-700 hover:border-violet-500 bg-gray-900/80 hover:bg-violet-600/20 px-2 py-0.5 transition-all cursor-pointer disabled:opacity-50"
                        title={opt.description}
                      >
                        <span className="text-[11px] font-medium text-gray-300 hover:text-violet-300">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isActive && (
              <div className="flex items-center gap-1.5 px-1 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
                {generating && (
                  <span className="ml-1 text-[10px] text-gray-500">
                    Building {generating}...
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input bar — always visible */}
        <div
          className={`flex items-center gap-2 px-3 py-2.5 ${
            expanded && hasMessages ? "border-t border-gray-800/50" : ""
          }`}
        >
          <svg
            className="h-4 w-4 text-gray-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Tell the site what you need..."
            disabled={isActive}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none disabled:opacity-50"
          />
          {input.trim() && (
            <button
              onClick={() => sendMessage(input)}
              disabled={isActive}
              className="shrink-0 text-violet-400 hover:text-violet-300 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

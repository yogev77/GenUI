"use client";

import { useState, useRef, useEffect } from "react";
import * as Features from "@/components/features";
import { getPreferences } from "@/lib/preferences";
import { getUsage } from "@/lib/usage";

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

export default function ConversationStrip() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [messages, loading]);

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
        headers: { "Content-Type": "application/json" },
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

  async function handleOption(option: OptionItem) {
    if (option.action === "clarify") {
      // Site asks a follow-up — show it as a site message then let user respond
      setMessages((prev) => [
        ...prev,
        { role: "user", text: option.label },
        { role: "site", text: option.idea },
      ]);
      inputRef.current?.focus();
      return;
    }

    // action === "generate" — build it
    setGenerating(option.label);
    const userMsg: ChatMessage = {
      role: "user",
      text: option.label,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const prefs = getPreferences();
      const usage = getUsage();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: prefs,
          usage,
          requestedIdea: option.idea,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

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
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="mx-auto max-w-6xl mb-8">
      {/* Strip container */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 overflow-hidden">
        {/* Messages area — horizontal scroll, compact height */}
        {messages.length > 0 && (
          <div
            ref={scrollRef}
            className="flex gap-3 px-4 py-3 overflow-x-auto overflow-y-hidden scrollbar-thin"
            style={{ maxHeight: "220px" }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`shrink-0 max-w-[280px] rounded-xl px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-violet-600/20 border border-violet-700/50"
                    : "bg-gray-800 border border-gray-700"
                }`}
              >
                <p
                  className={`text-sm ${msg.role === "user" ? "text-violet-300" : "text-gray-300"}`}
                >
                  {msg.text}
                </p>

                {/* Options */}
                {msg.options && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {msg.options.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => handleOption(opt)}
                        disabled={!!generating}
                        className="text-left rounded-lg border border-gray-600 hover:border-violet-500/50 bg-gray-900 hover:bg-gray-800 px-2.5 py-1.5 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <span className="text-xs font-medium text-gray-200 group-hover:text-violet-300 block">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {(loading || generating) && (
              <div className="shrink-0 flex items-center px-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce" />
                  <span
                    className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
                {generating && (
                  <span className="ml-2 text-xs text-gray-500">
                    Building {generating}...
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input area */}
        <div
          className={`flex items-center gap-3 px-4 py-3 ${messages.length > 0 ? "border-t border-gray-800" : ""}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell the site what you need..."
            disabled={loading || !!generating}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !!generating}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ProductInfo, FunnelConfig } from "@/lib/funnel-claude";
import type { ChatMessage, FunnelBrief } from "@/lib/funnel-types";

interface FunnelChatProps {
  mode: "create" | "update";
  initialContext?: { scanData?: ProductInfo };
  existingFunnel?: FunnelConfig;
  onComplete: (brief: FunnelBrief) => void;
  onBack?: () => void;
}

export default function FunnelChat({
  mode,
  initialContext,
  existingFunnel,
  onComplete,
  onBack,
}: FunnelChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [brief, setBrief] = useState<FunnelBrief | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestions, brief, scrollToBottom]);

  const buildContext = useCallback(() => {
    const ctx: Record<string, unknown> = {};
    if (initialContext?.scanData) ctx.scanData = initialContext.scanData;
    if (existingFunnel) {
      ctx.existingFunnel = {
        productName: existingFunnel.productInfo.productName,
        pages: existingFunnel.pages,
        productInfo: existingFunnel.productInfo,
      };
    }
    return Object.keys(ctx).length > 0 ? ctx : undefined;
  }, [initialContext, existingFunnel]);

  const sendMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      setSending(true);
      setError("");

      try {
        const res = await fetch("/api/funnel/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ messages: msgs, context: buildContext() }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Chat request failed");

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.reply,
        };
        setMessages([...msgs, assistantMsg]);
        setSuggestions(data.suggestions || []);

        if (data.brief) {
          setBrief(data.brief);
        }

        if (data.done && data.brief) {
          onComplete(data.brief);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSending(false);
      }
    },
    [buildContext, onComplete]
  );

  // Trigger opening message on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    sendMessages([]);
  }, [sendMessages]);

  function handleSend(text?: string) {
    const content = (text || input).trim();
    if (!content || sending) return;

    const userMsg: ChatMessage = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSuggestions([]);
    setBrief(null);
    sendMessages(newMessages);
  }

  function handleConfirm() {
    if (!brief) return;
    onComplete(brief);
  }

  return (
    <div className="flex flex-col h-[500px] max-h-[70vh] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "create"
              ? "Design your funnel"
              : "Update your funnel"}
          </h2>
          <p className="text-xs text-gray-400">
            Describe your vision — the AI will help you plan it
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pb-3 scrollbar-thin"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-gray-50 text-gray-800"
                : "bg-leaf-400/10 text-gray-900 ml-8"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
            <div className="w-4 h-4 rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin" />
            <span className="text-xs text-gray-400">Thinking...</span>
          </div>
        )}

        {/* Brief card */}
        {brief && !sending && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-900">
              Funnel Plan
            </div>

            {brief.productInfo && (
              <div className="text-xs text-gray-500">
                {brief.productInfo.productName} &middot; $
                {brief.productInfo.price}
              </div>
            )}

            <div className="space-y-1.5">
              {brief.pageSpecs.map((spec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-leaf-400/20 text-leaf-700 flex items-center justify-center font-medium text-[10px]">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-gray-800">
                      {spec.name}
                    </span>
                    {spec.hasCheckout && (
                      <span className="ml-1.5 text-[10px] bg-leaf-400/10 text-leaf-700 px-1.5 py-0.5 rounded">
                        checkout
                      </span>
                    )}
                    <p className="text-gray-400 mt-0.5 line-clamp-2">
                      {spec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {brief.designNotes && (
              <p className="text-xs text-gray-400 italic">
                {brief.designNotes}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-leaf-400 text-white text-sm font-medium hover:bg-leaf-400/90 transition-colors cursor-pointer"
              >
                Confirm &amp; Build
              </button>
              <button
                onClick={() => {
                  setBrief(null);
                  handleSend("I'd like to make some changes to the plan.");
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:border-gray-300 transition-colors cursor-pointer"
              >
                Make Changes
              </button>
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        {suggestions.length > 0 && !sending && !brief && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:border-leaf-400 hover:text-leaf-700 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 px-1 pb-1">{error}</p>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-200 pt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Describe your funnel..."
          disabled={sending}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-leaf-400 text-white text-sm font-medium hover:bg-leaf-400/90 transition-colors disabled:opacity-30 cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}

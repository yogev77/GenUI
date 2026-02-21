"use client";

import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";

interface UsageData {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
  callCount: number;
  byOperation: Record<string, { calls: number; costCents: number }>;
  byModel: Record<string, { calls: number; costCents: number; inputTokens: number; outputTokens: number }>;
  recentCalls: {
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    createdAt: string;
  }[];
}

const OP_LABELS: Record<string, string> = {
  chat: "AI Chat",
  scan: "URL Scan",
  create_funnel: "Create Funnel",
  generate_page: "Generate Page",
  improve_page: "Improve Page",
  experiment_ideas: "Experiment Ideas",
  unknown: "Other",
};

const MODEL_LABELS: Record<string, string> = {
  "claude-sonnet-4-20250514": "Sonnet 4",
  "claude-haiku-4-5-20251001": "Haiku 4.5",
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(cents: number): string {
  if (cents < 1) return `${(cents * 10).toFixed(1)}‰`;
  return `$${(cents / 100).toFixed(2)}`;
}

function ProfileInner() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/funnel/usage", { credentials: "include" });
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-leaf-400 transition-colors"
          >
            &larr; Home
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
          </div>
        ) : !usage || usage.callCount === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400">No API usage yet. Create a funnel to get started.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">API Calls</div>
                <div className="text-xl font-bold text-gray-900">{usage.callCount}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Input Tokens</div>
                <div className="text-xl font-bold text-gray-900">{formatTokens(usage.totalInputTokens)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Output Tokens</div>
                <div className="text-xl font-bold text-gray-900">{formatTokens(usage.totalOutputTokens)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Anthropic Cost</div>
                <div className="text-xl font-bold text-gray-900">{formatCost(usage.totalCostCents)}</div>
              </div>
            </div>

            {/* By operation */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-600 mb-3">By Operation</h2>
              <div className="space-y-2">
                {Object.entries(usage.byOperation)
                  .sort((a, b) => b[1].costCents - a[1].costCents)
                  .map(([op, data]) => (
                    <div key={op} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{OP_LABELS[op] ?? op}</span>
                        <span className="text-xs text-gray-400">{data.calls} calls</span>
                      </div>
                      <span className="font-mono text-gray-600">{formatCost(data.costCents)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* By model */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-600 mb-3">By Model</h2>
              <div className="space-y-2">
                {Object.entries(usage.byModel)
                  .sort((a, b) => b[1].costCents - a[1].costCents)
                  .map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{MODEL_LABELS[model] ?? model}</span>
                        <span className="text-xs text-gray-400">
                          {data.calls} calls &middot; {formatTokens(data.inputTokens)} in / {formatTokens(data.outputTokens)} out
                        </span>
                      </div>
                      <span className="font-mono text-gray-600">{formatCost(data.costCents)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent calls */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-600 mb-3">Recent Calls</h2>
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {usage.recentCalls.map((call, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono w-16 shrink-0">
                        {new Date(call.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-gray-700">{OP_LABELS[call.operation] ?? call.operation}</span>
                      <span className="text-gray-400">
                        {formatTokens(call.inputTokens + call.outputTokens)} tokens
                      </span>
                    </div>
                    <span className="font-mono text-gray-500">{formatCost(call.costCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <AuthGate>
        <ProfileInner />
      </AuthGate>
    </AuthProvider>
  );
}

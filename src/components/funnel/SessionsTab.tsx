"use client";

import { useState, useEffect } from "react";
import type { AggregatedSession } from "@/lib/funnel-db";

interface Props {
  funnelId: string;
}

const OUTCOME_COLORS = {
  converted: "bg-green-100 text-green-700",
  engaged: "bg-amber-100 text-amber-700",
  bounced: "bg-gray-100 text-gray-500",
};

export default function SessionsTab({ funnelId }: Props) {
  const [sessions, setSessions] = useState<AggregatedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "control" | "test">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/funnel/sessions?funnelId=${encodeURIComponent(funnelId)}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [funnelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? sessions
      : sessions.filter((s) => s.variant === filter);

  const counts = {
    all: sessions.length,
    control: sessions.filter((s) => s.variant === "control").length,
    test: sessions.filter((s) => s.variant === "test").length,
  };

  return (
    <div className="space-y-4">
      {/* Variant filter */}
      {(counts.control > 0 || counts.test > 0) && (
        <div className="flex gap-2">
          {(["all", "control", "test"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === f
                  ? "bg-leaf-400 text-white"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No sessions recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((session) => {
            const isExpanded = expandedId === session.sessionId;
            return (
              <div
                key={session.sessionId}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : session.sessionId)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${OUTCOME_COLORS[session.outcome]}`}
                    >
                      {session.outcome}
                    </span>
                    <span className="text-sm text-gray-600 truncate">
                      {session.pages.join(" → ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
                    {session.variant && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {session.variant}
                      </span>
                    )}
                    <span>{formatDuration(session.durationMs)}</span>
                    <span>{new Date(session.startedAt).toLocaleString()}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-gray-100">
                    <div className="space-y-1 pt-2">
                      {session.events.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="text-gray-400 w-16 shrink-0">
                            {new Date(e.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-leaf-700 font-mono">
                            {e.type}
                          </span>
                          <span className="text-gray-500">{e.pageName}</span>
                          {e.value !== undefined && (
                            <span className="text-gray-400">
                              = {String(e.value)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  return `${minutes}m ${remainingSec}s`;
}

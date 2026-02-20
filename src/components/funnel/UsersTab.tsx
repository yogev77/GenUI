"use client";

import { useState, useEffect } from "react";
import type { AggregatedVisitor } from "@/lib/funnel-db";

interface Props {
  funnelId: string;
}

export default function UsersTab({ funnelId }: Props) {
  const [visitors, setVisitors] = useState<AggregatedVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/funnel/visitors?funnelId=${encodeURIComponent(funnelId)}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setVisitors(data.visitors);
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

  const withEmail = visitors.filter((v) => v.email);
  const purchased = visitors.filter((v) => v.purchased);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-500">
          <span className="font-semibold text-gray-900">{visitors.length}</span> visitors
        </span>
        <span className="text-gray-500">
          <span className="font-semibold text-gray-900">{withEmail.length}</span> with email
        </span>
        <span className="text-gray-500">
          <span className="font-semibold text-leaf-400">{purchased.length}</span> purchased
        </span>
      </div>

      {visitors.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No visitors recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visitors.map((visitor) => (
            <div
              key={visitor.visitorId}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm"
            >
              {/* Email */}
              <div className="min-w-0 flex-1">
                {visitor.email ? (
                  <span className="text-sm text-gray-900 font-medium truncate block">
                    {visitor.email}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400 italic">Anonymous</span>
                )}
                <span className="text-xs text-gray-400">
                  {visitor.sessionCount} session{visitor.sessionCount !== 1 ? "s" : ""}
                  {" · "}
                  {visitor.pages.length}/{visitor.totalPages} pages
                </span>
              </div>

              {/* Completion bar */}
              <div className="w-24 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        visitor.completionPct === 100 ? "bg-green-400" : "bg-leaf-400"
                      }`}
                      style={{ width: `${visitor.completionPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {visitor.completionPct}%
                  </span>
                </div>
              </div>

              {/* Purchased */}
              <div className="w-8 shrink-0 text-center">
                {visitor.purchased ? (
                  <svg
                    className="w-5 h-5 text-green-500 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-gray-300">&mdash;</span>
                )}
              </div>

              {/* Last seen */}
              <span className="text-xs text-gray-400 shrink-0 w-20 text-right">
                {formatRelativeTime(visitor.lastSeenAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

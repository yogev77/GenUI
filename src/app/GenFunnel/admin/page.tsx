"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";

const ADMIN_EMAIL = "yogev77@gmail.com";

interface PageStatus {
  name: string;
  order: number;
  ready: boolean;
  error: string | null;
}

interface FunnelStatus {
  id: string;
  productName: string;
  totalPages: number;
  pagesReady: number;
  createdAt: string;
  hidden: boolean;
  pages: PageStatus[];
  recentErrors: { page_name: string; error: string; created_at: string }[];
}

function AdminInner() {
  const { user } = useAuth();
  const [funnels, setFunnels] = useState<FunnelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFunnels = useCallback(async () => {
    try {
      const res = await fetch("/api/funnel/admin-status", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setFunnels(data.funnels ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunnels();
    const interval = setInterval(loadFunnels, 5000);
    return () => clearInterval(interval);
  }, [loadFunnels]);

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied.</p>
      </div>
    );
  }

  async function handleRetrigger(funnelId: string) {
    setActionId(funnelId);
    try {
      await fetch("/api/funnel/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ funnelId }),
      });
      await loadFunnels();
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  }

  const incomplete = funnels.filter((f) => f.pagesReady < f.totalPages && !f.hidden);
  const withErrors = funnels.filter((f) => f.pages.some((p) => p.error));
  const complete = funnels.filter((f) => f.pagesReady >= f.totalPages && !f.hidden);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-400">
              Generation processes &middot; Auto-refreshes every 5s
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-leaf-400 transition-colors"
          >
            &larr; Home
          </a>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
          </div>
        )}

        {/* Errors section */}
        {withErrors.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
              Errors ({withErrors.length})
            </h2>
            {withErrors.map((f) => {
              const errorPages = f.pages.filter((p) => p.error);
              return (
                <div
                  key={`err-${f.id}`}
                  className="bg-white border border-red-200 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {f.productName}
                      </span>
                      <span className="text-xs text-gray-400 ml-2 font-mono">
                        {f.id.slice(0, 16)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRetrigger(f.id)}
                      disabled={actionId === f.id}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-leaf-400 text-white hover:bg-leaf-400/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionId === f.id ? "..." : "Re-trigger"}
                    </button>
                  </div>
                  {errorPages.map((p) => (
                    <div
                      key={p.name}
                      className="bg-red-50 border border-red-100 rounded-lg p-3"
                    >
                      <div className="text-xs font-medium text-red-700">
                        Page {p.order + 1}: {p.name}
                      </div>
                      <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-words font-mono">
                        {p.error}
                      </pre>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* In Progress */}
        {incomplete.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
              In Progress ({incomplete.length})
            </h2>
            {incomplete.map((f) => {
              const expanded = expandedId === f.id;
              return (
                <div
                  key={f.id}
                  className="bg-white border border-amber-200 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setExpandedId(expanded ? null : f.id)
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-semibold text-gray-900">
                        {f.productName}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {f.id.slice(0, 16)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-amber-600">
                        {f.pagesReady}/{f.totalPages}
                      </span>
                      <button
                        onClick={() => handleRetrigger(f.id)}
                        disabled={actionId === f.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-leaf-400 text-white hover:bg-leaf-400/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionId === f.id ? "..." : "Re-trigger"}
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{
                        width: `${(f.pagesReady / f.totalPages) * 100}%`,
                      }}
                    />
                  </div>
                  {/* Expanded page details */}
                  {expanded && (
                    <div className="space-y-1 pt-2">
                      {f.pages.map((p) => (
                        <div
                          key={p.name}
                          className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                            p.error
                              ? "bg-red-50 text-red-600"
                              : p.ready
                                ? "text-green-600"
                                : "text-gray-400"
                          }`}
                        >
                          {p.ready ? (
                            <span className="text-green-500">&#10003;</span>
                          ) : p.error ? (
                            <span className="text-red-500">&#10007;</span>
                          ) : (
                            <span className="text-gray-300">&#9675;</span>
                          )}
                          <span className="font-medium">{p.name}</span>
                          {p.error && (
                            <span className="text-red-400 font-mono ml-2 truncate max-w-[300px]">
                              {p.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Recent error logs */}
                  {expanded && f.recentErrors?.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-gray-100">
                      <div className="text-xs font-semibold text-red-500">Error Log</div>
                      {f.recentErrors.map((log, i) => (
                        <div key={i} className="bg-red-50 rounded px-2 py-1.5 text-xs">
                          <div className="flex items-center gap-2 text-red-400">
                            <span className="font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                            <span className="font-medium">{log.page_name}</span>
                          </div>
                          <pre className="text-red-600 font-mono mt-0.5 whitespace-pre-wrap break-words">
                            {log.error}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Created {new Date(f.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Complete */}
        {!loading && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Complete ({complete.length})
            </h2>
            {complete.length === 0 && (
              <p className="text-sm text-gray-400">No funnels.</p>
            )}
            {complete.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-900">
                    {f.productName}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {f.totalPages} pages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-500">All pages ready</span>
                  <a
                    href={`/GenFunnel/dashboard/${f.id}`}
                    className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AuthGate>
        <AdminInner />
      </AuthGate>
    </AuthProvider>
  );
}

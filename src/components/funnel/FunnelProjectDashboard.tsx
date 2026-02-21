"use client";

import { useState } from "react";
import type { FunnelConfig } from "@/lib/funnel-claude";
import type { FunnelBrief } from "@/lib/funnel-types";
import FunnelChat from "./FunnelChat";
import UsersTab from "./UsersTab";
import SessionsTab from "./SessionsTab";
import BriefEditor from "./BriefEditor";
import ExperimentsTab from "./ExperimentsTab";
import UpdateLogTab from "./UpdateLogTab";
import AnalyticsTab from "./AnalyticsTab";

interface Props {
  funnel: FunnelConfig;
  onFunnelUpdate: (funnel: FunnelConfig) => void;
}

const TABS = ["Analytics", "Users", "Sessions", "Brief", "Experiments", "Log"] as const;
type Tab = (typeof TABS)[number];

function getFriendlyPageNames(pages: string[]): string[] {
  if (pages.length === 0) return [];
  if (pages.length === 1) {
    const m = pages[0].match(/\d([A-Z][a-z].*)$/);
    return [m ? m[1].replace(/([A-Z])/g, " $1").trim() : pages[0]];
  }
  let prefix = pages[0];
  for (let i = 1; i < pages.length; i++) {
    while (!pages[i].startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return pages.map((p) => {
    const suffix = p.slice(prefix.length);
    return suffix ? suffix.replace(/([A-Z])/g, " $1").trim() : "Page";
  });
}

export default function FunnelProjectDashboard({ funnel, onFunnelUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Analytics");
  const [chatOpen, setChatOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ current: number; total: number; names: string[] } | null>(null);
  const [trashing, setTrashing] = useState(false);

  async function handleTrash() {
    if (trashing) return;
    setTrashing(true);
    try {
      const res = await fetch("/api/funnel/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ funnelId: funnel.id }),
      });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch {
      // ignore
    } finally {
      setTrashing(false);
    }
  }

  function isStyleOnlyUpdate(brief: FunnelBrief): boolean {
    // Derive expected page names from pageSpecs (same logic as brief API)
    const slug = funnel.id.replace(/-[a-z0-9]{6}$/, "");
    const pascal = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
    const expectedPages = brief.pageSpecs.map(
      (s) => `${pascal}${s.componentSuffix}`
    );
    // Compare against existing pages
    if (expectedPages.length !== funnel.pages.length) return false;
    return expectedPages.every((p, i) => p === funnel.pages[i]);
  }

  async function handleUpdateComplete(brief: FunnelBrief) {
    setChatOpen(false);
    setUpdating(true);
    setUpdateProgress(null);

    const styleOnly = isStyleOnlyUpdate(brief);

    try {
      // Update brief — omit pageSpecs when only style changed
      const briefRes = await fetch("/api/funnel/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          funnelId: funnel.id,
          productInfo: brief.productInfo,
          designNotes: brief.designNotes,
          ...(styleOnly ? {} : { pageSpecs: brief.pageSpecs }),
        }),
      });

      if (!briefRes.ok) {
        const data = await briefRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update funnel");
      }

      if (!styleOnly) {
        const { funnel: updated } = await briefRes.json();
        const pageCount = updated.pages.length;
        const names = brief.pageSpecs.map((s) => s.name);
        setUpdateProgress({ current: 0, total: pageCount, names });

        // Kick off server-side generation
        await fetch("/api/funnel/generate-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ funnelId: funnel.id }),
        });

        // Poll for progress
        await new Promise<void>((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const res = await fetch(
                `/api/funnel/list?funnelId=${funnel.id}`,
                { credentials: "include" }
              );
              if (!res.ok) return;
              const data = await res.json();
              const ready = data.funnel?.pagesReady ?? 0;
              setUpdateProgress((prev) =>
                prev ? { ...prev, current: ready } : null
              );

              if (ready >= pageCount) {
                clearInterval(poll);
                resolve();
              }
            } catch (err) {
              clearInterval(poll);
              reject(err);
            }
          }, 3000);
        });
      }

      // Reload funnel data
      const listRes = await fetch(`/api/funnel/list?id=${funnel.id}`, {
        credentials: "include",
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const refreshed = listData.funnels?.find(
          (f: FunnelConfig) => f.id === funnel.id
        );
        if (refreshed) onFunnelUpdate(refreshed);
      }
    } catch (err) {
      console.error("Update with AI error:", err);
    } finally {
      setUpdating(false);
      setUpdateProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Chat modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg sm:mx-4 p-4 sm:p-6 max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
            <FunnelChat
              mode="update"
              existingFunnel={funnel}
              onComplete={handleUpdateComplete}
              onBack={() => setChatOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Updating overlay */}
      {updating && updateProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin" />
            <p className="text-lg font-semibold text-gray-900">
              Regenerating pages...
            </p>
            <p className="text-sm text-gray-500">
              Page {updateProgress.current + 1} of {updateProgress.total}
            </p>
            <div className="space-y-1.5 text-left">
              {updateProgress.names.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {i < updateProgress.current ? (
                    <svg className="w-4 h-4 text-leaf-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i === updateProgress.current ? (
                    <div className="w-4 h-4 rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
                  )}
                  <span className={i <= updateProgress.current ? "text-gray-800" : "text-gray-400"}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar — back + actions on same row */}
      <div className="flex items-center justify-between mb-4">
        <a
          href="/"
          className="text-gray-400 text-sm hover:text-leaf-400 transition-colors"
        >
          &larr; Home
        </a>
        <div className="flex items-center gap-2">
          <a
            href={`/f/${funnel.pages[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-leaf-400 hover:text-leaf-700 transition-colors"
            title="View funnel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <button
            onClick={() => setChatOpen(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-600 hover:border-leaf-400 hover:text-leaf-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Update with AI
          </button>
          <button
            onClick={handleTrash}
            disabled={trashing}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Move to trash"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-marker tracking-tight text-gray-900">
          {funnel.productInfo.productName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          <span className="capitalize">{funnel.productInfo.productType}</span>
          {" · "}${funnel.productInfo.price}
          {" · "}Created {new Date(funnel.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        <KPICard label="Visitors" value={funnel.kpis.totalVisitors.toString()} />
        <KPICard label="Page Views" value={funnel.kpis.pageViews.toString()} />
        <KPICard label="CTA Clicks" value={funnel.kpis.ctaClicks.toString()} />
        <KPICard label="Emails" value={funnel.kpis.emailCaptures.toString()} />
        <KPICard label="Purchases" value={funnel.kpis.fakePurchases.toString()} />
        <KPICard label="Avg Scroll" value={`${funnel.kpis.avgScrollDepth.toFixed(0)}%`} />
        <KPICard
          label="Conversion"
          value={`${(funnel.kpis.conversionRate * 100).toFixed(1)}%`}
          highlight
        />
      </div>

      {/* Funnel steps */}
      {(() => {
        const names = getFriendlyPageNames(funnel.pages);
        return (
          <div className="flex flex-wrap gap-1.5">
            {funnel.pages.map((page, i) => (
              <span key={page} className="inline-flex items-center gap-1 text-xs">
                <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                  {i + 1}
                </span>
                <a
                  href={`/f/${page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-leaf-400 hover:text-leaf-700 transition-colors"
                >
                  {names[i]}
                </a>
                {i < funnel.pages.length - 1 && (
                  <span className="text-gray-300 ml-0.5">→</span>
                )}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer rounded-t-lg ${
                activeTab === tab
                  ? "bg-white text-gray-900 border-b-2 border-leaf-400"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "Analytics" && <AnalyticsTab funnelId={funnel.id} />}
      {activeTab === "Users" && <UsersTab funnelId={funnel.id} />}
      {activeTab === "Sessions" && <SessionsTab funnelId={funnel.id} />}
      {activeTab === "Brief" && (
        <BriefEditor funnel={funnel} onUpdate={onFunnelUpdate} />
      )}
      {activeTab === "Experiments" && (
        <ExperimentsTab funnel={funnel} onUpdate={onFunnelUpdate} />
      )}
      {activeTab === "Log" && <UpdateLogTab logs={funnel.logs || []} />}
    </div>
  );
}

function KPICard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center border border-gray-100">
      <div
        className={`text-sm sm:text-lg font-bold ${highlight ? "text-leaf-400" : "text-gray-900"}`}
      >
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-gray-400">{label}</div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FunnelConfig } from "@/lib/funnel-claude";

interface FunnelDashboardProps {
  onCreateNew: () => void;
}

type DeployStatus = "deploying" | "live";
type Tab = "active" | "trash";
const PAGE_NAMES = ["Landing Page", "Checkout", "Thank You"];

/** Extract friendly page names by stripping the common prefix from component names */
function getFriendlyPageNames(pages: string[]): string[] {
  if (pages.length === 0) return [];
  if (pages.length === 1) {
    // Try to extract suffix after last digit sequence or just use the full name
    const m = pages[0].match(/\d([A-Z][a-z].*)$/);
    return [m ? m[1].replace(/([A-Z])/g, " $1").trim() : pages[0]];
  }
  // Find longest common prefix
  let prefix = pages[0];
  for (let i = 1; i < pages.length; i++) {
    while (!pages[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }
  return pages.map((p) => {
    const suffix = p.slice(prefix.length);
    // Add spaces before capitals: "ThankYou" → "Thank You"
    return suffix ? suffix.replace(/([A-Z])/g, " $1").trim() : `Page`;
  });
}

async function checkPageLive(pageName: string): Promise<boolean> {
  try {
    const res = await fetch(`/f/${pageName}`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export default function FunnelDashboard({ onCreateNew }: FunnelDashboardProps) {
  const [allFunnels, setAllFunnels] = useState<FunnelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyError, setBusyError] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [deployStatuses, setDeployStatuses] = useState<Record<string, DeployStatus>>({});
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [resumeProgress, setResumeProgress] = useState(0); // pages generated so far
  const [resumeError, setResumeError] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const activeFunnels = allFunnels.filter((f) => !f.hidden);
  const trashFunnels = allFunnels.filter((f) => f.hidden);
  const funnels = tab === "active" ? activeFunnels : trashFunnels;

  const loadFunnels = useCallback(async () => {
    try {
      const res = await fetch("/api/funnel/list", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAllFunnels(data.funnels);
        return data.funnels as FunnelConfig[];
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    return [] as FunnelConfig[];
  }, []);

  useEffect(() => {
    loadFunnels().then((loaded) => {
      const statuses: Record<string, DeployStatus> = {};
      for (const f of loaded) {
        if (f.hidden) continue;
        const ageMs = Date.now() - new Date(f.createdAt).getTime();
        statuses[f.id] = ageMs < 120_000 && f.kpis.totalVisitors === 0 ? "deploying" : "live";
      }
      setDeployStatuses(statuses);
    });
  }, [loadFunnels]);

  // Poll deploying funnels
  useEffect(() => {
    const hasDeploying = Object.values(deployStatuses).some((s) => s === "deploying");
    if (!hasDeploying) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      const updated = { ...deployStatuses };
      let changed = false;
      for (const f of activeFunnels) {
        if (updated[f.id] === "deploying" && f.pages.length > 0) {
          const live = await checkPageLive(f.pages[0]);
          const ageMs = Date.now() - new Date(f.createdAt).getTime();
          if (live || ageMs > 180_000) {
            updated[f.id] = "live";
            changed = true;
          }
        }
      }
      if (changed) setDeployStatuses(updated);
    }, 10_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [deployStatuses, activeFunnels]);

  async function handleApiAction(
    url: string,
    body: Record<string, unknown>,
    funnelId: string,
    label: string,
    onSuccess?: () => void
  ) {
    setActionId(funnelId);
    setActionLabel(label);
    setBusyError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        const data = await res.json();
        setBusyError(data.error || "Another operation is in progress. Please wait.");
        return;
      }
      if (res.ok) {
        setConfirmId(null);
        await loadFunnels();
        onSuccess?.();
      }
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  }

  function handleHide(funnelId: string) {
    handleApiAction("/api/funnel/delete", { funnelId }, funnelId, "Hiding...", () => {
      if (activeFunnels.length <= 1) onCreateNew();
    });
  }

  function handleRestore(funnelId: string) {
    handleApiAction("/api/funnel/restore", { funnelId }, funnelId, "Restoring...");
  }

  function handlePermanentDelete(funnelId: string) {
    handleApiAction("/api/funnel/delete", { funnelId, permanent: true }, funnelId, "Deleting permanently...");
  }

  async function handleResumeGeneration(funnel: FunnelConfig) {
    setResumingId(funnel.id);
    setResumeProgress(funnel.pagesReady);
    setResumeError("");

    let lastReady = funnel.pagesReady;
    let lastChangeAt = Date.now();
    let retries = 0;
    const MAX_RETRIES = 3;

    try {
      // Kick off server-side generation
      const kickRes = await fetch("/api/funnel/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ funnelId: funnel.id }),
      });
      if (!kickRes.ok) {
        const data = await kickRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start generation");
      }

      // Poll for progress with auto-retrigger
      const poll = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/funnel/list?funnelId=${funnel.id}`,
            { credentials: "include" }
          );
          if (!res.ok) return;
          const data = await res.json();
          const ready = data.funnel?.pagesReady ?? funnel.pagesReady;
          setResumeProgress(ready);

          if (ready > lastReady) {
            lastReady = ready;
            lastChangeAt = Date.now();
            retries = 0;
          }

          if (ready >= funnel.pages.length) {
            clearInterval(poll);
            setResumingId(null);
            await loadFunnels();
            return;
          }

          // Stall: auto-retrigger up to MAX_RETRIES
          if (Date.now() - lastChangeAt > 75_000) {
            if (retries < MAX_RETRIES) {
              retries++;
              lastChangeAt = Date.now();
              fetch("/api/funnel/generate-all", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ funnelId: funnel.id }),
              }).catch(() => {});
            } else {
              clearInterval(poll);
              setResumeError(`Generation failed after ${MAX_RETRIES} retries. Click Resume to try again.`);
              setResumingId(null);
              await loadFunnels();
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 3000);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Generation failed");
      setResumingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tab bar + create button */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab("active")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === "active"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Active{activeFunnels.length > 0 ? ` (${activeFunnels.length})` : ""}
          </button>
          {trashFunnels.length > 0 && (
            <button
              onClick={() => setTab("trash")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "trash"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Trash ({trashFunnels.length})
            </button>
          )}
        </div>
        <button
          onClick={onCreateNew}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-leaf-400 text-white font-medium hover:bg-leaf-400/90 transition-colors text-sm cursor-pointer shrink-0"
        >
          New Funnel
        </button>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {tab === "active" ? "Your Funnels" : "Trash"}
      </h2>

      {(busyError || resumeError) && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {busyError || resumeError}
          <button onClick={() => { setBusyError(""); setResumeError(""); }} className="ml-auto text-amber-400 hover:text-amber-600 cursor-pointer">&times;</button>
        </div>
      )}

      {funnels.map((funnel) => {
        const isActioning = actionId === funnel.id;
        const isConfirming = confirmId === funnel.id;
        const status = deployStatuses[funnel.id] || "live";
        const isDeploying = status === "deploying" && !funnel.hidden;

        return (
          <div
            key={funnel.id}
            className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm relative transition-opacity ${
              isActioning ? "opacity-50 pointer-events-none" : ""
            } ${funnel.hidden ? "border-dashed" : ""}`}
          >
            {/* Action overlay */}
            {isActioning && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-2xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-leaf-400 animate-spin" />
                  {actionLabel}
                </div>
              </div>
            )}

            {/* Deploy progress bar */}
            {isDeploying && (
              <div className="h-1 bg-gray-100 overflow-hidden">
                <div className="h-full bg-leaf-400 rounded-r-full animate-pulse" style={{ width: "60%" }} />
              </div>
            )}

            <div className="px-4 sm:px-6 py-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <FunnelThumb productInfo={funnel.productInfo} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`/GenFunnel/dashboard/${funnel.id}`}
                      className="text-base sm:text-lg font-bold text-gray-900 truncate hover:text-leaf-700 transition-colors"
                    >
                      {funnel.productInfo.productName}
                    </a>
                    {funnel.pagesReady < funnel.pages.length && !isDeploying && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs border border-amber-200 shrink-0">
                        {resumingId === funnel.id ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                        Incomplete
                      </span>
                    )}
                    {isDeploying && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs border border-amber-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Deploying
                      </span>
                    )}
                    {funnel.hidden && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-xs shrink-0">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 capitalize">
                      {funnel.productInfo.productType}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 capitalize">
                      {funnel.productInfo.tone}
                    </span>
                    <span className="text-xs text-gray-400">
                      ${funnel.productInfo.price}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {tab === "trash" ? (
                    <>
                      <button
                        onClick={() => handleRestore(funnel.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Restore
                      </button>
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(funnel.id)}
                            className="px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50 cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(funnel.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Delete Forever
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {funnel.pagesReady < funnel.pages.length ? (
                        resumingId === funnel.id ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200 text-amber-600 bg-amber-50 cursor-not-allowed">
                            Generating {resumeProgress + 1}/{funnel.pages.length}...
                          </span>
                        ) : (
                          <button
                            onClick={() => handleResumeGeneration(funnel)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            Resume ({funnel.pagesReady}/{funnel.pages.length} pages)
                          </button>
                        )
                      ) : isDeploying ? (
                        <span className="p-1.5 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed" title="Visit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </span>
                      ) : (
                        <a
                          href={`/f/${funnel.pages[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                          title="Visit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                      <a
                        href={`/GenFunnel/dashboard/${funnel.id}`}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Dashboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                        </svg>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 line-clamp-2">
                {funnel.productInfo.description}
              </p>

              {/* Pages list */}
              {!funnel.hidden && (() => {
                const names = getFriendlyPageNames(funnel.pages);
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {funnel.pages.map((page, i) => {
                      const isResuming = resumingId === funnel.id;
                      const pageReady = isResuming ? i < resumeProgress : i < funnel.pagesReady;
                      const pageGenerating = isResuming && i === resumeProgress;

                      return (
                        <span
                          key={page}
                          className="inline-flex items-center gap-1 text-xs"
                        >
                          {isResuming ? (
                            pageReady ? (
                              <svg className="w-4 h-4 text-leaf-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : pageGenerating ? (
                              <div className="w-4 h-4 rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin shrink-0" />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                                {i + 1}
                              </span>
                            )
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                              {i + 1}
                            </span>
                          )}
                          {isDeploying || (isResuming && !pageReady) ? (
                            <span className={pageGenerating ? "text-gray-700 font-medium" : "text-gray-400"}>{names[i]}</span>
                          ) : (
                            <a
                              href={`/f/${page}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`transition-colors ${pageReady ? "text-leaf-400 hover:text-leaf-700" : "text-gray-500 hover:text-leaf-400"}`}
                            >
                              {names[i]}
                            </a>
                          )}
                          {i < funnel.pages.length - 1 && (
                            <span className="text-gray-300 ml-0.5">→</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Stats row */}
              {!funnel.hidden && (
                <div className="flex flex-wrap items-center gap-4 gap-y-1 pt-1 border-t border-gray-100">
                  <Stat label="Visitors" value={funnel.kpis.totalVisitors} />
                  <Stat label="Views" value={funnel.kpis.pageViews} />
                  <Stat label="CTA Clicks" value={funnel.kpis.ctaClicks} />
                  <Stat label="Emails" value={funnel.kpis.emailCaptures} />
                  <Stat label="Purchases" value={funnel.kpis.fakePurchases} />
                  <Stat
                    label="Conversion"
                    value={`${(funnel.kpis.conversionRate * 100).toFixed(1)}%`}
                    highlight
                  />
                  <Stat
                    label="Scroll"
                    value={`${funnel.kpis.avgScrollDepth.toFixed(0)}%`}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {funnels.length === 0 && tab === "active" && (
        <div className="text-center py-12 text-gray-400">
          <p>No funnels yet. Create your first one!</p>
        </div>
      )}

      {funnels.length === 0 && tab === "trash" && (
        <div className="text-center py-12 text-gray-400">
          <p>Trash is empty.</p>
        </div>
      )}
    </div>
  );
}

function FunnelThumb({ productInfo }: { productInfo: FunnelConfig["productInfo"] }) {
  const src = productInfo.logoUrl || productInfo.imageUrls?.[0];

  if (!src) {
    // Colored fallback with initial
    const bg = productInfo.style?.colors?.primary || productInfo.colors?.primary || "#338bd5";
    return (
      <div
        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg"
        style={{ backgroundColor: bg }}
      >
        {productInfo.productName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="w-10 h-10 rounded-lg shrink-0 object-cover bg-gray-100"
    />
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-sm font-semibold ${highlight ? "text-leaf-400" : "text-gray-900"}`}
      >
        {value}
      </div>
      <div className="text-[10px] text-gray-400">{label}</div>
    </div>
  );
}

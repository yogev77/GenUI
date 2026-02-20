"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { recordInteraction, recordViewTime, ensureSession } from "@/lib/usage";
import { getCode } from "@/lib/auth";
import FeatureErrorBoundary from "./FeatureErrorBoundary";

export default function FeatureCard({
  name,
  Component,
  onHide,
  onFrustration,
  onCrash,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
}: {
  name: string;
  Component: React.ComponentType;
  onHide: () => void;
  onFrustration: () => void;
  onCrash: (name: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const [improving, setImproving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewStartRef = useRef<number | null>(null);
  const frustrationRef = useRef<{
    clicks: number;
    timer: NodeJS.Timeout | null;
  }>({
    clicks: 0,
    timer: null,
  });

  useEffect(() => {
    ensureSession();
  }, []);

  // Scroll into view + close on click outside / Escape
  useEffect(() => {
    if (!expanded) return;
    // Scroll so the full expanded tile is visible
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [expanded]);

  // Track viewport visibility time
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewStartRef.current = Date.now();
        } else if (viewStartRef.current) {
          const elapsed = Date.now() - viewStartRef.current;
          if (elapsed > 1000) {
            recordViewTime(name, elapsed);
          }
          viewStartRef.current = null;
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      if (viewStartRef.current) {
        const elapsed = Date.now() - viewStartRef.current;
        if (elapsed > 1000) recordViewTime(name, elapsed);
      }
      observer.disconnect();
    };
  }, [name]);

  const handleImprove = useCallback(async () => {
    if (improving) return;
    setImproving(true);
    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-code": getCode(),
        },
        body: JSON.stringify({ componentName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.deploying) {
        await new Promise((r) => setTimeout(r, 50000));
        window.location.reload();
      }
    } catch (err) {
      console.error("Improve failed:", err);
    } finally {
      setImproving(false);
    }
  }, [name, improving]);

  const handleInteraction = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip if clicking card-level controls (top bar buttons)
      if (target.closest("[data-card-control]")) return;

      // Any interaction with content expands the tile
      if (!expanded) setExpanded(true);

      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest("canvas") ||
        target.closest("[role='button']") ||
        target.closest("[tabindex]")
      ) {
        recordInteraction(name);
        return;
      }

      const f = frustrationRef.current;
      f.clicks++;

      if (f.timer) clearTimeout(f.timer);
      f.timer = setTimeout(() => {
        f.clicks = 0;
      }, 2000);

      if (f.clicks >= 3) {
        f.clicks = 0;
        onFrustration();
      }
    },
    [name, onFrustration, expanded]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      className={`group relative rounded-2xl border bg-gray-900 shadow-lg transition-all duration-300 ${
        expanded
          ? "border-violet-500/60 shadow-violet-500/20 z-30 scale-[1.15] sm:scale-125"
          : "border-gray-800 hover:border-gray-700 z-0"
      }`}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
      {/* Left arrow — reorder */}
      {!isFirst && (
        <button
          data-card-control
          onClick={(e) => { e.stopPropagation(); onMoveLeft?.(); }}
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 hover:bg-violet-600 border border-gray-700 hover:border-violet-500 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-lg"
          title="Move left"
        >
          <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow — reorder */}
      {!isLast && (
        <button
          data-card-control
          onClick={(e) => { e.stopPropagation(); onMoveRight?.(); }}
          className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 hover:bg-violet-600 border border-gray-700 hover:border-violet-500 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-lg"
          title="Move right"
        >
          <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <h3 className="text-xs font-medium text-gray-500 font-mono truncate mr-2">
          {name.replace(/([A-Z])/g, " $1").trim()}
        </h3>
        <div data-card-control className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleImprove(); }}
            disabled={improving}
            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-800 hover:bg-violet-600/30 text-gray-500 hover:text-violet-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-wait"
            title="Improve with AI"
          >
            {improving ? "..." : "✦"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "↙" : "↗"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="text-gray-600 hover:text-gray-300 cursor-pointer p-0.5"
            title="Hide this feature"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Improving overlay */}
      {improving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 rounded-2xl">
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Improving...
          </div>
        </div>
      )}

      {/* Content — sandboxed */}
      <div
        className={`px-3 pb-3 overflow-hidden transition-all duration-300 ${
          expanded ? "h-[500px]" : "h-[280px]"
        }`}
        style={{ contain: "layout paint", isolation: "isolate" }}
      >
        <div className="w-full h-full overflow-auto scrollbar-thin overscroll-contain">
          <div className="w-full [&>*]:w-full [&>*]:max-w-full [&_canvas]:max-w-full [&_img]:max-w-full [&_svg]:max-w-full">
            <FeatureErrorBoundary name={name} onCrash={onCrash}>
              <Component />
            </FeatureErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

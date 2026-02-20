"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { recordInteraction, recordViewTime, ensureSession } from "@/lib/usage";
import { getCode } from "@/lib/auth";
import FeatureErrorBoundary from "./FeatureErrorBoundary";

type CardSize = "s" | "m" | "l";

const SIZE_LABELS: Record<CardSize, string> = { s: "S", m: "M", l: "L" };

const SIZE_COLS: Record<CardSize, string> = {
  s: "",
  m: "sm:col-span-2",
  l: "sm:col-span-2 lg:col-span-3",
};

const SIZES_KEY = "genui-card-sizes";

function getSavedSizes(): Record<string, CardSize> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SIZES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSize(name: string, size: CardSize) {
  const sizes = getSavedSizes();
  sizes[name] = size;
  localStorage.setItem(SIZES_KEY, JSON.stringify(sizes));
}

export default function FeatureCard({
  name,
  Component,
  onHide,
  onFrustration,
  onCrash,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}: {
  name: string;
  Component: React.ComponentType;
  onHide: () => void;
  onFrustration: () => void;
  onCrash: (name: string) => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  isDragTarget?: boolean;
}) {
  const [size, setSize] = useState<CardSize>("s");
  const [improving, setImproving] = useState(false);
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
    const saved = getSavedSizes();
    if (saved[name]) setSize(saved[name]);
    ensureSession();
  }, [name]);

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
            // only count if visible > 1s
            recordViewTime(name, elapsed);
          }
          viewStartRef.current = null;
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      // Flush remaining view time on unmount
      if (viewStartRef.current) {
        const elapsed = Date.now() - viewStartRef.current;
        if (elapsed > 1000) recordViewTime(name, elapsed);
      }
      observer.disconnect();
    };
  }, [name]);

  const cycleSize = useCallback(() => {
    const next: CardSize = size === "s" ? "m" : size === "m" ? "l" : "s";
    setSize(next);
    saveSize(name, next);
  }, [size, name]);

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
        // Production — wait for Vercel redeploy
        await new Promise((r) => setTimeout(r, 50000));
        window.location.reload();
      }
      // Dev — HMR handles it
    } catch (err) {
      console.error("Improve failed:", err);
    } finally {
      setImproving(false);
    }
  }, [name, improving]);

  // Track any interaction inside the card content area
  const handleInteraction = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // Record interaction for any click on interactive elements
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

      // Non-interactive click — frustration tracking
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
    [name, onFrustration]
  );

  return (
    <div
      ref={containerRef}
      draggable
      onClick={handleInteraction}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", name);
        onDragStart?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      onDragEnd={(e) => {
        e.preventDefault();
      }}
      className={`group relative rounded-2xl border bg-gray-900 shadow-lg transition-all cursor-grab active:cursor-grabbing ${SIZE_COLS[size]} ${
        isDragTarget
          ? "border-violet-500 scale-[1.02] shadow-violet-500/20"
          : "border-gray-800 hover:border-violet-500/50"
      }`}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
      {/* Top bar — outside sandbox */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg className="h-3 w-3 text-gray-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
            <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
            <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
          </svg>
          <h3 className="text-xs font-medium text-gray-500 font-mono truncate">
            {name.replace(/([A-Z])/g, " $1").trim()}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleImprove();
            }}
            disabled={improving}
            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-800 hover:bg-violet-600/30 text-gray-500 hover:text-violet-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-wait"
            title="Improve this feature with AI"
          >
            {improving ? "..." : "✦"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cycleSize();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
            title="Resize card"
          >
            {SIZE_LABELS[size]}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            className="text-gray-600 hover:text-gray-300 cursor-pointer p-0.5"
            title="Hide this feature"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
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
        className="px-3 pb-3 overflow-hidden h-[280px]"
        style={{ contain: "layout paint", isolation: "isolate" }}
      >
        <div className="w-full h-full overflow-auto scrollbar-thin">
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

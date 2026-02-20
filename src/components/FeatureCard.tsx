"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { recordInteraction, recordViewTime, ensureSession } from "@/lib/usage";
import FeatureErrorBoundary from "./FeatureErrorBoundary";

type CardSize = "s" | "m" | "l";

const SIZE_LABELS: Record<CardSize, string> = { s: "S", m: "M", l: "L" };
const SIZE_COLS: Record<CardSize, string> = {
  s: "col-span-1",
  m: "sm:col-span-2",
  l: "sm:col-span-2 lg:col-span-3",
};

const SIZE_HEIGHTS: Record<CardSize, string> = {
  s: "min-h-[180px] max-h-[350px]",
  m: "min-h-[220px] max-h-[450px]",
  l: "min-h-[250px] max-h-[550px]",
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
}: {
  name: string;
  Component: React.ComponentType;
  onHide: () => void;
  onFrustration: () => void;
  onCrash: (name: string) => void;
}) {
  const [size, setSize] = useState<CardSize>("s");
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

  // Detect drag attempts on non-interactive areas
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("canvas") ||
        target.closest("input") ||
        target.closest("[draggable]")
      ) {
        return;
      }

      let moved = false;
      const onMove = () => {
        moved = true;
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (moved) {
          const f = frustrationRef.current;
          f.clicks += 2;
          if (f.clicks >= 3) {
            f.clicks = 0;
            onFrustration();
          }
        }
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onFrustration]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      onMouseDown={handleMouseDown}
      className={`group relative rounded-2xl border border-gray-800 bg-gray-900 shadow-lg hover:border-violet-500/50 transition-all ${SIZE_COLS[size]}`}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
      {/* Top bar — outside sandbox */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-sm font-medium text-gray-400 font-mono truncate mr-2">
          {name.replace(/([A-Z])/g, " $1").trim()}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

      {/* Content — sandboxed */}
      <div
        className={`px-4 pb-4 overflow-hidden ${SIZE_HEIGHTS[size]}`}
        style={{ contain: "layout paint", isolation: "isolate" }}
      >
        <div className="w-full h-full overflow-auto">
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

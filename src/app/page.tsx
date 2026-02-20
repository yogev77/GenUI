"use client";

import { useState, useEffect, useCallback } from "react";
import GenerateButton from "@/components/GenerateButton";
import EvolutionLog from "@/components/EvolutionLog";
import FeatureCard from "@/components/FeatureCard";
import ConversationStrip from "@/components/ConversationStrip";
import CodeGate from "@/components/CodeGate";
import * as Features from "@/components/features";
import type { SiteHistory } from "@/lib/history";
import { getPreferences, FONT_SIZE_CLASSES } from "@/lib/preferences";
import historyData from "@/data/history.json";

const HIDDEN_KEY = "genui-hidden-features";
const CRASHED_KEY = "genui-crashed-features";
const ORDER_KEY = "genui-feature-order";

function getHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function getCrashed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CRASHED_KEY) || "[]");
  } catch {
    return [];
  }
}

function getSavedOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  } catch {
    return [];
  }
}

function applyOrder(
  entries: [string, React.ComponentType][],
  order: string[]
): [string, React.ComponentType][] {
  if (!order.length) return entries;
  const map = new Map(entries);
  const ordered: [string, React.ComponentType][] = [];
  for (const name of order) {
    const comp = map.get(name);
    if (comp) {
      ordered.push([name, comp]);
      map.delete(name);
    }
  }
  // Append any new features not in saved order
  for (const [name, comp] of map) {
    ordered.push([name, comp]);
  }
  return ordered;
}

export default function Home() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [crashed, setCrashed] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<ReturnType<typeof getPreferences> | null>(null);
  const [frustrationCount, setFrustrationCount] = useState(0);

  useEffect(() => {
    setHidden(getHidden());
    setCrashed(getCrashed());
    setOrder(getSavedOrder());
    setPrefs(getPreferences());
  }, []);

  const handleFrustration = useCallback(() => {
    setFrustrationCount((n) => n + 1);
  }, []);

  const history = historyData as SiteHistory;
  const allEntries = Object.entries(Features) as [
    string,
    React.ComponentType,
  ][];
  const filteredEntries = allEntries.filter(
    ([name]) => !hidden.includes(name) && !crashed.includes(name)
  );
  const visibleEntries = applyOrder(filteredEntries, order);
  const hiddenCount = allEntries.length - visibleEntries.length - crashed.length;
  const crashedCount = crashed.length;

  const fontClass = prefs ? FONT_SIZE_CLASSES[prefs.fontSize] : "text-base";

  function hideFeature(name: string) {
    const next = [...hidden, name];
    setHidden(next);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  }

  function showAll() {
    setHidden([]);
    localStorage.removeItem(HIDDEN_KEY);
  }

  const handleCrash = useCallback((name: string) => {
    setCrashed((prev) => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      localStorage.setItem(CRASHED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  function retryCrashed() {
    setCrashed([]);
    localStorage.removeItem(CRASHED_KEY);
  }

  const moveFeature = useCallback((name: string, direction: -1 | 1) => {
    setOrder((prev) => {
      const names = prev.length
        ? [...prev]
        : visibleEntries.map(([n]) => n);
      const idx = names.indexOf(name);
      if (idx === -1) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= names.length) return prev;
      // swap
      [names[idx], names[newIdx]] = [names[newIdx], names[idx]];
      localStorage.setItem(ORDER_KEY, JSON.stringify(names));
      return [...names];
    });
  }, [visibleEntries]);

  return (
    <CodeGate>
    <main className={`min-h-screen px-4 pt-8 pb-12 sm:px-6 lg:px-8 ${fontClass}`}>
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-leaf-100 via-leaf-200 to-leaf-400 bg-clip-text text-transparent">
          GenUI
        </h1>
        <p className="mt-2 text-sm text-leaf-200/40">
          A self-evolving website
        </p>
        {allEntries.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-leaf-200/40">
            <span>{allEntries.length} features</span>
            <span className="text-leaf-700">·</span>
            <span>{history.totalLinesOfCode} lines</span>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center mb-6">
        <GenerateButton />
      </div>

      {/* Conversation Strip */}
      <ConversationStrip frustrationHint={frustrationCount} />

      {/* Evolution Log */}
      <EvolutionLog history={history} />

      {/* Hidden / crashed counts + restore */}
      {(hiddenCount > 0 || crashedCount > 0) && (
        <div className="mx-auto max-w-7xl mb-4 flex justify-end gap-4">
          {crashedCount > 0 && (
            <button
              onClick={retryCrashed}
              className="text-xs text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
            >
              {crashedCount} crashed — retry
            </button>
          )}
          {hiddenCount > 0 && (
            <button
              onClick={showAll}
              className="text-xs text-leaf-200/40 hover:text-leaf-200 transition-colors cursor-pointer"
            >
              {hiddenCount} hidden — show all
            </button>
          )}
        </div>
      )}

      {/* Feature Grid */}
      {visibleEntries.length > 0 && (
        <div className="mx-auto max-w-7xl">
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}
          >
            {visibleEntries.map(([name, Component], i) => (
              <FeatureCard
                key={name}
                name={name}
                Component={Component}
                onHide={() => hideFeature(name)}
                onFrustration={handleFrustration}
                onCrash={handleCrash}
                onMoveLeft={() => moveFeature(name, -1)}
                onMoveRight={() => moveFeature(name, 1)}
                isFirst={i === 0}
                isLast={i === visibleEntries.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-leaf-700">
        Built with Next.js + Claude API + GitHub API + Vercel
      </footer>

    </main>
    </CodeGate>
  );
}

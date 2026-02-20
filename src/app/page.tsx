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

export default function Home() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [crashed, setCrashed] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<ReturnType<typeof getPreferences> | null>(null);
  const [frustrationCount, setFrustrationCount] = useState(0);

  useEffect(() => {
    setHidden(getHidden());
    setCrashed(getCrashed());
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
  const visibleEntries = allEntries.filter(
    ([name]) => !hidden.includes(name) && !crashed.includes(name)
  );
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

  return (
    <CodeGate>
    <main className={`min-h-screen px-4 pt-8 pb-12 sm:px-6 lg:px-8 ${fontClass}`}>
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
          GenUI
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          A self-evolving website
        </p>
        {allEntries.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-600">
            <span>{allEntries.length} features</span>
            <span className="text-gray-700">·</span>
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
        <div className="mx-auto max-w-6xl mb-4 flex justify-end gap-4">
          {crashedCount > 0 && (
            <button
              onClick={retryCrashed}
              className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              {crashedCount} crashed — retry
            </button>
          )}
          {hiddenCount > 0 && (
            <button
              onClick={showAll}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {hiddenCount} hidden — show all
            </button>
          )}
        </div>
      )}

      {/* Feature Grid */}
      {visibleEntries.length > 0 && (
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
            {visibleEntries.map(([name, Component]) => (
              <FeatureCard
                key={name}
                name={name}
                Component={Component}
                onHide={() => hideFeature(name)}
                onFrustration={handleFrustration}
                onCrash={handleCrash}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-gray-600">
        Built with Next.js + Claude API + GitHub API + Vercel
      </footer>

    </main>
    </CodeGate>
  );
}

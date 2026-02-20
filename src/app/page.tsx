"use client";

import { useState, useEffect, useCallback } from "react";
import GenerateButton from "@/components/GenerateButton";
import EvolutionLog from "@/components/EvolutionLog";
import FeatureCard from "@/components/FeatureCard";
import ConversationStrip from "@/components/ConversationStrip";
import SiteChat from "@/components/SiteChat";
import * as Features from "@/components/features";
import type { SiteHistory } from "@/lib/history";
import {
  getPreferences,
  FONT_SIZE_CLASSES,
  type SitePreferences,
} from "@/lib/preferences";
import historyData from "@/data/history.json";

const HIDDEN_KEY = "genui-hidden-features";

function getHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Home() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<SitePreferences | null>(null);
  const [chatTrigger, setChatTrigger] = useState(0);

  useEffect(() => {
    setHidden(getHidden());
    setPrefs(getPreferences());
  }, []);

  const handlePrefsChange = useCallback((newPrefs: SitePreferences) => {
    setPrefs(newPrefs);
  }, []);

  const handleFrustration = useCallback(() => {
    setChatTrigger((n) => n + 1);
  }, []);

  const history = historyData as SiteHistory;
  const allEntries = Object.entries(Features) as [
    string,
    React.ComponentType,
  ][];
  const visibleEntries = allEntries.filter(([name]) => !hidden.includes(name));
  const hiddenCount = allEntries.length - visibleEntries.length;

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

  return (
    <main className={`min-h-screen px-4 py-12 sm:px-6 lg:px-8 ${fontClass}`}>
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center mb-12">
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
          GenUI
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          A self-evolving website — each click adds a new AI-generated feature
        </p>
        <p className="mt-2 text-sm text-gray-500 font-mono">
          {allEntries.length === 0
            ? "No features yet — click below to start!"
            : `${allEntries.length} feature${allEntries.length === 1 ? "" : "s"} generated · ${history.totalLinesOfCode} lines of code`}
        </p>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center mb-8">
        <GenerateButton />
      </div>

      {/* Conversation Strip */}
      <ConversationStrip />

      {/* Evolution Log */}
      <EvolutionLog history={history} />

      {/* Hidden count + restore */}
      {hiddenCount > 0 && (
        <div className="mx-auto max-w-6xl mb-4 flex justify-end">
          <button
            onClick={showAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            {hiddenCount} hidden — show all
          </button>
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-gray-600">
        Built with Next.js + Claude API + GitHub API + Vercel
      </footer>

      {/* Feedback Chat */}
      <SiteChat onPrefsChange={handlePrefsChange} triggerOpen={chatTrigger} />
    </main>
  );
}

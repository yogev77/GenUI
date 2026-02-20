"use client";

import { useState } from "react";
import type { SiteHistory } from "@/lib/history";

export default function EvolutionLog({ history }: { history: SiteHistory }) {
  const [open, setOpen] = useState(false);

  if (history.entries.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        Evolution Log — {history.totalFeatures} features,{" "}
        {history.totalLinesOfCode} lines of AI-generated code
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {/* Stats bar */}
          <div className="px-4 py-3 border-b border-gray-800 flex gap-6 text-xs font-mono text-gray-500">
            <span>{history.totalFeatures} features</span>
            <span>{history.totalLinesOfCode} lines</span>
            <span>
              avg{" "}
              {Math.round(history.totalLinesOfCode / history.totalFeatures)}{" "}
              lines/feature
            </span>
          </div>

          {/* Timeline */}
          <div className="divide-y divide-gray-800/50">
            {[...history.entries].reverse().map((entry, i) => (
              <div key={i} className="px-4 py-3 flex gap-4 items-start">
                {/* Dot */}
                <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-200">
                      {entry.feature.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-xs font-mono text-gray-600">
                      +{entry.linesOfCode} lines
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {entry.reasoning}
                  </p>
                  <time className="text-[10px] text-gray-700 font-mono mt-1 block">
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { getPreferences } from "@/lib/preferences";
import { getUsage } from "@/lib/usage";

type Status = "idle" | "generating" | "deploying" | "done" | "error";

interface GenerateResult {
  feature: string;
  reasoning: string;
  linesOfCode: number;
  deploying: boolean;
}

export default function GenerateButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function handleClick() {
    if (status === "generating" || status === "deploying") return;

    setStatus("generating");
    setError(null);
    setResult(null);

    try {
      const prefs = getPreferences();
      const usage = getUsage();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs, usage }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult({
        feature: data.feature,
        reasoning: data.reasoning,
        linesOfCode: data.linesOfCode,
        deploying: data.deploying,
      });

      if (data.deploying) {
        // Production — wait for Vercel redeploy then reload
        setStatus("deploying");
        await new Promise((r) => setTimeout(r, 50000));
        window.location.reload();
      } else {
        // Dev — HMR handles it
        setStatus("done");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const isWorking = status === "generating" || status === "deploying";

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
      <button
        onClick={handleClick}
        disabled={isWorking}
        className={`
          group relative inline-flex items-center gap-3
          rounded-2xl px-8 py-4 text-lg font-semibold
          transition-all duration-300
          ${
            isWorking
              ? "bg-violet-400 cursor-wait text-white"
              : status === "error"
                ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                : status === "done"
                  ? "bg-green-500 text-white cursor-default"
                  : "bg-violet-600 hover:bg-violet-700 hover:scale-105 active:scale-95 text-white cursor-pointer"
          }
          shadow-lg hover:shadow-xl
        `}
      >
        <svg
          className={`h-6 w-6 ${isWorking ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isWorking ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          ) : status === "done" ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          )}
        </svg>
        {status === "generating"
          ? "Thinking..."
          : status === "deploying"
            ? "Deploying..."
            : status === "done"
              ? "Added!"
              : status === "error"
                ? "Try Again"
                : "Generate Feature"}
      </button>

      {status === "generating" && (
        <p className="text-sm text-gray-400 animate-pulse text-center">
          AI is deciding what to build next...
        </p>
      )}

      {status === "deploying" && result && (
        <div className="text-center rounded-xl border border-violet-800/50 bg-violet-950/30 px-4 py-3">
          <p className="text-sm font-medium text-violet-400">
            {result.feature.replace(/([A-Z])/g, " $1").trim()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{result.reasoning}</p>
          <p className="text-xs text-gray-500 mt-2 animate-pulse">
            Deploying — page will refresh in ~45s
          </p>
        </div>
      )}

      {status === "done" && result && (
        <div className="text-center rounded-xl border border-green-800/50 bg-green-950/30 px-4 py-3">
          <p className="text-sm font-medium text-green-400">
            {result.feature.replace(/([A-Z])/g, " $1").trim()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{result.reasoning}</p>
          <p className="text-[10px] font-mono text-gray-600 mt-1">
            +{result.linesOfCode} lines of code
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}

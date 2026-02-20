"use client";

import { useState } from "react";
import { getPreferences } from "@/lib/preferences";
import { getUsage } from "@/lib/usage";
import { getCode } from "@/lib/auth";

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
        headers: {
          "Content-Type": "application/json",
          "x-access-code": getCode(),
        },
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
    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
      <button
        onClick={handleClick}
        disabled={isWorking}
        className={`
          group relative inline-flex items-center gap-2
          rounded-xl px-5 py-2.5 text-sm font-medium
          transition-all duration-300
          ${
            isWorking
              ? "bg-violet-500/80 cursor-wait text-white"
              : status === "error"
                ? "bg-red-500/80 hover:bg-red-500 text-white cursor-pointer"
                : status === "done"
                  ? "bg-green-500/80 text-white cursor-default"
                  : "bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 text-white cursor-pointer"
          }
          shadow-md hover:shadow-lg
        `}
      >
        <svg
          className={`h-4 w-4 ${isWorking ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`}
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
                : "Generate"}
      </button>

      {(status === "deploying" || status === "done") && result && (
        <p className="text-xs text-center text-gray-500 max-w-xs">
          <span className={status === "done" ? "text-green-400" : "text-violet-400"}>
            {result.feature.replace(/([A-Z])/g, " $1").trim()}
          </span>
          {" — "}
          {status === "deploying" ? (
            <span className="animate-pulse">deploying, page will refresh...</span>
          ) : (
            <span className="text-gray-600">+{result.linesOfCode} lines</span>
          )}
        </p>
      )}

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import type {
  FunnelConfig,
  Experiment,
  ExperimentIdea,
} from "@/lib/funnel-claude";

interface Props {
  funnel: FunnelConfig;
  onUpdate: (funnel: FunnelConfig) => void;
}

export default function ExperimentsTab({ funnel, onUpdate }: Props) {
  const experiments = funnel.experiments || [];
  const running = experiments.filter((e) => e.status === "running");
  const concluded = experiments.filter((e) => e.status === "concluded");

  const runningPages = new Set(running.map((e) => e.pageName));

  return (
    <div className="space-y-6">
      <IdeasSection
        funnel={funnel}
        onUpdate={onUpdate}
        runningPages={runningPages}
      />

      {running.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Running</h3>
          {running.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              funnel={funnel}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {concluded.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Concluded</h3>
          {concluded.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              funnel={funnel}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {experiments.length === 0 && funnel.kpis.totalVisitors < 5 && (
        <div className="text-center py-12 text-gray-400">
          <p>No experiments yet.</p>
          <p className="text-xs mt-2">
            Use the &ldquo;Evolve&rdquo; button on a page to start an A/B
            test.
          </p>
        </div>
      )}
    </div>
  );
}

function IdeasSection({
  funnel,
  onUpdate,
  runningPages,
}: {
  funnel: FunnelConfig;
  onUpdate: (funnel: FunnelConfig) => void;
  runningPages: Set<string>;
}) {
  const [ideas, setIdeas] = useState<ExperimentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [generatingPage, setGeneratingPage] = useState<string | null>(null);
  const [createdPage, setCreatedPage] = useState<string | null>(null);

  useEffect(() => {
    if (funnel.kpis.totalVisitors < 5) return;

    let cancelled = false;
    setLoading(true);

    fetch("/api/funnel/experiment-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelId: funnel.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setIdeas(data.ideas || []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [funnel.id, funnel.kpis.totalVisitors]);

  async function handleGenerate(pageName: string) {
    setGeneratingPage(pageName);
    setCreatedPage(null);
    try {
      const res = await fetch("/api/funnel/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnelId: funnel.id, pageName }),
      });
      if (res.ok) {
        setCreatedPage(pageName);
        // Refetch funnel to update experiments list
        const listRes = await fetch(
          `/api/funnel/list?funnelId=${encodeURIComponent(funnel.id)}`
        );
        if (listRes.ok) {
          const data = await listRes.json();
          onUpdate(data.funnel);
        }
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Failed to generate test");
    } finally {
      setGeneratingPage(null);
    }
  }

  if (funnel.kpis.totalVisitors < 5 || (!loading && loaded && ideas.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        AI Suggestions
      </h3>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Analyzing funnel data...
        </div>
      )}

      {!loading &&
        ideas.map((idea) => {
          const isRunning = runningPages.has(idea.pageName);
          const isGenerating = generatingPage === idea.pageName;
          const wasCreated = createdPage === idea.pageName;

          return (
            <div
              key={`${idea.pageName}-${idea.title}`}
              className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium text-gray-900 text-sm">
                  {idea.title}
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded bg-leaf-100 text-leaf-700 text-xs font-medium">
                  {idea.targetMetric}
                </span>
              </div>

              <div className="text-xs text-gray-500">{idea.pageName}</div>

              <p className="text-sm text-gray-700">{idea.description}</p>

              <p className="text-xs text-gray-400 italic">{idea.reasoning}</p>

              <div className="pt-1">
                {wasCreated ? (
                  <span className="text-xs text-green-600 font-medium">
                    Test created
                  </span>
                ) : isRunning ? (
                  <span className="text-xs text-gray-400">
                    Experiment running
                  </span>
                ) : (
                  <button
                    onClick={() => handleGenerate(idea.pageName)}
                    disabled={isGenerating || generatingPage !== null}
                    className="px-3 py-1.5 rounded-lg bg-leaf-400 text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      "Generate Test"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function ExperimentCard({
  experiment: exp,
  funnel,
  onUpdate,
}: {
  experiment: Experiment;
  funnel: FunnelConfig;
  onUpdate: (funnel: FunnelConfig) => void;
}) {
  const [concluding, setConcluding] = useState(false);

  const controlRate =
    exp.controlStats.visitors > 0
      ? exp.controlStats.conversions / exp.controlStats.visitors
      : 0;
  const testRate =
    exp.testStats.visitors > 0
      ? exp.testStats.conversions / exp.testStats.visitors
      : 0;

  const { confidence } = calculateSignificance(
    exp.controlStats,
    exp.testStats
  );

  const isSignificant = confidence >= exp.significanceThreshold;
  const suggestedWinner: "control" | "test" =
    testRate > controlRate ? "test" : "control";

  async function handleConclude(winner: "control" | "test") {
    setConcluding(true);
    try {
      const res = await fetch("/api/funnel/experiment/conclude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ experimentId: exp.id, winner }),
      });
      if (res.ok) {
        const listRes = await fetch(
          `/api/funnel/list?funnelId=${encodeURIComponent(funnel.id)}`
        );
        if (listRes.ok) {
          const data = await listRes.json();
          onUpdate(data.funnel);
        }
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Failed to conclude experiment");
    } finally {
      setConcluding(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-gray-900 font-medium">{exp.pageName}</span>
          <span
            className={`ml-2 px-2 py-0.5 rounded text-xs ${
              exp.status === "running"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {exp.status}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(exp.startedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Stats comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-400 mb-1">Control</div>
          <div className="text-lg font-bold text-gray-900">
            {(controlRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">
            {exp.controlStats.conversions}/{exp.controlStats.visitors} visitors
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-400 mb-1">Test</div>
          <div className="text-lg font-bold text-gray-900">
            {(testRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">
            {exp.testStats.conversions}/{exp.testStats.visitors} visitors
          </div>
        </div>
      </div>

      {/* Significance meter */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Confidence</span>
          <span
            className={isSignificant ? "text-green-600" : "text-gray-400"}
          >
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all ${
              isSignificant ? "bg-green-500" : "bg-leaf-400"
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
          <div
            className="absolute top-0 h-full w-px bg-gray-300"
            style={{ left: `${exp.significanceThreshold * 100}%` }}
          />
        </div>
      </div>

      {/* Promote Winner button */}
      {exp.status === "running" && isSignificant && (
        <button
          onClick={() => handleConclude(suggestedWinner)}
          disabled={concluding}
          className="w-full px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 border border-green-200"
        >
          {concluding
            ? "Promoting..."
            : `Promote Winner (${suggestedWinner})`}
        </button>
      )}

      {exp.status === "running" && !isSignificant && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Waiting for significance...
          </span>
          <button
            onClick={() => handleConclude(suggestedWinner)}
            disabled={concluding}
            className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {concluding ? "..." : "Force conclude"}
          </button>
        </div>
      )}

      {exp.status === "concluded" && exp.winner && (
        <div className="text-sm text-green-600">
          Winner: <span className="font-medium">{exp.winner}</span>
          {exp.concludedAt && (
            <span className="text-gray-400 ml-2">
              {new Date(exp.concludedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function calculateSignificance(
  control: { visitors: number; conversions: number },
  test: { visitors: number; conversions: number }
): { zScore: number; confidence: number } {
  const n1 = control.visitors;
  const n2 = test.visitors;

  if (n1 < 2 || n2 < 2) return { zScore: 0, confidence: 0 };

  const p1 = control.conversions / n1;
  const p2 = test.conversions / n2;
  const pPool = (control.conversions + test.conversions) / (n1 + n2);

  if (pPool === 0 || pPool === 1) return { zScore: 0, confidence: 0 };

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { zScore: 0, confidence: 0 };

  const z = Math.abs(p2 - p1) / se;

  const confidence = 1 - 2 * (1 - normalCDF(z));

  return { zScore: z, confidence: Math.max(0, Math.min(1, confidence)) };
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

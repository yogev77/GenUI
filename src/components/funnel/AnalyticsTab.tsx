"use client";

import { useState, useEffect } from "react";

interface Step {
  pageName: string;
  pageOrder: number;
  visitors: number;
  ctaClicks: number;
  emails: number;
  purchases: number;
  dropOffPct: number;
  conversionPct: number;
}

interface AnalyticsData {
  steps: Step[];
  summary: {
    totalVisitors: number;
    totalPurchases: number;
    overallConversion: number;
  } | null;
}

interface Props {
  funnelId: string;
}

export default function AnalyticsTab({ funnelId }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/funnel/analytics?funnelId=${encodeURIComponent(funnelId)}`,
          { credentials: "include" }
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [funnelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
      </div>
    );
  }

  if (!data || data.steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No analytics data yet.</p>
      </div>
    );
  }

  const { steps, summary } = data;
  const maxVisitors = Math.max(...steps.map((s) => s.visitors), 1);

  // Metric cards
  const biggestDropOff = steps.reduce(
    (best, s) => (s.dropOffPct > (best?.dropOffPct ?? 0) ? s : best),
    null as Step | null
  );
  const bestCta = steps.reduce(
    (best, s) => {
      const rate = s.visitors > 0 ? s.ctaClicks / s.visitors : 0;
      const bestRate = best && best.visitors > 0 ? best.ctaClicks / best.visitors : 0;
      return rate > bestRate ? s : best;
    },
    null as Step | null
  );
  const totalEmails = steps.reduce((sum, s) => sum + s.emails, 0);
  const emailRate =
    summary && summary.totalVisitors > 0
      ? ((totalEmails / summary.totalVisitors) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Funnel chart */}
      <div className="space-y-1">
        {steps.map((step, i) => {
          const widthPct = Math.max((step.visitors / maxVisitors) * 100, 4);
          return (
            <div key={step.pageName}>
              {/* Drop-off label between steps */}
              {i > 0 && step.dropOffPct > 0 && (
                <div className="flex items-center gap-2 py-1 pl-9">
                  <span className="text-xs text-red-400">
                    ↓ {step.dropOffPct}% drop-off
                  </span>
                </div>
              )}
              {/* Page name above bar */}
              <div className="flex items-baseline gap-3 mb-0.5">
                <div className="w-6 text-center text-xs text-gray-400 font-mono shrink-0">
                  {i + 1}
                </div>
                <span className="text-xs text-gray-500 truncate">
                  {step.pageName}
                </span>
              </div>
              {/* Bar */}
              <div className="flex items-center gap-3">
                <div className="w-6 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div
                    className="bg-leaf-400 rounded-lg px-3 py-2 flex items-center justify-end transition-all"
                    style={{ width: `${widthPct}%`, minWidth: "80px" }}
                  >
                    <span className="text-xs text-white/90 whitespace-nowrap">
                      {step.visitors} visitor{step.visitors !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-14 text-right shrink-0">
                  {step.conversionPct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Biggest drop-off"
          value={biggestDropOff ? `${biggestDropOff.dropOffPct}%` : "—"}
          sub={biggestDropOff?.pageName}
        />
        <MetricCard
          label="Best CTA rate"
          value={
            bestCta && bestCta.visitors > 0
              ? `${Math.min((bestCta.ctaClicks / bestCta.visitors) * 100, 100).toFixed(1)}%`
              : "—"
          }
          sub={bestCta?.pageName}
        />
        <MetricCard
          label="Email capture rate"
          value={`${emailRate}%`}
          sub={`${totalEmails} total`}
        />
        <MetricCard
          label="Overall conversion"
          value={summary ? `${summary.overallConversion}%` : "—"}
          sub={summary ? `${summary.totalPurchases} purchases` : undefined}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-0.5">{value}</div>
      {sub && <div className="text-xs text-gray-400 truncate">{sub}</div>}
    </div>
  );
}

"use client";

import type { ImprovementLog } from "@/lib/funnel-claude";

interface Props {
  logs: ImprovementLog[];
}

export default function UpdateLogTab({ logs }: Props) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No updates yet.</p>
        <p className="text-xs mt-2">
          Evolution history will appear here after you evolve a page.
        </p>
      </div>
    );
  }

  const sorted = [...logs].reverse();

  return (
    <div className="space-y-2">
      {sorted.map((log, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-leaf-400">
              v{log.version} &middot; {log.pageName}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{log.reasoning}</p>
          <div className="flex gap-3 text-xs text-gray-400">
            <span>Visitors: {log.kpiSnapshot.totalVisitors}</span>
            <span>
              Conv: {(log.kpiSnapshot.conversionRate * 100).toFixed(1)}%
            </span>
            <span>Scroll: {log.kpiSnapshot.avgScrollDepth.toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

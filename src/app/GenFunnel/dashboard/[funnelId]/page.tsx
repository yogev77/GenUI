"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import FunnelProjectDashboard from "@/components/funnel/FunnelProjectDashboard";
import type { FunnelConfig } from "@/lib/funnel-claude";
import { AuthProvider } from "@/lib/auth-context";

function DashboardInner() {
  const params = useParams();
  const funnelId = params.funnelId as string;
  const [funnel, setFunnel] = useState<FunnelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/funnel/list?funnelId=${encodeURIComponent(funnelId)}`);
        if (res.ok) {
          const data = await res.json();
          setFunnel(data.funnel);
        } else {
          setError("Funnel not found");
        }
      } catch {
        setError("Failed to load funnel");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [funnelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
        <p className="text-gray-500 text-sm">{error || "Funnel not found"}</p>
        <a
          href="/"
          className="mt-4 text-sm text-leaf-400 hover:text-leaf-700 transition-colors"
        >
          &larr; Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <a
            href="/"
            className="text-gray-400 text-sm hover:text-leaf-400 transition-colors"
          >
            &larr; Home
          </a>
        </div>
        <FunnelProjectDashboard funnel={funnel} onFunnelUpdate={setFunnel} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <AuthGate>
        <DashboardInner />
      </AuthGate>
    </AuthProvider>
  );
}

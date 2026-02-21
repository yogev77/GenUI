"use client";

import { useState, useEffect, useRef } from "react";
import AuthGate from "@/components/AuthGate";
import LemonLogo from "@/components/LemonLogo";
import SetupWizard from "@/components/funnel/SetupWizard";
import FunnelDashboard from "@/components/funnel/FunnelDashboard";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { TAGLINE } from "@/lib/constants";

function AccountMenu() {
  const { user, supabase } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-leaf-400 text-white flex items-center justify-center text-xs font-semibold">
          {initial}
        </div>
        <span className="text-sm text-gray-600 hidden sm:inline max-w-[140px] truncate">
          {user?.email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <a
            href="/GenFunnel/profile"
            className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Profile &amp; Usage
          </a>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function HomeInner() {
  const [view, setView] = useState<"loading" | "wizard" | "dashboard">(
    "loading"
  );
  const [hasFunnels, setHasFunnels] = useState(false);

  useEffect(() => {
    async function checkFunnels() {
      try {
        const res = await fetch("/api/funnel/list", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const activeFunnels = data.funnels.filter((f: { hidden?: boolean }) => !f.hidden);
          setHasFunnels(activeFunnels.length > 0);
          setView(activeFunnels.length > 0 ? "dashboard" : "wizard");
        } else {
          setView("wizard");
        }
      } catch {
        setView("wizard");
      }
    }
    checkFunnels();
  }, []);

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-leaf-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view === "wizard" && hasFunnels && (
                <button
                  onClick={() => setView("dashboard")}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
              <button
                onClick={() => hasFunnels && setView("dashboard")}
                className={`flex items-center gap-3 ${hasFunnels ? "cursor-pointer" : "cursor-default"}`}
              >
                <LemonLogo className="w-14 h-14 sm:w-20 sm:h-20" />
                <h1 className="text-3xl sm:text-4xl font-marker tracking-tight bg-gradient-to-r from-leaf-700 via-leaf-400 to-leaf-700 bg-clip-text text-transparent">
                  Sell This Pen
                </h1>
              </button>
            </div>
            <AccountMenu />
          </div>
          <p className="text-leaf-400 text-sm font-bold mt-1">
            {TAGLINE}
          </p>
        </div>

        {view === "wizard" && (
          <SetupWizard onComplete={() => { setHasFunnels(true); setView("dashboard"); }} />
        )}
        {view === "dashboard" && (
          <FunnelDashboard onCreateNew={() => setView("wizard")} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthGate>
        <HomeInner />
      </AuthGate>
    </AuthProvider>
  );
}

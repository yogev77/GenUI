"use client";

import { useState, useRef, useCallback } from "react";
import type { ProductInfo } from "@/lib/funnel-claude";
import type { FunnelBrief, FunnelImage } from "@/lib/funnel-types";
import FunnelChat from "./FunnelChat";
import ImageReview from "./ImageReview";

interface SetupWizardProps {
  onComplete: () => void;
}

type WizardPhase = "entry" | "images" | "chat";

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [phase, setPhase] = useState<WizardPhase>("entry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // URL scan state
  const [scanUrl, setScanUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanProductInfo, setScanProductInfo] = useState<ProductInfo | null>(null);
  const [reviewImages, setReviewImages] = useState<FunnelImage[]>([]);
  const [chatContext, setChatContext] = useState<{
    scanData?: ProductInfo;
  }>({});

  // Generation progress
  const [generatingPage, setGeneratingPage] = useState(-1);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [pageNames, setPageNames] = useState<string[]>([]);
  const [stalled, setStalled] = useState(false);
  const [createdFunnelId, setCreatedFunnelId] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressRef = useRef<{ count: number; time: number }>({ count: 0, time: Date.now() });

  async function handleScan() {
    setScanning(true);
    setError("");

    try {
      const res = await fetch("/api/funnel/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: scanUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan URL");

      setScanProductInfo(data.productInfo);

      // If images were returned, go to image review step
      const images: FunnelImage[] = data.images ?? [];
      if (images.length > 0) {
        setReviewImages(images);
        setPhase("images");
      } else {
        // No images found — skip to chat
        setChatContext({ scanData: data.productInfo });
        setPhase("chat");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan URL");
    } finally {
      setScanning(false);
    }
  }

  function handleImageReviewContinue() {
    if (!scanProductInfo) return;

    // Merge reviewed images into productInfo for chat context
    const nonLogoImages = reviewImages.filter((i) => !i.isLogo);
    const logoImage = reviewImages.find((i) => i.isLogo);

    const updatedProductInfo: ProductInfo = {
      ...scanProductInfo,
      imageUrls: nonLogoImages.map((i) => i.url),
      logoUrl: logoImage?.url ?? scanProductInfo.logoUrl,
      imageContexts: reviewImages.map((i) => ({ url: i.url, context: i.context })),
    };

    setChatContext({ scanData: updatedProductInfo });
    setPhase("chat");
  }

  const retriesRef = useRef(0);
  const lastErrorRef = useRef("");
  const MAX_AUTO_RETRIES = 3;

  async function kickOffGeneration(funnelId: string): Promise<string | null> {
    try {
      const res = await fetch("/api/funnel/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ funnelId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error) {
        lastErrorRef.current = data.error;
        return data.error;
      }
      if (data.lastError) {
        lastErrorRef.current = data.lastError;
      }
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      lastErrorRef.current = msg;
      return msg;
    }
  }

  const startPolling = useCallback((funnelId: string, names: string[]) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStalled(false);
    setError("");
    lastProgressRef.current = { count: 0, time: Date.now() };
    retriesRef.current = 0;
    lastErrorRef.current = "";

    pollRef.current = setInterval(async () => {
      try {
        const pollRes = await fetch(
          `/api/funnel/list?funnelId=${funnelId}`,
          { credentials: "include" }
        );
        if (!pollRes.ok) return;
        const data = await pollRes.json();
        const ready = data.funnel?.pagesReady ?? 0;
        setGeneratedCount(ready);
        setGeneratingPage(ready < names.length ? ready : names.length - 1);

        // Track progress for stall detection
        if (ready > lastProgressRef.current.count) {
          lastProgressRef.current = { count: ready, time: Date.now() };
          retriesRef.current = 0; // Reset retries on progress
          lastErrorRef.current = "";
        }

        if (ready >= names.length) {
          if (pollRef.current) clearInterval(pollRef.current);
          onComplete();
          return;
        }

        // Stall detection: no progress for 75 seconds
        const stallSeconds = Date.now() - lastProgressRef.current.time;
        if (stallSeconds > 75_000) {
          if (retriesRef.current < MAX_AUTO_RETRIES) {
            // Auto-retrigger and capture error
            retriesRef.current++;
            lastProgressRef.current = { ...lastProgressRef.current, time: Date.now() };
            setError(`Retrying (${retriesRef.current}/${MAX_AUTO_RETRIES})${lastErrorRef.current ? `: ${lastErrorRef.current}` : "..."}`);
            kickOffGeneration(funnelId);
          } else {
            // Exhausted retries — show error to user
            if (pollRef.current) clearInterval(pollRef.current);
            setStalled(true);
            const reason = lastErrorRef.current
              ? `Last error: ${lastErrorRef.current}`
              : "No error details available.";
            setError(`Generation failed after ${MAX_AUTO_RETRIES} retries. ${reason}`);
          }
        }
      } catch {
        // ignore poll errors
      }
    }, 3000);
  }, [onComplete]);

  async function handleRetry() {
    if (!createdFunnelId) return;
    setStalled(false);
    setError("");
    retriesRef.current = 0;
    lastProgressRef.current = { count: generatedCount, time: Date.now() };
    await kickOffGeneration(createdFunnelId);
    startPolling(createdFunnelId, pageNames);
  }

  async function handleBriefComplete(brief: FunnelBrief) {
    setLoading(true);
    setError("");
    setStalled(false);
    setGeneratingPage(-1);
    setGeneratedCount(0);

    const names = brief.pageSpecs.map((s) => s.name);
    setPageNames(names);

    let funnelCreated = false;

    try {
      // Step 1: Create funnel shell with brief
      const res = await fetch("/api/funnel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ brief }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create funnel");
      }

      const { funnel } = await res.json();
      funnelCreated = true;
      setCreatedFunnelId(funnel.id);

      // Step 2: Kick off server-side generation
      setGeneratingPage(0);
      await kickOffGeneration(funnel.id);

      // Step 3: Poll for progress
      startPolling(funnel.id, names);
    } catch (err) {
      if (funnelCreated) {
        onComplete();
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setGeneratingPage(-1);
    }
  }

  // ── Building progress screen ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 max-w-sm mx-auto">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-2 border-t-leaf-400 animate-spin" />
        </div>
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-gray-900 mb-1">
            Building your funnel...
          </p>
          <p className="text-sm text-gray-500">
            {generatingPage >= 0
              ? `Generating page ${generatingPage + 1} of ${pageNames.length}`
              : "Setting up..."}
          </p>
        </div>
        <div className="w-full space-y-2">
          {pageNames.map((name, i) => (
            <div
              key={name}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                i < generatedCount
                  ? "bg-leaf-400/10"
                  : i === generatingPage
                    ? "bg-gray-50"
                    : ""
              }`}
            >
              {i < generatedCount ? (
                <svg
                  className="w-5 h-5 text-leaf-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : i === generatingPage ? (
                <div className="w-5 h-5 rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  i < generatedCount
                    ? "text-leaf-400 font-medium"
                    : i === generatingPage
                      ? "text-gray-900 font-medium"
                      : "text-gray-400"
                }`}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
        {error && (
          <div className="w-full space-y-3 mt-2">
            <p className="text-sm text-red-500 text-center">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-lg bg-leaf-400 text-white text-sm font-medium hover:bg-leaf-400/90 transition-colors cursor-pointer"
              >
                Retry
              </button>
              <button
                onClick={onComplete}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Image review phase ─────────────────────────────────────────
  if (phase === "images") {
    return (
      <ImageReview
        images={reviewImages}
        onChange={setReviewImages}
        onContinue={handleImageReviewContinue}
        onBack={() => {
          setPhase("entry");
          setReviewImages([]);
          setScanProductInfo(null);
        }}
      />
    );
  }

  // ── Chat phase ───────────────────────────────────────────────
  if (phase === "chat") {
    return (
      <FunnelChat
        mode="create"
        initialContext={chatContext}
        onComplete={handleBriefComplete}
        onBack={() => {
          // If we have images, go back to image review; otherwise go to entry
          if (reviewImages.length > 0) {
            setPhase("images");
          } else {
            setPhase("entry");
            setChatContext({});
          }
        }}
      />
    );
  }

  // ── Entry screen ──────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        How do you want to start?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Import from an existing product page, or build from scratch.
      </p>

      {/* URL input */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="url"
            value={scanUrl}
            onChange={(e) => {
              setScanUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && scanUrl.trim() && handleScan()
            }
            placeholder="https://your-product.com"
            autoFocus
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 transition-colors"
          />
          <button
            onClick={handleScan}
            disabled={!scanUrl.trim() || scanning}
            className="px-5 py-3 rounded-xl bg-leaf-400 text-white font-medium hover:bg-leaf-400/90 transition-colors disabled:opacity-30 cursor-pointer whitespace-nowrap"
          >
            {scanning ? "Scanning..." : "Scan"}
          </button>
        </div>

        {/* Scanning spinner */}
        {scanning && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="w-5 h-5 rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin shrink-0" />
            <p className="text-sm text-gray-500">
              Fetching page and extracting product info...
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="relative flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={() => setPhase("chat")}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:border-leaf-400 transition-colors cursor-pointer"
      >
        Build from scratch
      </button>
    </div>
  );
}

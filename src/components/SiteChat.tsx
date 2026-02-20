"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPreferences,
  savePreferences,
  addInteraction,
  type SitePreferences,
} from "@/lib/preferences";

interface ChatOption {
  label: string;
  icon: string;
  action: string; // key for routing logic
}

interface ChatStep {
  message: string;
  options: ChatOption[];
}

const STEPS: Record<string, ChatStep> = {
  root: {
    message: "How can I improve?",
    options: [
      { label: "Look & Feel", icon: "\u{1F3A8}", action: "look" },
      { label: "More Features", icon: "\u{1F3AE}", action: "features" },
      { label: "Something's Off", icon: "\u{1F527}", action: "fix" },
      { label: "Surprise Me", icon: "\u{2728}", action: "surprise" },
    ],
  },
  look: {
    message: "What should change?",
    options: [
      { label: "Text Too Small", icon: "\u{1F520}", action: "font-bigger" },
      { label: "Text Too Big", icon: "\u{1F524}", action: "font-smaller" },
      { label: "Want More Space", icon: "\u{2195}\u{FE0F}", action: "pref-spacious" },
      { label: "Looks Great!", icon: "\u{1F44D}", action: "pref-looks-good" },
    ],
  },
  features: {
    message: "What kind of features?",
    options: [
      { label: "Mini Games", icon: "\u{1F3B2}", action: "want-games" },
      { label: "Useful Tools", icon: "\u{1F6E0}\u{FE0F}", action: "want-tools" },
      { label: "Creative Toys", icon: "\u{1F3A8}", action: "want-creative" },
      { label: "Site Meta", icon: "\u{1F52E}", action: "want-meta" },
    ],
  },
  fix: {
    message: "What feels off?",
    options: [
      { label: "Too Cluttered", icon: "\u{1F4E6}", action: "fix-cluttered" },
      { label: "Hard to Use", icon: "\u{1F914}", action: "fix-usability" },
      { label: "Too Plain", icon: "\u{1F611}", action: "fix-boring" },
      { label: "Something Broke", icon: "\u{1F6A8}", action: "fix-broken" },
    ],
  },
};

const CONFIRMATIONS: Record<string, string> = {
  "font-bigger": "Got it — making text larger!",
  "font-smaller": "Got it — making text smaller!",
  "pref-spacious": "Noted — more breathing room.",
  "pref-looks-good": "Thanks! Glad you like it.",
  "want-games": "More games coming up!",
  "want-tools": "Useful tools, noted!",
  "want-creative": "Creative toys it is!",
  "want-meta": "More self-awareness, got it!",
  "fix-cluttered": "Noted — will aim for cleaner layouts.",
  "fix-usability": "Thanks — will focus on ease of use.",
  "fix-boring": "More visual flair, coming up!",
  "fix-broken": "Sorry about that — will be more careful.",
  surprise: "On it!",
};

export default function SiteChat({
  onPrefsChange,
  triggerOpen,
}: {
  onPrefsChange: (prefs: SitePreferences) => void;
  triggerOpen?: number; // increment to open from outside
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("root");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);

  // Open from outside (e.g. frustration detection)
  useEffect(() => {
    if (triggerOpen && triggerOpen > 0) {
      setOpen(true);
      setStep("fix");
      setNudge("Noticed you were trying to interact — need help?");
    }
  }, [triggerOpen]);

  const applyAction = useCallback(
    (action: string, label: string) => {
      const prefs = getPreferences();
      const updated = addInteraction(prefs, label);

      // Apply immediate effects
      switch (action) {
        case "font-bigger":
          updated.fontSize =
            updated.fontSize === "small"
              ? "default"
              : updated.fontSize === "default"
                ? "large"
                : "xl";
          break;
        case "font-smaller":
          updated.fontSize =
            updated.fontSize === "xl"
              ? "large"
              : updated.fontSize === "large"
                ? "default"
                : "small";
          break;
        case "pref-spacious":
          if (!updated.uiFeedback.includes("spacious"))
            updated.uiFeedback.push("spacious");
          break;
        case "pref-looks-good":
          if (!updated.uiFeedback.includes("looks-good"))
            updated.uiFeedback.push("looks-good");
          break;
        case "want-games":
          if (!updated.wantMore.includes("games"))
            updated.wantMore.push("games");
          break;
        case "want-tools":
          if (!updated.wantMore.includes("tools"))
            updated.wantMore.push("tools");
          break;
        case "want-creative":
          if (!updated.wantMore.includes("creative"))
            updated.wantMore.push("creative");
          break;
        case "want-meta":
          if (!updated.wantMore.includes("meta"))
            updated.wantMore.push("meta");
          break;
        case "fix-cluttered":
          if (!updated.uiFeedback.includes("cluttered"))
            updated.uiFeedback.push("cluttered");
          break;
        case "fix-usability":
          if (!updated.uiFeedback.includes("hard-to-use"))
            updated.uiFeedback.push("hard-to-use");
          break;
        case "fix-boring":
          if (!updated.uiFeedback.includes("too-plain"))
            updated.uiFeedback.push("too-plain");
          break;
        case "fix-broken":
          if (!updated.uiFeedback.includes("broken"))
            updated.uiFeedback.push("broken");
          break;
      }

      savePreferences(updated);
      onPrefsChange(updated);
    },
    [onPrefsChange]
  );

  function handleOption(option: ChatOption) {
    setNudge(null);
    setHistory((h) => [...h, option.label]);

    // Check if this action leads to a substep
    if (STEPS[option.action]) {
      setStep(option.action);
      return;
    }

    // Terminal action — apply and show confirmation
    applyAction(option.action, option.label);
    setConfirmation(CONFIRMATIONS[option.action] || "Noted!");

    setTimeout(() => {
      setConfirmation(null);
      setStep("root");
      setHistory([]);
    }, 2000);
  }

  function handleClose() {
    setOpen(false);
    setStep("root");
    setHistory([]);
    setConfirmation(null);
  }

  const currentStep = STEPS[step] || STEPS.root;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        title="Talk to the site"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              GenUI Feedback
            </span>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* Breadcrumb of past choices */}
            {history.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}

            {/* Nudge from frustration detection */}
            {nudge && !confirmation && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-violet-900/30 border border-violet-800/50">
                <p className="text-xs text-violet-300">{nudge}</p>
              </div>
            )}

            {confirmation ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-2">{"\u2705"}</div>
                <p className="text-sm text-gray-300">{confirmation}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  {currentStep.message}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {currentStep.options.map((option) => (
                    <button
                      key={option.action}
                      onClick={() => handleOption(option)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-violet-500/50 p-3 transition-all cursor-pointer active:scale-95"
                    >
                      <span className="text-xl">{option.icon}</span>
                      <span className="text-xs text-gray-300">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Back button */}
            {step !== "root" && !confirmation && (
              <button
                onClick={() => {
                  setStep("root");
                  setHistory([]);
                }}
                className="mt-3 text-xs text-gray-600 hover:text-gray-400 cursor-pointer"
              >
                {"\u2190"} Back
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

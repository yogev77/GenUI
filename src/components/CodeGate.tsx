"use client";

import { useState, useRef, useEffect } from "react";
import { isUnlocked, unlock } from "@/lib/auth";

export default function CodeGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isUnlocked()) setUnlocked(true);
  }, []);

  async function verify(digits: string[]) {
    const fullCode = digits.join("");
    if (fullCode.length !== 4) return;

    setChecking(true);
    setError(false);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      });

      if (res.ok) {
        unlock(fullCode);
        setUnlocked(true);
      } else {
        setError(true);
        setCode(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  }

  function handleInput(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;

    const next = [...code];
    next[index] = value;
    setCode(next);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 3) {
      verify(next);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const digits = pasted.split("");
      setCode(digits);
      verify(digits);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-3">
          GenUI
        </h1>
        <p className="text-gray-500 text-sm mb-8">Enter access code</p>

        <div className="flex gap-3 justify-center mb-4">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={checking}
              autoFocus={i === 0}
              className={`w-14 h-16 text-center text-2xl font-mono rounded-xl border-2 bg-gray-900 outline-none transition-all
                ${error ? "border-red-500 text-red-400" : "border-gray-700 text-white focus:border-violet-500"}
                ${checking ? "opacity-50" : ""}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500">Wrong code — try again</p>
        )}
      </div>
    </div>
  );
}

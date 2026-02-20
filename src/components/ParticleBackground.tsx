"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glow: number; // 0..1, how lit up the dot is
}

const DOT_COLOR = [51, 139, 213]; // #338bd5 (leaf-400)
const DOT_RADIUS = 2;
const DOT_BASE_OPACITY = 0.15;
const TRACER_OPACITY = 0.3;
const TRACER_SPEED = 3; // px per frame
const DRIFT_SPEED = 0.15;
const GLOW_DECAY = 0.015;
const TRAIL_FADE = 0.025;
const TRAIL_MAX = 60;

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let tracerPos = { x: 0, y: 0 };
    let targetDotIdx = -1;
    let mousePos: { x: number; y: number } | null = null;
    let trail: { x: number; y: number; alpha: number }[] = [];
    let rafId = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    function initDots() {
      const count = w < 640 ? 40 : 80;
      dots = [];
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * DRIFT_SPEED,
          vy: (Math.random() - 0.5) * DRIFT_SPEED,
          glow: 0,
        });
      }
      // Start tracer at a random dot
      const startIdx = Math.floor(Math.random() * dots.length);
      tracerPos = { x: dots[startIdx].x, y: dots[startIdx].y };
      targetDotIdx = -1;
      trail = [];
    }

    function pickTarget(): { x: number; y: number } {
      // Target is mouse position if available, otherwise random point
      if (mousePos) return mousePos;
      return { x: Math.random() * w, y: Math.random() * h };
    }

    function findNextDot(target: { x: number; y: number }): number {
      // Find the dot nearest to tracer that is closer to the target than the tracer
      const tracerDist = Math.hypot(target.x - tracerPos.x, target.y - tracerPos.y);
      let bestIdx = -1;
      let bestScore = Infinity;

      for (let i = 0; i < dots.length; i++) {
        const dx = dots[i].x - tracerPos.x;
        const dy = dots[i].y - tracerPos.y;
        const distFromTracer = Math.hypot(dx, dy);
        if (distFromTracer < 5) continue; // skip if too close (already there)

        const distToTarget = Math.hypot(target.x - dots[i].x, target.y - dots[i].y);
        // Prefer dots that are closer to target AND not too far from tracer
        if (distToTarget < tracerDist) {
          const score = distFromTracer + distToTarget * 0.5;
          if (score < bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
      }

      // If no dot is closer to target, just pick nearest dot
      if (bestIdx === -1) {
        let nearestDist = Infinity;
        for (let i = 0; i < dots.length; i++) {
          const d = Math.hypot(dots[i].x - tracerPos.x, dots[i].y - tracerPos.y);
          if (d > 5 && d < nearestDist) {
            nearestDist = d;
            bestIdx = i;
          }
        }
      }

      return bestIdx;
    }

    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Drift dots
      for (const dot of dots) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        // Bounce off edges
        if (dot.x < 0 || dot.x > w) dot.vx *= -1;
        if (dot.y < 0 || dot.y > h) dot.vy *= -1;
        dot.x = Math.max(0, Math.min(w, dot.x));
        dot.y = Math.max(0, Math.min(h, dot.y));
        // Decay glow
        if (dot.glow > 0) dot.glow = Math.max(0, dot.glow - GLOW_DECAY);
      }

      // Pick target dot if needed
      if (targetDotIdx === -1 || targetDotIdx >= dots.length) {
        const target = pickTarget();
        targetDotIdx = findNextDot(target);
      }

      // Move tracer toward target dot
      if (targetDotIdx >= 0) {
        const dot = dots[targetDotIdx];
        const dx = dot.x - tracerPos.x;
        const dy = dot.y - tracerPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < TRACER_SPEED + 2) {
          // Arrived at dot — light it up
          tracerPos.x = dot.x;
          tracerPos.y = dot.y;
          dot.glow = 1;

          // Pick next
          const target = pickTarget();
          targetDotIdx = findNextDot(target);
        } else {
          tracerPos.x += (dx / dist) * TRACER_SPEED;
          tracerPos.y += (dy / dist) * TRACER_SPEED;
        }
      }

      // Add to trail
      trail.push({ x: tracerPos.x, y: tracerPos.y, alpha: TRACER_OPACITY });
      if (trail.length > TRAIL_MAX) trail.shift();

      // Fade trail
      for (const seg of trail) {
        seg.alpha = Math.max(0, seg.alpha - TRAIL_FADE);
      }

      // Draw trail
      for (let i = 1; i < trail.length; i++) {
        const prev = trail[i - 1];
        const curr = trail[i];
        if (curr.alpha <= 0) continue;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = `rgba(${DOT_COLOR.join(",")},${curr.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw dots
      for (const dot of dots) {
        const alpha = DOT_BASE_OPACITY + dot.glow * (1 - DOT_BASE_OPACITY);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS + dot.glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${DOT_COLOR.join(",")},${alpha})`;
        ctx.fill();

        // Glow ring
        if (dot.glow > 0.1) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, DOT_RADIUS + 6 * dot.glow, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${DOT_COLOR.join(",")},${dot.glow * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function onPointerMove(e: PointerEvent) {
      mousePos = { x: e.clientX, y: e.clientY };
    }

    function onPointerLeave() {
      mousePos = null;
    }

    // Init
    resize();
    initDots();
    rafId = requestAnimationFrame(tick);

    window.addEventListener("resize", () => {
      resize();
      initDots();
    });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

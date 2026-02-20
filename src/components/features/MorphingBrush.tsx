// @ts-nocheck
"use client";

import { useRef, useCallback, useState, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

export default function MorphingBrush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  const [brushSize, setBrushSize] = useState<number>(20);
  const [morphSpeed, setMorphSpeed] = useState<number>(0.02);
  const [particleCount, setParticleCount] = useState<number>(5);

  const createParticle = useCallback((x: number, y: number, hue: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 255,
      maxLife: 255,
      hue,
      size: Math.random() * brushSize * 0.5 + brushSize * 0.25
    };
  }, [brushSize]);

  const addParticles = useCallback((x: number, y: number) => {
    const time = Date.now() * 0.001;
    const hue = (Math.sin(time * 0.5) * 180 + 180) % 360;
    
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * brushSize;
      const offsetY = (Math.random() - 0.5) * brushSize;
      particlesRef.current.push(createParticle(x + offsetX, y + offsetY, hue));
    }
    
    // Limit total particles
    if (particlesRef.current.length > 1000) {
      particlesRef.current = particlesRef.current.slice(-800);
    }
  }, [particleCount, brushSize, createParticle]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fade background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const time = Date.now() * 0.001;
    
    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      // Apply morphing forces
      const morphX = Math.sin(time + particle.x * 0.01) * morphSpeed;
      const morphY = Math.cos(time + particle.y * 0.01) * morphSpeed;
      
      particle.vx += morphX;
      particle.vy += morphY;
      
      // Apply some drag
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 2;
      
      // Draw particle
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      
      // Create gradient
      const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size);
      gradient.addColorStop(0, `hsl(${particle.hue}, 80%, 60%)`);
      gradient.addColorStop(0.5, `hsl(${(particle.hue + 30) % 360}, 70%, 50%)`);
      gradient.addColorStop(1, `hsl(${(particle.hue + 60) % 360}, 60%, 40%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add some sparkle
      if (Math.random() < 0.1) {
        ctx.fillStyle = `hsl(${particle.hue}, 100%, 90%)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      return particle.life > 0;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [morphSpeed]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const pos = getMousePos(e);
    lastPosRef.current = pos;
    addParticles(pos.x, pos.y);
  }, [getMousePos, addParticles]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    
    const pos = getMousePos(e);
    const dx = pos.x - lastPosRef.current.x;
    const dy = pos.y - lastPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Add particles along the stroke
    const steps = Math.max(1, Math.floor(distance / 5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = lastPosRef.current.x + dx * t;
      const y = lastPosRef.current.y + dy * t;
      addParticles(x, y);
    }
    
    lastPosRef.current = pos;
  }, [getMousePos, addParticles]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    animate();
    
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [resizeCanvas, animate]);

  return (
    <div className="w-full h-full bg-slate-900 p-4 flex flex-col">
      <div className="mb-4">
        <h3 className="text-white text-lg font-bold mb-3">Morphing Brush</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-slate-300 text-sm block mb-1">Brush Size</label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-1">Morph Speed</label>
            <input
              type="range"
              min="0.005"
              max="0.05"
              step="0.005"
              value={morphSpeed}
              onChange={(e) => setMorphSpeed(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-1">Density</label>
            <input
              type="range"
              min="1"
              max="15"
              value={particleCount}
              onChange={(e) => setParticleCount(Number(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>
        </div>
        <button
          onClick={clearCanvas}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          Clear Canvas
        </button>
      </div>
      
      <div className="flex-1 bg-slate-800 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ minHeight: '300px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      <p className="text-slate-400 text-xs mt-2">
        Click and drag to paint with morphing, flowing particles
      </p>
    </div>
  );
}
// @ts-nocheck
"use client";

import { useRef, useEffect, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number;
}

interface FlowFieldConfig {
  particleCount: number;
  flowStrength: number;
  fadeRate: number;
}

export default function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [config, setConfig] = useState<FlowFieldConfig>({
    particleCount: 100,
    flowStrength: 0.02,
    fadeRate: 0.01
  });

  const initializeParticles = useCallback((width: number, height: number) => {
    particlesRef.current = Array.from({ length: config.particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      alpha: Math.random() * 0.5 + 0.5,
      hue: Math.random() * 360
    }));
  }, [config.particleCount]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Fade the canvas
    ctx.fillStyle = `rgba(0, 0, 0, ${config.fadeRate})`;
    ctx.fillRect(0, 0, width, height);
    
    // Update and draw particles
    particlesRef.current.forEach(particle => {
      // Calculate flow field based on position and mouse
      const dx = mouseRef.current.x - particle.x;
      const dy = mouseRef.current.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const angle = Math.sin(particle.x * 0.01) * Math.cos(particle.y * 0.01) + 
                   Math.atan2(dy, dx) * 0.1;
      
      const force = Math.min(100 / (distance + 1), 2);
      
      particle.vx += Math.cos(angle) * config.flowStrength * force;
      particle.vy += Math.sin(angle) * config.flowStrength * force;
      
      // Apply friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      
      // Update hue based on velocity
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      particle.hue = (particle.hue + speed * 2) % 360;
      
      // Draw particle
      ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(1, speed * 2), 0, Math.PI * 2);
      ctx.fill();
    });
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [config, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      initializeParticles(rect.width, rect.height);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };
    
    resizeCanvas();
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initializeParticles]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isPlaying]);

  const resetField = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const rect = canvas.getBoundingClientRect();
    initializeParticles(rect.width, rect.height);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Flow Field</h3>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full h-48 bg-black rounded border border-gray-700 cursor-crosshair"
      />
      
      <div className="mt-3 space-y-2">
        <div>
          <label className="text-gray-400 text-xs block mb-1">
            Particles: {config.particleCount}
          </label>
          <input
            type="range"
            min="50"
            max="200"
            value={config.particleCount}
            onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={resetField}
            className="flex-1 px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setConfig({
              particleCount: 50 + Math.floor(Math.random() * 150),
              flowStrength: 0.01 + Math.random() * 0.03,
              fadeRate: 0.005 + Math.random() * 0.02
            })}
            className="flex-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
          >
            Randomize
          </button>
        </div>
      </div>
      
      <p className="text-gray-500 text-xs mt-2">
        Move your mouse over the canvas to influence the flow
      </p>
    </div>
  );
}
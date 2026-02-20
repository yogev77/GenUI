// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  sparkle: boolean;
}

export default function FireworksSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);

  const colors = [
    '#ff1744', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#00bcd4', '#009688',
    '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
    '#ffc107', '#ff9800', '#ff5722', '#f44336'
  ];

  const createExplosion = useCallback((x: number, y: number) => {
    const particleCount = 30 + Math.random() * 20;
    const explosionColor = colors[Math.floor(Math.random() * colors.length)];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      const life = 60 + Math.random() * 40;
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: Math.random() < 0.7 ? explosionColor : colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
        sparkle: Math.random() < 0.3
      });
    }
  }, []);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.vx *= 0.99; // air resistance
      particle.life--;
      
      return particle.life > 0;
    });
  }, []);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (particle.sparkle && Math.random() < 0.1) {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
      }
      
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add sparkle effect
      if (particle.sparkle && alpha > 0.5) {
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }, []);

  const animate = useCallback(() => {
    updateParticles();
    drawParticles();
    
    if (isActive || particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isActive, updateParticles, drawParticles]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    createExplosion(x, y);
    
    if (!isActive) {
      setIsActive(true);
    }
  }, [createExplosion, isActive]);

  const handleAutoFireworks = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.6) + canvas.height * 0.1;
    
    createExplosion(x, y);
  }, [createExplosion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Clear with dark background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgb(0, 0, 20)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (isActive && !animationRef.current) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isActive, animate]);

  useEffect(() => {
    if (particlesRef.current.length === 0 && isActive) {
      setIsActive(false);
    }
  }, [isActive]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-white mb-2">🎆 Fireworks Simulator</h3>
        <p className="text-sm text-gray-300 mb-3">Click anywhere to create colorful explosions!</p>
        <button
          onClick={handleAutoFireworks}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
        >
          🎇 Auto Firework
        </button>
      </div>
      
      <div className="flex-1 relative min-h-96">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair rounded-lg border-2 border-gray-700 bg-slate-900"
          style={{ background: 'radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)' }}
        />
      </div>
      
      <div className="mt-2 text-center">
        <div className="text-xs text-gray-400">
          Particles: {particlesRef.current.length}
        </div>
      </div>
    </div>
  );
}
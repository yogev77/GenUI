// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';

interface WaveConfig {
  amplitude: number;
  frequency: number;
  speed: number;
  color: string;
}

export default function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [waves, setWaves] = useState<WaveConfig[]>([
    { amplitude: 30, frequency: 0.02, speed: 0.03, color: '#3b82f6' },
    { amplitude: 20, frequency: 0.03, speed: 0.02, color: '#10b981' },
    { amplitude: 25, frequency: 0.025, speed: 0.035, color: '#f59e0b' }
  ]);
  
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw waves
    waves.forEach((wave, index) => {
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      
      ctx.beginPath();
      
      for (let x = 0; x < width; x++) {
        const y = height / 2 + 
          wave.amplitude * Math.sin(x * wave.frequency + timeRef.current * wave.speed) +
          (wave.amplitude * 0.3) * Math.sin(x * wave.frequency * 2.1 + timeRef.current * wave.speed * 1.3);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    });
    
    ctx.globalAlpha = 1;
    timeRef.current += 1;
  };
  
  const animate = () => {
    draw();
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 280;
    canvas.height = 150;
    
    if (isPlaying) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, waves]);
  
  const randomizeWaves = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const newWaves: WaveConfig[] = Array.from({ length: 3 }, () => ({
      amplitude: Math.random() * 40 + 10,
      frequency: Math.random() * 0.03 + 0.01,
      speed: Math.random() * 0.04 + 0.01,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setWaves(newWaves);
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Waveform Visualizer</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={randomizeWaves}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Randomize
          </button>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded border border-slate-700 mb-3">
        <canvas 
          ref={canvasRef}
          className="w-full h-auto block"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {waves.map((wave, index) => (
          <div 
            key={index}
            className="flex items-center gap-1 text-xs"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: wave.color }}
            />
            <span className="text-slate-300">Wave {index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
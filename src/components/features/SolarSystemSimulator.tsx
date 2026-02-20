// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface Planet {
  name: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  angle: number;
  realSize: number;
  orbitalPeriod: number;
}

export default function SolarSystemSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [focusedPlanet, setFocusedPlanet] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const centerRef = useRef({ x: 0, y: 0 });
  const planetsRef = useRef<Planet[]>([
    { name: 'Mercury', color: '#8C7853', size: 4, distance: 60, speed: 0.04, angle: 0, realSize: 0.38, orbitalPeriod: 88 },
    { name: 'Venus', color: '#FFA500', size: 6, distance: 80, speed: 0.015, angle: 0, realSize: 0.95, orbitalPeriod: 225 },
    { name: 'Earth', color: '#4169E1', size: 6, distance: 100, speed: 0.01, angle: 0, realSize: 1.0, orbitalPeriod: 365 },
    { name: 'Mars', color: '#CD5C5C', size: 5, distance: 130, speed: 0.008, angle: 0, realSize: 0.53, orbitalPeriod: 687 },
    { name: 'Jupiter', color: '#DAA520', size: 18, distance: 180, speed: 0.002, angle: 0, realSize: 11.2, orbitalPeriod: 4333 },
    { name: 'Saturn', color: '#FAD5A5', size: 16, distance: 220, speed: 0.0009, angle: 0, realSize: 9.4, orbitalPeriod: 10759 },
    { name: 'Uranus', color: '#4FD0E3', size: 12, distance: 260, speed: 0.0004, angle: 0, realSize: 4.0, orbitalPeriod: 30687 },
    { name: 'Neptune', color: '#4169E1', size: 12, distance: 300, speed: 0.0001, angle: 0, realSize: 3.9, orbitalPeriod: 60190 }
  ]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const center = centerRef.current;

    let clickedPlanet: string | null = null;
    let minDistance = Infinity;

    planetsRef.current.forEach(planet => {
      const planetX = center.x + Math.cos(planet.angle) * planet.distance;
      const planetY = center.y + Math.sin(planet.angle) * planet.distance;
      const distance = Math.sqrt((x - planetX) ** 2 + (y - planetY) ** 2);
      
      if (distance < planet.size + 10 && distance < minDistance) {
        minDistance = distance;
        clickedPlanet = planet.name;
      }
    });

    if (clickedPlanet) {
      setFocusedPlanet(prev => prev === clickedPlanet ? null : clickedPlanet);
    } else {
      setFocusedPlanet(null);
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    centerRef.current = center;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 73.3) % height;
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw orbital paths
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    planetsRef.current.forEach(planet => {
      ctx.beginPath();
      ctx.arc(center.x, center.y, planet.distance, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw sun
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 15);
    gradient.addColorStop(0, '#FFFF00');
    gradient.addColorStop(1, '#FF8C00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Update and draw planets
    planetsRef.current.forEach(planet => {
      if (isRunning) {
        planet.angle += planet.speed * speed;
      }

      const x = center.x + Math.cos(planet.angle) * planet.distance;
      const y = center.y + Math.sin(planet.angle) * planet.distance;

      // Highlight focused planet
      if (focusedPlanet === planet.name) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, planet.size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw planet
      ctx.fillStyle = planet.color;
      ctx.beginPath();
      ctx.arc(x, y, planet.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw planet name if focused
      if (focusedPlanet === planet.name) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, x, y - planet.size - 15);
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, speed, focusedPlanet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.min(rect.width * 0.75, 400);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const focusedPlanetData = planetsRef.current.find(p => p.name === focusedPlanet);

  return (
    <div className="w-full bg-gray-900 text-white p-4 rounded-lg">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Solar System Simulator</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1 rounded text-sm ${
              isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <label className="flex items-center gap-2 text-sm">
            Speed:
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-16"
            />
            <span className="text-xs">{speed}x</span>
          </label>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full border border-gray-700 rounded cursor-pointer"
        style={{ maxHeight: '400px' }}
      />
      
      {focusedPlanetData && (
        <div className="mt-4 p-3 bg-gray-800 rounded">
          <h4 className="font-bold text-lg" style={{ color: focusedPlanetData.color }}>
            {focusedPlanetData.name}
          </h4>
          <div className="text-sm space-y-1">
            <p>Relative Size: {focusedPlanetData.realSize}x Earth</p>
            <p>Orbital Period: {focusedPlanetData.orbitalPeriod} Earth days</p>
            <p>Distance from Sun: {focusedPlanetData.distance} units</p>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-400 mt-2">
        Click on any planet to focus and view details. Not to scale for visibility.
      </p>
    </div>
  );
}
// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number;
  brightness: number;
  type: 'seed' | 'bloom' | 'petal';
}

interface Flower {
  x: number;
  y: number;
  age: number;
  hue: number;
  particles: Particle[];
}

export default function ParticleGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [isPlanting, setIsPlanting] = useState<boolean>(false);
  const [selectedHue, setSelectedHue] = useState<number>(180);

  const createParticle = useCallback((x: number, y: number, type: 'seed' | 'bloom' | 'petal', hue: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'seed' ? 0.5 : type === 'bloom' ? 2 : 4;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
      vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5) - (type === 'seed' ? 1 : 0),
      age: 0,
      maxAge: type === 'seed' ? 180 : type === 'bloom' ? 120 : 60,
      size: type === 'seed' ? 2 : type === 'bloom' ? 4 : 6,
      hue: hue + (Math.random() - 0.5) * 30,
      brightness: 50 + Math.random() * 50,
      type
    };
  }, []);

  const plantFlower = useCallback((x: number, y: number) => {
    const newFlower: Flower = {
      x,
      y,
      age: 0,
      hue: selectedHue,
      particles: []
    };
    
    // Create initial seed particles
    for (let i = 0; i < 5; i++) {
      newFlower.particles.push(createParticle(x, y, 'seed', selectedHue));
    }
    
    setFlowers(prev => [...prev, newFlower]);
  }, [selectedHue, createParticle]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    plantFlower(x, y);
  }, [plantFlower]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#0f0f23');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      setFlowers(prevFlowers => {
        return prevFlowers.map(flower => {
          flower.age++;
          
          // Grow flower - add bloom particles
          if (flower.age % 20 === 0 && flower.age < 300) {
            for (let i = 0; i < 3; i++) {
              flower.particles.push(createParticle(flower.x, flower.y, 'bloom', flower.hue));
            }
          }
          
          // Mature flower - add petal particles
          if (flower.age > 100 && flower.age % 30 === 0 && flower.age < 500) {
            for (let i = 0; i < 2; i++) {
              flower.particles.push(createParticle(flower.x, flower.y, 'petal', flower.hue));
            }
          }

          // Update and draw particles
          flower.particles = flower.particles.filter(particle => {
            particle.age++;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.02; // gravity
            particle.vx *= 0.99; // friction
            particle.vy *= 0.99;

            const life = 1 - (particle.age / particle.maxAge);
            const alpha = Math.max(0, life);
            
            if (alpha > 0) {
              ctx.save();
              ctx.globalAlpha = alpha;
              
              const currentSize = particle.size * (0.5 + life * 0.5);
              
              if (particle.type === 'petal') {
                // Draw petal shape
                ctx.fillStyle = `hsl(${particle.hue}, 70%, ${particle.brightness}%)`;
                ctx.beginPath();
                ctx.ellipse(particle.x, particle.y, currentSize * 1.5, currentSize * 0.8, particle.age * 0.1, 0, Math.PI * 2);
                ctx.fill();
              } else {
                // Draw circular particles
                const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, currentSize);
                gradient.addColorStop(0, `hsl(${particle.hue}, 80%, ${particle.brightness}%)`);
                gradient.addColorStop(1, `hsl(${particle.hue}, 60%, ${particle.brightness * 0.3}%)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
                ctx.fill();
              }
              
              ctx.restore();
              return true;
            }
            return false;
          });

          return flower;
        }).filter(flower => flower.particles.length > 0 || flower.age < 100);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticle]);

  const clearGarden = useCallback(() => {
    setFlowers([]);
  }, []);

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {[0, 60, 120, 180, 240, 300].map(hue => (
            <button
              key={hue}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedHue === hue ? 'border-white scale-110' : 'border-gray-400 hover:border-gray-200'
              }`}
              style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
              onClick={() => setSelectedHue(hue)}
            />
          ))}
        </div>
        
        <button
          onClick={clearGarden}
          className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
        >
          Clear Garden
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 text-white text-sm opacity-75">
        Click to plant flowers • {flowers.length} flowers growing
      </div>
    </div>
  );
}
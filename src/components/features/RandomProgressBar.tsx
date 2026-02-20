"use client";

import { useState, useEffect, useRef } from 'react';

export default function RandomProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const confettiParticles = useRef([]);

  const createConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 280;
    canvas.height = 200;
    
    confettiParticles.current = [];
    for (let i = 0; i < 50; i++) {
      confettiParticles.current.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        size: Math.random() * 4 + 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      });
    }
  };

  const animateConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiParticles.current.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1;
      particle.rotation += particle.rotationSpeed;
      
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
      
      if (particle.y > canvas.height + 10) {
        confettiParticles.current.splice(index, 1);
      }
    });
    
    if (confettiParticles.current.length > 0) {
      animationRef.current = requestAnimationFrame(animateConfetti);
    } else {
      setShowConfetti(false);
    }
  };

  const startProgress = () => {
    if (progress >= 100) {
      setProgress(0);
    }
    
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 3 + 0.5;
        const newProgress = Math.min(prev + increment, 100);
        
        if (newProgress >= 100) {
          setIsRunning(false);
          setShowConfetti(true);
          return 100;
        }
        
        return newProgress;
      });
    }, 50 + Math.random() * 100);
  };

  const stopProgress = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetProgress = () => {
    setProgress(0);
    setIsRunning(false);
    setShowConfetti(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    if (showConfetti) {
      createConfetti();
      animateConfetti();
    }
  }, [showConfetti]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Random Progress</h3>
        <div className="text-2xl font-mono text-blue-600">
          {Math.round(progress)}%
        </div>
      </div>
      
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={startProgress}
          disabled={isRunning || progress >= 100}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Start
        </button>
        <button
          onClick={stopProgress}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Stop
        </button>
        <button
          onClick={resetProgress}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
        >
          Reset
        </button>
      </div>
      
      {progress >= 100 && (
        <div className="text-center">
          <div className="text-xl animate-bounce">🎉 Complete! 🎉</div>
        </div>
      )}
      
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        />
      )}
    </div>
  );
}
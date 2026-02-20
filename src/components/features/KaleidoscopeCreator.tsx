// @ts-nocheck
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

export default function KaleidoscopeCreator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [segments, setSegments] = useState<number>(6);
  const [brushSize, setBrushSize] = useState<number>(3);
  const [currentColor, setCurrentColor] = useState<string>('#ff6b6b');
  const [trails, setTrails] = useState<boolean>(true);

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'];

  const getCanvasCoordinates = useCallback((event: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;
    
    if (clientX === undefined || clientY === undefined) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  }, []);

  const drawKaleidoscope = useCallback((point: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.9;

    // Translate point to relative position from center
    const relX = point.x - centerX;
    const relY = point.y - centerY;

    // Only draw if within the kaleidoscope circle
    if (Math.sqrt(relX * relX + relY * relY) > radius) return;

    ctx.fillStyle = currentColor;
    ctx.globalCompositeOperation = 'source-over';

    // Draw in each segment
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      
      // Mirror every other segment for true kaleidoscope effect
      if (i % 2 === 1) {
        ctx.scale(1, -1);
      }
      
      ctx.beginPath();
      ctx.arc(relX, relY, brushSize, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
    }
  }, [currentColor, segments, brushSize]);

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setIsDrawing(true);
    const point = getCanvasCoordinates(event.nativeEvent);
    if (point) {
      drawKaleidoscope(point);
    }
  }, [getCanvasCoordinates, drawKaleidoscope]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing) return;
    
    const point = getCanvasCoordinates(event.nativeEvent);
    if (point) {
      drawKaleidoscope(point);
    }
  }, [isDrawing, getCanvasCoordinates, drawKaleidoscope]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    if (trails) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw guide circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.9;
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }, [trails]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;

    const size = Math.min(container.clientWidth, 400);
    canvas.width = size;
    canvas.height = size;
    clearCanvas();
  }, [clearCanvas]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    clearCanvas();
  }, [segments, trails, clearCanvas]);

  return (
    <div className="w-full p-4 bg-gray-900 text-white rounded-lg">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-purple-300 mb-2">Kaleidoscope Creator</h3>
        <p className="text-sm text-gray-300">Draw inside the circle to create mesmerizing patterns</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-md">
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-purple-500 rounded-lg cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  currentColor === color ? 'border-white scale-110' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-purple-300 mb-1">Segments: {segments}</label>
              <input
                type="range"
                min="3"
                max="12"
                value={segments}
                onChange={(e) => setSegments(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="block text-purple-300 mb-1">Brush: {brushSize}px</label>
              <input
                type="range"
                min="1"
                max="8"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setTrails(!trails)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                trails ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Trails {trails ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={clearCanvas}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
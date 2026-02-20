// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface ComplexNumber {
  real: number;
  imag: number;
}

interface ViewPort {
  centerX: number;
  centerY: number;
  zoom: number;
}

export default function MandelbrotExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState<ViewPort>({ centerX: -0.5, centerY: 0, zoom: 1 });
  const [maxIterations, setMaxIterations] = useState<number>(50);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<number>(0);

  const mandelbrot = useCallback((c: ComplexNumber, maxIter: number): number => {
    let z: ComplexNumber = { real: 0, imag: 0 };
    let iter = 0;
    
    while (iter < maxIter && (z.real * z.real + z.imag * z.imag) < 4) {
      const newReal = z.real * z.real - z.imag * z.imag + c.real;
      const newImag = 2 * z.real * z.imag + c.imag;
      z.real = newReal;
      z.imag = newImag;
      iter++;
    }
    
    return iter;
  }, []);

  const getColor = useCallback((iterations: number, maxIter: number): string => {
    if (iterations === maxIter) return '#000000';
    
    const t = iterations / maxIter;
    let r, g, b;
    
    switch (colorScheme) {
      case 0: // Purple-blue gradient
        r = Math.floor(255 * Math.sin(t * Math.PI) ** 2);
        g = Math.floor(255 * t ** 0.5);
        b = Math.floor(255 * (1 - t ** 2));
        break;
      case 1: // Fire gradient
        r = Math.floor(255 * Math.min(1, t * 3));
        g = Math.floor(255 * Math.max(0, Math.min(1, t * 3 - 1)));
        b = Math.floor(255 * Math.max(0, Math.min(1, t * 3 - 2)));
        break;
      case 2: // Ocean gradient
        r = Math.floor(255 * t ** 3);
        g = Math.floor(255 * Math.sin(t * Math.PI * 2) ** 2);
        b = Math.floor(255 * (1 - t ** 0.5));
        break;
      default:
        r = g = b = Math.floor(255 * t);
    }
    
    return `rgb(${r},${g},${b})`;
  }, [colorScheme]);

  const renderMandelbrot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsRendering(true);
    
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    
    const renderChunk = (startRow: number, endRow: number) => {
      for (let y = startRow; y < endRow; y++) {
        for (let x = 0; x < width; x++) {
          const real = viewport.centerX + (x - width / 2) / (width / 4 * viewport.zoom);
          const imag = viewport.centerY + (y - height / 2) / (height / 4 * viewport.zoom);
          
          const iterations = mandelbrot({ real, imag }, maxIterations);
          const color = getColor(iterations, maxIterations);
          
          const rgb = color.match(/\d+/g);
          if (rgb) {
            const pixelIndex = (y * width + x) * 4;
            imageData.data[pixelIndex] = parseInt(rgb[0]);
            imageData.data[pixelIndex + 1] = parseInt(rgb[1]);
            imageData.data[pixelIndex + 2] = parseInt(rgb[2]);
            imageData.data[pixelIndex + 3] = 255;
          }
        }
      }
    };
    
    // Render in chunks for smoother experience
    const chunkSize = 10;
    let currentRow = 0;
    
    const renderNextChunk = () => {
      const endRow = Math.min(currentRow + chunkSize, height);
      renderChunk(currentRow, endRow);
      
      ctx.putImageData(imageData, 0, 0);
      
      currentRow = endRow;
      if (currentRow < height) {
        animationRef.current = requestAnimationFrame(renderNextChunk);
      } else {
        setIsRendering(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(renderNextChunk);
  }, [viewport, maxIterations, mandelbrot, getColor]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    const newCenterX = viewport.centerX + (canvasX - canvas.width / 2) / (canvas.width / 4 * viewport.zoom);
    const newCenterY = viewport.centerY + (canvasY - canvas.height / 2) / (canvas.height / 4 * viewport.zoom);
    
    setViewport(prev => ({
      centerX: newCenterX,
      centerY: newCenterY,
      zoom: prev.zoom * 2
    }));
  }, [viewport]);

  const resetView = useCallback(() => {
    setViewport({ centerX: -0.5, centerY: 0, zoom: 1 });
  }, []);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: prev.zoom / 2 }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.width; // Square aspect ratio
    };
    
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    
    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    renderMandelbrot();
  }, [renderMandelbrot]);

  return (
    <div className="w-full p-4 bg-gray-900 text-white rounded-lg">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Mandelbrot Explorer</h3>
        <p className="text-sm text-gray-300 mb-4">Click to zoom in • Explore infinite mathematical beauty</p>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">Iterations:</label>
            <input
              type="range"
              min="20"
              max="200"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm w-8">{maxIterations}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Color:</label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(parseInt(e.target.value))}
              className="bg-gray-800 text-white px-2 py-1 rounded text-sm"
            >
              <option value={0}>Cosmic</option>
              <option value={1}>Fire</option>
              <option value={2}>Ocean</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={resetView}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            Reset View
          </button>
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
          >
            Zoom Out
          </button>
        </div>
        
        <div className="text-xs text-gray-400 mb-2">
          Zoom: {viewport.zoom.toFixed(2)}x | Center: ({viewport.centerX.toFixed(4)}, {viewport.centerY.toFixed(4)})
          {isRendering && <span className="ml-2 text-yellow-400">Rendering...</span>}
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full border border-gray-700 cursor-crosshair"
          style={{ aspectRatio: '1' }}
        />
        {isRendering && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-lg">Rendering...</div>
          </div>
        )}
      </div>
    </div>
  );
}
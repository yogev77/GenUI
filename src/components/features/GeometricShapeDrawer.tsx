// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  type: 'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon';
  center: Point;
  size: number;
  color: string;
  rotation: number;
}

interface Connection {
  id: string;
  fromShapeId: string;
  toShapeId: string;
  color: string;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

const SHAPE_TYPES: Array<'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon'> = ['circle', 'square', 'triangle', 'pentagon', 'hexagon'];

export default function GeometricShapeDrawer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTool, setSelectedTool] = useState<'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon' | 'connect'>('circle');
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 2;
    ctx.translate(shape.center.x, shape.center.y);
    ctx.rotate((shape.rotation * Math.PI) / 180);

    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -shape.size / 2);
        ctx.lineTo(-shape.size / 2, shape.size / 2);
        ctx.lineTo(shape.size / 2, shape.size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'pentagon':
      case 'hexagon':
        const sides = shape.type === 'pentagon' ? 5 : 6;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const x = (shape.size / 2) * Math.cos(angle);
          const y = (shape.size / 2) * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
    }
    ctx.restore();
  }, []);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, connection: Connection, shapes: Shape[]) => {
    const fromShape = shapes.find(s => s.id === connection.fromShapeId);
    const toShape = shapes.find(s => s.id === connection.toShapeId);
    
    if (fromShape && toShape) {
      ctx.strokeStyle = connection.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(fromShape.center.x, fromShape.center.y);
      ctx.lineTo(toShape.center.x, toShape.center.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections first (so they appear behind shapes)
    connections.forEach(connection => {
      drawConnection(ctx, connection, shapes);
    });
    
    // Draw shapes
    shapes.forEach(shape => {
      if (shape.id === selectedShapeId) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
      }
      drawShape(ctx, shape);
      ctx.shadowBlur = 0;
    });
  }, [shapes, connections, selectedShapeId, drawShape, drawConnection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (selectedTool === 'connect') {
      // Find clicked shape
      const clickedShape = shapes.find(shape => {
        const dx = x - shape.center.x;
        const dy = y - shape.center.y;
        return Math.sqrt(dx * dx + dy * dy) <= shape.size / 2;
      });
      
      if (clickedShape) {
        if (!isConnecting) {
          setSelectedShapeId(clickedShape.id);
          setIsConnecting(true);
        } else if (selectedShapeId && selectedShapeId !== clickedShape.id) {
          // Create connection
          const newConnection: Connection = {
            id: Date.now().toString(),
            fromShapeId: selectedShapeId,
            toShapeId: clickedShape.id,
            color: selectedColor
          };
          setConnections(prev => [...prev, newConnection]);
          setSelectedShapeId(null);
          setIsConnecting(false);
        }
      } else {
        setSelectedShapeId(null);
        setIsConnecting(false);
      }
    } else {
      // Create new shape
      const newShape: Shape = {
        id: Date.now().toString(),
        type: selectedTool,
        center: { x, y },
        size: 40 + Math.random() * 30,
        color: selectedColor,
        rotation: Math.random() * 360
      };
      setShapes(prev => [...prev, newShape]);
    }
  }, [selectedTool, selectedColor, shapes, selectedShapeId, isConnecting]);

  const clearCanvas = useCallback(() => {
    setShapes([]);
    setConnections([]);
    setSelectedShapeId(null);
    setIsConnecting(false);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="text-sm font-medium mb-2 w-full">Tools:</div>
          {SHAPE_TYPES.map(tool => (
            <button
              key={tool}
              onClick={() => {setSelectedTool(tool); setIsConnecting(false); setSelectedShapeId(null);}}
              className={`px-3 py-1 rounded text-xs capitalize ${
                selectedTool === tool ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {tool}
            </button>
          ))}
          <button
            onClick={() => {setSelectedTool('connect'); setIsConnecting(false); setSelectedShapeId(null);}}
            className={`px-3 py-1 rounded text-xs ${
              selectedTool === 'connect' ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            Connect
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="text-sm font-medium mb-2 w-full">Colors:</div>
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded border-2 ${
                selectedColor === color ? 'border-white' : 'border-gray-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Clear All
          </button>
          <div className="text-sm text-gray-400 flex items-center">
            {isConnecting ? 'Click another shape to connect' : `Click to place ${selectedTool === 'connect' ? 'connections' : selectedTool + 's'}`}
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair bg-gray-800"
        />
      </div>
      
      <div className="p-2 bg-gray-800 text-xs text-gray-400 text-center">
        Shapes: {shapes.length} | Connections: {connections.length}
      </div>
    </div>
  );
}
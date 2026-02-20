// @ts-nocheck
"use client";

import { useState, useRef, useCallback } from 'react';

interface Cell {
  color: string;
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFFFFF', '#808080', '#800000',
  '#008000', '#000080', '#808000', '#800080', '#008080'
];

export default function PixelArt() {
  const [grid, setGrid] = useState<Cell[][]>(() => 
    Array(16).fill(null).map(() => Array(16).fill(null).map(() => ({ color: '#FFFFFF' })))
  );
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const paintCell = useCallback((row: number, col: number) => {
    setGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      newGrid[row][col].color = selectedColor;
      return newGrid;
    });
  }, [selectedColor]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    setIsDrawing(true);
    paintCell(row, col);
  }, [paintCell]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (isDrawing) {
      paintCell(row, col);
    }
  }, [isDrawing, paintCell]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearGrid = useCallback(() => {
    setGrid(Array(16).fill(null).map(() => Array(16).fill(null).map(() => ({ color: '#FFFFFF' }))));
  }, []);

  const randomFill = useCallback(() => {
    setGrid(prev => prev.map(row => 
      row.map(() => ({ 
        color: Math.random() > 0.7 ? COLORS[Math.floor(Math.random() * COLORS.length)] : '#FFFFFF' 
      }))
    ));
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Pixel Art</h3>
        <div className="flex gap-1">
          <button
            onClick={randomFill}
            className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
          >
            Random
          </button>
          <button
            onClick={clearGrid}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div 
        ref={gridRef}
        className="grid grid-cols-16 gap-0 border border-gray-300 mb-3 select-none"
        style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-4 h-4 border border-gray-200 cursor-crosshair hover:opacity-80 transition-opacity"
              style={{ backgroundColor: cell.color }}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
            />
          ))
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Color:</span>
          <div 
            className="w-6 h-6 border-2 border-gray-400 rounded"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
        <div className="grid grid-cols-8 gap-1">
          {COLORS.map(color => (
            <button
              key={color}
              className={`w-6 h-6 border-2 rounded transition-all hover:scale-110 ${
                selectedColor === color ? 'border-gray-800' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
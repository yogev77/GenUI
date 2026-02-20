// @ts-nocheck
"use client";

import { useState } from 'react';

interface TextStyle {
  fontSize: number;
  color: string;
  fontFamily: string;
}

export default function TextStyler() {
  const [text, setText] = useState<string>('Hello World!');
  const [fontSize, setFontSize] = useState<number>(48);
  const [color, setColor] = useState<string>('#000000');
  const [fontFamily, setFontFamily] = useState<string>('serif');
  const [isBold, setIsBold] = useState<boolean>(true);
  const [isItalic, setIsItalic] = useState<boolean>(false);

  const fontFamilies = [
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'cursive', label: 'Cursive' },
    { value: 'fantasy', label: 'Fantasy' }
  ];

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col gap-6">
      <div className="text-2xl font-bold text-gray-800 text-center">
        Text Styler
      </div>
      
      {/* Text Display Area */}
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-lg p-6 min-h-[200px] overflow-hidden">
        <div 
          className={`text-center break-words max-w-full transition-all duration-300 ${
            isBold ? 'font-bold' : 'font-normal'
          } ${
            isItalic ? 'italic' : 'not-italic'
          }`}
          style={{
            fontSize: `${fontSize}px`,
            color: color,
            fontFamily: fontFamily,
            lineHeight: '1.2'
          }}
        >
          {text || 'Type something...'}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your text here..."
          />
        </div>

        {/* Font Size Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size: {fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="120"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {fontFamilies.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Style Toggles */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBold}
              onChange={(e) => setIsBold(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Bold</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isItalic}
              onChange={(e) => setIsItalic(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Italic</span>
          </label>
        </div>
      </div>
    </div>
  );
}
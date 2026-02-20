// @ts-nocheck
"use client";

import { useState, useCallback } from 'react';

interface ColorScheme {
  name: string;
  colors: string[];
}

export default function ColorHarmony() {
  const [baseHue, setBaseHue] = useState<number>(180);
  const [selectedScheme, setSelectedScheme] = useState<string>('complementary');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateColorScheme = useCallback((hue: number, scheme: string): ColorScheme => {
    const hslToHex = (h: number, s: number, l: number): string => {
      const hNorm = ((h % 360) + 360) % 360;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      if (hNorm < 60) { r = c; g = x; b = 0; }
      else if (hNorm < 120) { r = x; g = c; b = 0; }
      else if (hNorm < 180) { r = 0; g = c; b = x; }
      else if (hNorm < 240) { r = 0; g = x; b = c; }
      else if (hNorm < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
      const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
      const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
      
      return `#${rHex}${gHex}${bHex}`;
    };

    switch (scheme) {
      case 'complementary':
        return {
          name: 'Complementary',
          colors: [
            hslToHex(hue, 0.7, 0.5),
            hslToHex(hue + 180, 0.7, 0.5)
          ]
        };
      case 'triadic':
        return {
          name: 'Triadic',
          colors: [
            hslToHex(hue, 0.7, 0.5),
            hslToHex(hue + 120, 0.7, 0.5),
            hslToHex(hue + 240, 0.7, 0.5)
          ]
        };
      case 'analogous':
        return {
          name: 'Analogous',
          colors: [
            hslToHex(hue - 30, 0.7, 0.4),
            hslToHex(hue, 0.7, 0.5),
            hslToHex(hue + 30, 0.7, 0.6)
          ]
        };
      case 'tetradic':
        return {
          name: 'Tetradic',
          colors: [
            hslToHex(hue, 0.7, 0.5),
            hslToHex(hue + 90, 0.7, 0.5),
            hslToHex(hue + 180, 0.7, 0.5),
            hslToHex(hue + 270, 0.7, 0.5)
          ]
        };
      default:
        return { name: 'Complementary', colors: ['#000000', '#ffffff'] };
    }
  }, []);

  const currentScheme = generateColorScheme(baseHue, selectedScheme);

  const copyToClipboard = useCallback(async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  }, []);

  const randomizeColors = useCallback(() => {
    setBaseHue(Math.floor(Math.random() * 360));
  }, []);

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Color Harmony</h3>
        <button
          onClick={randomizeColors}
          className="px-3 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
        >
          🎲 Random
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base Hue: {baseHue}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={baseHue}
          onChange={(e) => setBaseHue(Number(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Harmony Type:
        </label>
        <select
          value={selectedScheme}
          onChange={(e) => setSelectedScheme(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
        >
          <option value="complementary">Complementary</option>
          <option value="triadic">Triadic</option>
          <option value="analogous">Analogous</option>
          <option value="tetradic">Tetradic</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">{currentScheme.name} Palette:</h4>
        <div className="grid grid-cols-2 gap-2">
          {currentScheme.colors.map((color, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onClick={() => copyToClipboard(color, index)}
            >
              <div
                className="w-full h-12 rounded-md border-2 border-gray-200 transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-mono text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {copiedIndex === index ? 'Copied!' : 'Click to copy'}
                  </span>
                </div>
              </div>
              <p className="text-xs font-mono text-center mt-1 text-gray-600">
                {color.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
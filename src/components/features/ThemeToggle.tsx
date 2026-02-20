// @ts-nocheck
"use client";

import { useState } from 'react';

interface ToggleStyle {
  name: string;
  component: (isDark: boolean, onClick: () => void) => JSX.Element;
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [currentStyleIndex, setCurrentStyleIndex] = useState<number>(0);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const nextStyle = () => {
    setCurrentStyleIndex((prev) => (prev + 1) % toggleStyles.length);
  };

  const SliderToggle = (isDark: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out ${
        isDark ? 'bg-slate-800' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ease-in-out transform ${
          isDark ? 'translate-x-8 bg-yellow-400' : 'translate-x-0 bg-white'
        } shadow-md`}
      />
    </button>
  );

  const ButtonToggle = (isDark: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
        isDark
          ? 'bg-slate-800 text-white border-2 border-slate-600'
          : 'bg-white text-gray-800 border-2 border-gray-300'
      }`}
    >
      {isDark ? 'Dark Mode' : 'Light Mode'}
    </button>
  );

  const IconToggle = (isDark: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-12 ${
        isDark ? 'bg-slate-800 text-yellow-400' : 'bg-yellow-100 text-orange-500'
      }`}
    >
      {isDark ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
      )}
    </button>
  );

  const toggleStyles: ToggleStyle[] = [
    { name: 'Slider', component: SliderToggle },
    { name: 'Button', component: ButtonToggle },
    { name: 'Icon', component: IconToggle }
  ];

  const currentStyle = toggleStyles[currentStyleIndex];

  return (
    <div className={`p-6 rounded-xl transition-all duration-500 w-80 ${
      isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-800'
    } shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Theme Toggle</h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Interactive theme switcher with multiple styles
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-3">
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Current Style: {currentStyle.name}
            </span>
          </div>
          <div className="flex justify-center">
            {currentStyle.component(isDark, toggleTheme)}
          </div>
        </div>

        <div className="text-center pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}">
          <button
            onClick={nextStyle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Switch Style
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className={`p-3 rounded-lg text-center ${
            isDark ? 'bg-slate-800' : 'bg-gray-50'
          }`}>
            <div className={`text-xs font-medium mb-1 ${
              isDark ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Current Theme
            </div>
            <div className="font-semibold">
              {isDark ? '🌙 Dark' : '☀️ Light'}
            </div>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            isDark ? 'bg-slate-800' : 'bg-gray-50'
          }`}>
            <div className={`text-xs font-medium mb-1 ${
              isDark ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Toggle Count
            </div>
            <div className="font-semibold">
              Style {currentStyleIndex + 1}/3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
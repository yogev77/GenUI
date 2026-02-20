// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';

interface TimelineItem {
  id: number;
  name: string;
  type: 'widget' | 'utility' | 'meta';
  addedAt: Date;
  description: string;
}

export default function FeatureTimeline() {
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const timelineItems: TimelineItem[] = [
    {
      id: 1,
      name: 'Stopwatch',
      type: 'utility',
      addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      description: 'Time tracking utility'
    },
    {
      id: 2,
      name: 'RandomProgressBar',
      type: 'widget',
      addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: 'Animated progress visualization'
    },
    {
      id: 3,
      name: 'ColorHarmony',
      type: 'widget',
      addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: 'Color palette generator'
    },
    {
      id: 4,
      name: 'FeatureTimeline',
      type: 'meta',
      addedAt: new Date(),
      description: 'Site evolution tracker'
    }
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'widget': return 'bg-purple-500';
      case 'utility': return 'bg-blue-500';
      case 'meta': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'widget': return '🎨';
      case 'utility': return '🔧';
      case 'meta': return '🧠';
      default: return '📦';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="w-80 h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">📈</div>
        <h3 className="text-lg font-bold text-slate-800">Evolution Timeline</h3>
      </div>
      
      <div className="relative h-80 overflow-hidden" ref={timelineRef}>
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300"></div>
        
        <div className="space-y-6">
          {timelineItems.map((item, index) => {
            const isActive = animationPhase === index;
            return (
              <div
                key={item.id}
                className={`relative flex items-start gap-4 cursor-pointer transition-all duration-500 ${
                  selectedItem?.id === item.id ? 'transform scale-105' : ''
                } ${
                  isActive ? 'transform translate-x-1' : ''
                }`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
              >
                <div className={`relative z-10 w-3 h-3 rounded-full border-2 border-white shadow-md transition-all duration-500 ${
                  getTypeColor(item.type)
                } ${
                  isActive ? 'scale-150 shadow-lg' : ''
                }`}>
                  {isActive && (
                    <div className={`absolute inset-0 rounded-full animate-ping ${getTypeColor(item.type)} opacity-75`}></div>
                  )}
                </div>
                
                <div className={`flex-1 min-w-0 transition-all duration-300 ${
                  selectedItem?.id === item.id ? 'bg-white rounded-lg p-3 shadow-md' : 'bg-white/50 rounded p-2'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getTypeIcon(item.type)}</span>
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                  </div>
                  
                  <div className="text-xs text-slate-600 mb-1">
                    {formatDate(item.addedAt)}
                  </div>
                  
                  {selectedItem?.id === item.id && (
                    <div className="text-xs text-slate-700 mt-2 animate-fadeIn">
                      {item.description}
                      <div className={`inline-block px-2 py-1 rounded text-xs text-white mt-1 ${getTypeColor(item.type)}`}>
                        {item.type}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <div className="text-xs text-slate-500 bg-gradient-to-t from-slate-100 to-transparent pt-4">
            GenUI keeps growing... 🌱
          </div>
        </div>
      </div>
    </div>
  );
}
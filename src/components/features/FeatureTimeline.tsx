// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';

interface TimelineItem {
  id: number;
  name: string;
  type: 'widget' | 'utility' | 'meta';
  addedAt: Date;
  description: string;
  impact: number;
  tags: string[];
}

export default function FeatureTimeline() {
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const timelineItems: TimelineItem[] = [
    {
      id: 1,
      name: 'Stopwatch',
      type: 'utility',
      addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: 'Precision time tracking with lap functionality and elegant animations',
      impact: 8,
      tags: ['time', 'productivity']
    },
    {
      id: 2,
      name: 'RandomProgressBar',
      type: 'widget',
      addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      description: 'Dynamic progress visualization with customizable animations and colors',
      impact: 6,
      tags: ['visual', 'animation']
    },
    {
      id: 3,
      name: 'ColorHarmony',
      type: 'widget',
      addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      description: 'Intelligent color palette generator with harmony algorithms',
      impact: 9,
      tags: ['design', 'color']
    },
    {
      id: 4,
      name: 'DataViz',
      type: 'widget',
      addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: 'Interactive data visualization with multiple chart types',
      impact: 7,
      tags: ['data', 'charts']
    },
    {
      id: 5,
      name: 'FeatureTimeline',
      type: 'meta',
      addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: 'Interactive timeline tracking GenUI\'s evolution and growth',
      impact: 10,
      tags: ['meta', 'tracking']
    },
    {
      id: 6,
      name: 'SmartSearch',
      type: 'utility',
      addedAt: new Date(),
      description: 'AI-powered search with fuzzy matching and intelligent suggestions',
      impact: 8,
      tags: ['search', 'ai']
    }
  ];

  const filteredItems = timelineItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % filteredItems.length);
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, filteredItems.length]);

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'widget': return 'from-purple-500 to-pink-500';
      case 'utility': return 'from-blue-500 to-cyan-500';
      case 'meta': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
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

  const getImpactStars = (impact: number): string => {
    return '⭐'.repeat(Math.min(Math.floor(impact / 2), 5));
  };

  const scrollToItem = (index: number): void => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    
    const itemHeight = 120;
    const targetScroll = index * itemHeight;
    timeline.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-pulse">📈</div>
              <h3 className="text-2xl font-bold">Evolution Timeline</h3>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 placeholder-white/70 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="all" className="text-black">All Types</option>
              <option value="widget" className="text-black">🎨 Widgets</option>
              <option value="utility" className="text-black">🔧 Utilities</option>
              <option value="meta" className="text-black">🧠 Meta</option>
            </select>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="bg-white/20 px-3 py-1 rounded-full">
              📊 {timelineItems.length} Features
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              🎯 {filteredItems.length} Showing
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              ⚡ {Math.round(timelineItems.reduce((acc, item) => acc + item.impact, 0) / timelineItems.length)} Avg Impact
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative h-96 overflow-y-auto" ref={timelineRef}>
        <div className="absolute left-8 top-6 bottom-6 w-1 bg-gradient-to-b from-indigo-300 via-purple-400 to-pink-300 rounded-full shadow-lg"></div>
        
        <div className="p-6 space-y-6">
          {filteredItems.map((item, index) => {
            const isActive = isPlaying && animationPhase === index;
            const isHovered = hoveredItem === item.id;
            const isSelected = selectedItem?.id === item.id;
            
            return (
              <div
                key={item.id}
                className={`relative flex items-start gap-6 cursor-pointer transition-all duration-500 group ${
                  isSelected ? 'scale-105' : ''
                } ${
                  isActive ? 'translate-x-2' : ''
                }`}
                onClick={() => {
                  setSelectedItem(isSelected ? null : item);
                  scrollToItem(index);
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Timeline Node */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getTypeColor(item.type)} border-4 border-white shadow-lg transition-all duration-500 ${
                    isActive || isHovered ? 'scale-125 shadow-2xl' : ''
                  }`}>
                    {(isActive || isHovered) && (
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getTypeColor(item.type)} opacity-40 animate-ping`}></div>
                    )}
                  </div>
                  
                  {/* Connecting Line */}
                  {index < filteredItems.length - 1 && (
                    <div className={`absolute top-6 left-3 w-0.5 h-20 bg-gradient-to-b ${getTypeColor(item.type)} opacity-30`}></div>
                  )}
                </div>
                
                {/* Content Card */}
                <div className={`flex-1 min-w-0 transition-all duration-300 ${
                  isSelected || isHovered 
                    ? 'bg-white rounded-xl p-4 shadow-xl border border-slate-200' 
                    : 'bg-slate-50/80 rounded-lg p-3 hover:bg-white hover:shadow-md'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getTypeIcon(item.type)}</span>
                      <span className="font-bold text-slate-800 text-lg">{item.name}</span>
                      <div className="text-sm">{getImpactStars(item.impact)}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs text-white bg-gradient-to-r ${getTypeColor(item.type)}`}>
                      {item.type}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-2">
                    {formatDate(item.addedAt)}
                  </div>
                  
                  <div className="text-sm text-slate-700 mb-3">
                    {item.description}
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {(isSelected || isHovered) && (
                    <div className="border-t border-slate-200 pt-3 mt-3 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Impact Score: {item.impact}/10</span>
                        <span>Feature #{item.id}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getTypeColor(item.type)} transition-all duration-700`}
                          style={{ width: `${item.impact * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer Message */}
        <div className="sticky bottom-0 left-0 right-0 text-center bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
          <div className="text-sm text-slate-600 font-medium">
            🌱 GenUI keeps evolving... {timelineItems.length} features and counting!
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Click items to explore • {filteredItems.length} items visible
          </div>
        </div>
      </div>
    </div>
  );
}
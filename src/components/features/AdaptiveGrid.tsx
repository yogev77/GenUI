// @ts-nocheck
"use client";

import { useState, useCallback } from 'react';

interface GridItem {
  id: number;
  title: string;
  content: string;
  color: string;
  isExpanded: boolean;
}

export default function AdaptiveGrid() {
  const [items, setItems] = useState<GridItem[]>([
    { id: 1, title: "Feature A", content: "Interactive widget with animations", color: "bg-blue-500", isExpanded: false },
    { id: 2, title: "Tool B", content: "Utility for calculations", color: "bg-green-500", isExpanded: false },
    { id: 3, title: "Widget C", content: "Creative design generator", color: "bg-purple-500", isExpanded: false },
    { id: 4, title: "App D", content: "Visual effects playground", color: "bg-orange-500", isExpanded: false },
    { id: 5, title: "System E", content: "Data visualization tool", color: "bg-red-500", isExpanded: false },
    { id: 6, title: "Module F", content: "Sound synthesis engine", color: "bg-teal-500", isExpanded: false }
  ]);

  const [layoutMode, setLayoutMode] = useState<'auto' | 'vertical' | 'horizontal'>('auto');

  const toggleExpand = useCallback((id: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  }, []);

  const addItem = useCallback(() => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500'];
    const newItem: GridItem = {
      id: Date.now(),
      title: `Item ${items.length + 1}`,
      content: `Dynamic content for item ${items.length + 1}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      isExpanded: false
    };
    setItems(prev => [...prev, newItem]);
  }, [items.length]);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const hasExpandedItems = items.some(item => item.isExpanded);
  const shouldUseHorizontal = layoutMode === 'horizontal' || (layoutMode === 'auto' && hasExpandedItems);

  return (
    <div className="p-4 bg-gray-50 rounded-lg w-full max-w-md mx-auto">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Adaptive Grid System</h3>
        
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setLayoutMode('auto')}
            className={`px-3 py-1 text-xs rounded ${layoutMode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Auto
          </button>
          <button
            onClick={() => setLayoutMode('vertical')}
            className={`px-3 py-1 text-xs rounded ${layoutMode === 'vertical' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Vertical
          </button>
          <button
            onClick={() => setLayoutMode('horizontal')}
            className={`px-3 py-1 text-xs rounded ${layoutMode === 'horizontal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Horizontal
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={addItem}
            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
          >
            Add Item
          </button>
          <span className="text-xs text-gray-500 py-1">Click tiles to expand</span>
        </div>
      </div>

      <div className={`transition-all duration-300 ${
        shouldUseHorizontal 
          ? 'flex flex-col gap-2 max-h-48 overflow-y-auto' 
          : 'grid grid-cols-2 gap-2'
      }`}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`${item.color} text-white p-3 rounded cursor-pointer transition-all duration-300 hover:opacity-80 relative group ${
              item.isExpanded 
                ? 'min-h-16' 
                : 'min-h-12'
            }`}
            onClick={() => toggleExpand(item.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
              className="absolute top-1 right-1 w-4 h-4 bg-black bg-opacity-20 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ×
            </button>
            
            <div className="text-sm font-medium">{item.title}</div>
            
            {item.isExpanded && (
              <div className="text-xs mt-1 opacity-90">
                {item.content}
                <div className="mt-2 text-xs opacity-75">
                  Layout: {shouldUseHorizontal ? 'Horizontal Stack' : 'Grid Mode'}
                </div>
              </div>
            )}
            
            <div className="absolute bottom-1 right-1 text-xs opacity-60">
              {item.isExpanded ? '−' : '+'}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-8 text-sm">
          No items yet. Click "Add Item" to start!
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        {shouldUseHorizontal ? '📋 Stack Layout' : '⊞ Grid Layout'} • {items.length} items
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lapTimes, setLapTimes] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);

  const formatTime = useCallback((milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  const updateTime = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current + accumulatedTimeRef.current;
    setTime(elapsed);
  }, []);

  const startStop = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      accumulatedTimeRef.current = time;
    } else {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(updateTime, 10);
    }
    setIsRunning(!isRunning);
  }, [isRunning, time, updateTime]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setTime(0);
    setIsRunning(false);
    setLapTimes([]);
    accumulatedTimeRef.current = 0;
  }, []);

  const addLap = useCallback(() => {
    if (isRunning && time > 0) {
      const lapTime = time - (lapTimes.reduce((sum, lap) => sum + lap.time, 0));
      setLapTimes(prev => [...prev, { id: prev.length + 1, time: lapTime, total: time }]);
    }
  }, [isRunning, time, lapTimes]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-lg text-white w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold mb-2 text-blue-300">
          {formatTime(time)}
        </div>
        <div className={`w-full h-1 bg-slate-700 rounded-full overflow-hidden ${
          isRunning ? 'animate-pulse' : ''
        }`}>
          <div className={`h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ${
            isRunning ? 'animate-pulse' : ''
          }`} style={{ width: time > 0 ? '100%' : '0%' }}></div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={startStop}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isRunning 
              ? 'bg-red-600 hover:bg-red-700 active:scale-95' 
              : 'bg-green-600 hover:bg-green-700 active:scale-95'
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="6" y="4" width="2" height="12"></rect>
                <rect x="12" y="4" width="2" height="12"></rect>
              </svg>
              Stop
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <polygon points="5,4 15,10 5,16"></polygon>
              </svg>
              Start
            </span>
          )}
        </button>
        
        <button
          onClick={addLap}
          disabled={!isRunning || time === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 rounded-lg font-semibold transition-all duration-200 active:scale-95"
        >
          Lap
        </button>
        
        <button
          onClick={reset}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg font-semibold transition-all duration-200 active:scale-95"
        >
          Reset
        </button>
      </div>

      {lapTimes.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Lap Times</h3>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {lapTimes.slice(-3).reverse().map((lap, index) => (
              <div key={lap.id} className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Lap {lap.id}</span>
                <div className="text-right">
                  <div className="font-mono text-blue-300">{formatTime(lap.time)}</div>
                  <div className="font-mono text-slate-500 text-xs">{formatTime(lap.total)}</div>
                </div>
              </div>
            ))}
          </div>
          {lapTimes.length > 3 && (
            <div className="text-xs text-slate-500 mt-1">+{lapTimes.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
}
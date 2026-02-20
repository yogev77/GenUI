// @ts-nocheck
"use client";

import { useState, useRef, useCallback } from 'react';

interface OscillatorData {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface Note {
  frequency: number;
  name: string;
}

export default function WaveformSynth() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [waveType, setWaveType] = useState<WaveType>('sine');
  const [volume, setVolume] = useState<number>(0.3);
  const [frequency, setFrequency] = useState<number>(440);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorDataRef = useRef<OscillatorData | null>(null);

  const notes: Note[] = [
    { frequency: 261.63, name: 'C4' },
    { frequency: 293.66, name: 'D4' },
    { frequency: 329.63, name: 'E4' },
    { frequency: 349.23, name: 'F4' },
    { frequency: 392.00, name: 'G4' },
    { frequency: 440.00, name: 'A4' },
    { frequency: 493.88, name: 'B4' },
    { frequency: 523.25, name: 'C5' }
  ];

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const startTone = useCallback((freq: number) => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    if (oscillatorDataRef.current) {
      oscillatorDataRef.current.oscillator.stop();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillatorDataRef.current = { oscillator, gainNode };
    setIsPlaying(true);
    setFrequency(freq);
  }, [waveType, volume, initAudioContext]);

  const stopTone = useCallback(() => {
    if (oscillatorDataRef.current) {
      oscillatorDataRef.current.oscillator.stop();
      oscillatorDataRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (oscillatorDataRef.current) {
      const audioContext = audioContextRef.current;
      if (audioContext) {
        oscillatorDataRef.current.gainNode.gain.setValueAtTime(newVolume, audioContext.currentTime);
      }
    }
  }, []);

  const waveforms: { type: WaveType; icon: string; color: string }[] = [
    { type: 'sine', icon: '∿', color: 'bg-blue-500' },
    { type: 'square', icon: '⊏', color: 'bg-green-500' },
    { type: 'sawtooth', icon: '⟋', color: 'bg-orange-500' },
    { type: 'triangle', icon: '△', color: 'bg-purple-500' }
  ];

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg w-80 font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Waveform Synth</h3>
        <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
      </div>

      {/* Waveform selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Waveform</label>
        <div className="grid grid-cols-4 gap-2">
          {waveforms.map(({ type, icon, color }) => (
            <button
              key={type}
              onClick={() => setWaveType(type)}
              className={`p-2 rounded text-center font-bold transition-all ${
                waveType === type ? color : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-lg">{icon}</div>
              <div className="text-xs capitalize">{type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Volume control */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Volume: {Math.round(volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => updateVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Frequency display */}
      <div className="mb-4 text-center">
        <div className="text-2xl font-bold text-cyan-400">{frequency.toFixed(2)} Hz</div>
      </div>

      {/* Piano keys */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Notes</label>
        <div className="grid grid-cols-4 gap-1">
          {notes.map((note) => (
            <button
              key={note.name}
              onMouseDown={() => startTone(note.frequency)}
              onMouseUp={stopTone}
              onMouseLeave={stopTone}
              className={`p-3 rounded text-sm font-bold transition-all ${
                isPlaying && frequency === note.frequency
                  ? 'bg-cyan-500 scale-95'
                  : 'bg-gray-700 hover:bg-gray-600 active:bg-cyan-500 active:scale-95'
              }`}
            >
              {note.name}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 text-center">
        Press and hold notes to play • Change waveform for different tones
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
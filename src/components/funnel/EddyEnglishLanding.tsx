// @ts-nocheck
'use client';

import { useState } from 'react';

interface Props {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyEnglishLanding({ onEvent }: Props) {
  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Learn English with
            <span className="text-leaf-100 block">Eddy</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Skip the expensive tutors! Get personalized 1-on-1 English lessons for just $1 per lesson. 
            Interactive, fun, and designed especially for young learners.
          </p>
          <button 
            onClick={() => onEvent('cta_click')}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold text-xl px-12 py-4 rounded-lg transition-colors duration-300"
          >
            Start Learning Today
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-leaf-900 p-8 rounded-lg text-center">
            <div className="text-leaf-100 text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold mb-4 text-leaf-200">Personal Instructor</h3>
            <p className="text-gray-300">Meet Eddy - your dedicated multilingual English teacher who adapts to your learning style</p>
          </div>
          <div className="bg-leaf-900 p-8 rounded-lg text-center">
            <div className="text-leaf-100 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-4 text-leaf-200">Interactive Tools</h3>
            <p className="text-gray-300">Engaging activities and games that make learning English fun and effective</p>
          </div>
          <div className="bg-leaf-900 p-8 rounded-lg text-center">
            <div className="text-leaf-100 text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-4 text-leaf-200">Unbeatable Price</h3>
            <p className="text-gray-300">$1 per lesson vs $30+ for traditional tutors. Quality education shouldn't break the bank!</p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-leaf-700 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-leaf-100">What Students Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-leaf-900 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-leaf-100 text-2xl mr-3">⭐⭐⭐⭐⭐</div>
                <span className="text-leaf-200 font-semibold">Maria, 14</span>
              </div>
              <p className="text-gray-300">"Eddy makes English so easy! I went from struggling with basic words to having full conversations in just 2 months!"</p>
            </div>
            <div className="bg-leaf-900 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-leaf-100 text-2xl mr-3">⭐⭐⭐⭐⭐</div>
                <span className="text-leaf-200 font-semibold">Carlos, 12</span>
              </div>
              <p className="text-gray-300">"The games and activities are awesome! I actually look forward to English lessons now. Thanks Eddy!"</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-leaf-100">Ready to Start Your English Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">Join hundreds of students already learning with Eddy</p>
          <button 
            onClick={() => onEvent('cta_click')}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold text-xl px-12 py-4 rounded-lg transition-colors duration-300"
          >
            Get Started - Just $1 Per Lesson
          </button>
        </div>
      </div>
    </div>
  );
}
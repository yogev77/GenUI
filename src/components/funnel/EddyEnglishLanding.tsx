// @ts-nocheck
"use client";

import { useState } from 'react';

interface Props {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyEnglishLanding({ onEvent }: Props) {
  const handleCTAClick = () => {
    onEvent("cta_click");
  };

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-leaf-100">
            Master English with
            <span className="block text-leaf-400">Personalized Lessons</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your English skills with one-on-one instruction from Eddy. Get the individual attention you need to achieve fluency faster.
          </p>
          <button 
            onClick={handleCTAClick}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold text-xl px-8 py-4 rounded-lg transition-colors duration-300"
          >
            Start Learning Today - $25/Lesson
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-leaf-900 p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-leaf-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-leaf-950">1:1</span>
            </div>
            <h3 className="text-xl font-bold mb-4 text-leaf-200">Personalized Lessons</h3>
            <p className="text-gray-300">Every lesson is tailored specifically to your learning style, goals, and current skill level.</p>
          </div>
          
          <div className="bg-leaf-900 p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-leaf-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-leaf-950">👨‍🏫</span>
            </div>
            <h3 className="text-xl font-bold mb-4 text-leaf-200">Dedicated Instructor</h3>
            <p className="text-gray-300">Learn from Eddy, an experienced English teacher committed to your success.</p>
          </div>
          
          <div className="bg-leaf-900 p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-leaf-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-leaf-950">💻</span>
            </div>
            <h3 className="text-xl font-bold mb-4 text-leaf-200">Flexible Online Format</h3>
            <p className="text-gray-300">Learn from anywhere, anytime. Schedule lessons that fit your busy lifestyle.</p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-leaf-900 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-leaf-200">What Students Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-l-4 border-leaf-400 pl-6">
              <p className="text-lg mb-4 text-gray-300">"Eddy's personalized approach helped me improve my business English skills dramatically. I finally feel confident in meetings!"</p>
              <p className="font-semibold text-leaf-200">- Maria S., Marketing Manager</p>
            </div>
            <div className="border-l-4 border-leaf-400 pl-6">
              <p className="text-lg mb-4 text-gray-300">"The flexible scheduling and one-on-one attention made all the difference. I passed my English proficiency exam!"</p>
              <p className="font-semibold text-leaf-200">- Ahmed K., Graduate Student</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-leaf-700 rounded-lg p-12">
          <h2 className="text-4xl font-bold mb-4 text-leaf-100">Ready to Transform Your English?</h2>
          <p className="text-xl text-gray-300 mb-8">Join hundreds of successful students who've improved their English with personalized instruction.</p>
          <button 
            onClick={handleCTAClick}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold text-xl px-12 py-6 rounded-lg transition-colors duration-300"
          >
            Get Started Now - Only $25
          </button>
          <p className="text-sm text-gray-400 mt-4">No long-term commitments • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
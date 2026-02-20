// @ts-nocheck
'use client';

import { useState } from 'react';

interface EddyLandingProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyLanding({ onEvent }: EddyLandingProps) {
  const handleCTAClick = () => {
    onEvent('cta_click');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-leaf-100 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-leaf-200 text-gray-900 px-4 py-2 rounded-full text-sm font-medium mb-8">
              ⭐ Personalized Learning Experience
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Master English with
              <span className="text-leaf-700 block">One-on-One Lessons</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get personalized English instruction from Eddy, your dedicated tutor. Experience accelerated learning with customized lessons designed just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={handleCTAClick}
                className="bg-leaf-400 hover:bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto"
              >
                Start Learning Today - $25/lesson
              </button>
              <div className="text-gray-600 text-sm">
                ✓ No subscription required ✓ Book as needed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why Choose 1:1 English Lessons with Eddy?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="bg-leaf-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">👤</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">100% Personalized</h3>
            <p className="text-gray-600">
              Every lesson is tailored to your specific needs, goals, and learning style. No generic curriculum.
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="bg-leaf-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Individual Attention</h3>
            <p className="text-gray-600">
              Get Eddy's complete focus for the entire session. Ask questions, practice speaking, get instant feedback.
            </p>
          </div>
          <div className="bg-leaf-700 text-white text-center p-6 rounded-xl">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-leaf-700 text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Faster Results</h3>
            <p>
              Progress 3x faster with customized lessons that adapt to your pace and focus on your weak points.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Join 200+ Students Who've Improved Their English
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-leaf-400 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  M
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria Rodriguez</div>
                  <div className="text-yellow-500">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600">
                "Eddy's personalized approach helped me pass my IELTS exam with a 7.5 score! The one-on-one attention made all the difference."
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-leaf-400 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  K
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Kenji Tanaka</div>
                  <div className="text-yellow-500">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600">
                "I improved my business English significantly in just 2 months. Eddy customized every lesson for my work needs."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-leaf-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your English Skills?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Book your first personalized lesson with Eddy today
          </p>
          <button 
            onClick={handleCTAClick}
            className="bg-leaf-400 hover:bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Get Started - Only $25 per Lesson
          </button>
          <div className="text-white text-sm mt-4 opacity-75">
            💡 Satisfaction guaranteed or your money back
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck
'use client';

import { useState } from 'react';

interface GoeddyLandingProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function GoeddyLanding({ onEvent }: GoeddyLandingProps) {
  const handleCTAClick = () => {
    onEvent('cta_click');
  };

  const characters = [
    { name: 'Luna', emoji: '🌙', specialty: 'Spanish & French' },
    { name: 'Max', emoji: '🚀', specialty: 'German & Italian' },
    { name: 'Zara', emoji: '⭐', specialty: 'Mandarin & Japanese' },
    { name: 'Rio', emoji: '🎯', specialty: 'Portuguese & Korean' },
    { name: 'Sage', emoji: '🌿', specialty: 'Arabic & Hindi' }
  ];

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Your Kid's New <span className="text-leaf-100">AI Speaking Tutor</span> is Here!
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              goeddy.com makes learning languages fun with 5 amazing AI teachers who speak your child's native language and create interactive activities in real-time
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={handleCTAClick}
                className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold py-4 px-8 rounded-full text-lg transition-colors transform hover:scale-105"
              >
                Start Speaking Today - $30/month
              </button>
              <div className="text-leaf-200 font-medium">
                ✨ 7 quick daily lessons • Ages 6-18 • All skill levels
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Showcase */}
      <div className="bg-leaf-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Meet Your AI Teachers</h2>
          <p className="text-center text-gray-300 mb-12 text-lg">Choose your favorite character - they all speak your native language!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {characters.map((char, index) => (
              <div key={index} className="bg-leaf-700 rounded-xl p-6 text-center hover:bg-leaf-600 transition-colors">
                <div className="text-4xl mb-3">{char.emoji}</div>
                <h3 className="font-bold text-leaf-100 mb-2">{char.name}</h3>
                <p className="text-sm text-gray-300">{char.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Families Love goeddy.com</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-leaf-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🗣️
              </div>
              <h3 className="font-bold text-leaf-100 mb-2">Speaking Focus</h3>
              <p className="text-gray-300">Practice actual conversation, not just grammar rules</p>
            </div>
            <div className="text-center">
              <div className="bg-leaf-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🌍
              </div>
              <h3 className="font-bold text-leaf-100 mb-2">Multilingual Support</h3>
              <p className="text-gray-300">AI teachers speak your child's native language for better understanding</p>
            </div>
            <div className="text-center">
              <div className="bg-leaf-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ⚡
              </div>
              <h3 className="font-bold text-leaf-100 mb-2">Quick Daily Lessons</h3>
              <p className="text-gray-300">Just 7 minutes a day keeps kids engaged without overwhelming</p>
            </div>
            <div className="text-center">
              <div className="bg-leaf-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🎮
              </div>
              <h3 className="font-bold text-leaf-100 mb-2">Interactive Activities</h3>
              <p className="text-gray-300">Real-time games and exercises created just for your child</p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-leaf-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What Parents Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-leaf-700 p-6 rounded-xl">
              <div className="flex mb-4">
                <span className="text-leaf-100">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-gray-300 mb-4">"My 8-year-old actually asks to do her Spanish lessons! Luna makes it so fun and speaks to her in English when she gets confused."</p>
              <p className="font-bold text-leaf-200">- Sarah M., Mom of 2</p>
            </div>
            <div className="bg-leaf-700 p-6 rounded-xl">
              <div className="flex mb-4">
                <span className="text-leaf-100">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-gray-300 mb-4">"The interactive activities are amazing. My teenager went from hating language class to having conversations in French!"</p>
              <p className="font-bold text-leaf-200">- Mike T., Father</p>
            </div>
            <div className="bg-leaf-700 p-6 rounded-xl">
              <div className="flex mb-4">
                <span className="text-leaf-100">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-gray-300 mb-4">"Finally, a language app that focuses on speaking! The AI teachers are patient and adapt to each of my kids' levels."</p>
              <p className="font-bold text-leaf-200">- Jessica R., Homeschool Mom</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Child's Language Learning?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of families already speaking new languages with goeddy.com</p>
          <button 
            onClick={handleCTAClick}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold py-4 px-8 rounded-full text-xl transition-colors transform hover:scale-105"
          >
            Get Started - Only $30/Month
          </button>
          <div className="mt-6 text-leaf-200">
            <p>✅ 7 daily lessons • ✅ 5 AI teachers • ✅ Multilingual support • ✅ Ages 6-18</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck
"use client";

import { useState } from 'react';

interface TinyTapLandingProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function TinyTapLanding({ onEvent }: TinyTapLandingProps) {
  const [email, setEmail] = useState<string>('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onEvent('email_capture', email);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-leaf-100 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block bg-leaf-200 text-gray-900 px-4 py-2 rounded-full text-sm font-medium mb-6">
              🎮 Create Educational Games in Minutes
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn Learning Into <span className="text-leaf-700">Play</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              TinyTap empowers educators and parents to create interactive educational games that make learning fun. Access thousands of games or build your own in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={() => onEvent('cta_click')}
                className="bg-leaf-400 hover:bg-orange-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Start Creating Games - $9.99/mo
              </button>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-700"
                />
                <button 
                  type="submit"
                  className="bg-leaf-700 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-medium transition-colors"
                >
                  Get Free Demo
                </button>
              </form>
            </div>
            <div className="text-gray-400 text-sm">
              ✓ No credit card required ✓ 7-day free trial ✓ Cancel anytime
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Overview */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need to Create Amazing Educational Content
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🎨
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Custom Games</h3>
              <p className="text-gray-600">
                Build interactive educational games tailored to your students' needs with our intuitive drag-and-drop editor.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📚
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Access Game Library</h3>
              <p className="text-gray-600">
                Explore thousands of educational games created by teachers worldwide covering math, science, language, and more.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-leaf-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📊
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Track Progress</h3>
              <p className="text-gray-600">
                Monitor student engagement and learning progress with detailed analytics and performance insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by 100,000+ Educators Worldwide
            </h2>
            <div className="flex justify-center items-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-leaf-700">100K+</div>
                <div className="text-gray-600">Active Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-leaf-700">2M+</div>
                <div className="text-gray-600">Games Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-leaf-700">50M+</div>
                <div className="text-gray-600">Students Engaged</div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-leaf-400 text-lg">★★★★★</div>
                <div className="ml-2 text-gray-600">5.0/5</div>
              </div>
              <p className="text-gray-600 mb-4">
                "TinyTap has revolutionized how I teach math. My students are more engaged than ever, and I can create custom games in minutes!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-leaf-200 rounded-full flex items-center justify-center text-sm">SM</div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Sarah Martinez</div>
                  <div className="text-gray-400 text-sm">3rd Grade Teacher</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-leaf-400 text-lg">★★★★★</div>
                <div className="ml-2 text-gray-600">5.0/5</div>
              </div>
              <p className="text-gray-600 mb-4">
                "As a homeschool parent, TinyTap gives me access to professional-quality educational content. My kids love the interactive games!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-leaf-200 rounded-full flex items-center justify-center text-sm">MJ</div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Mike Johnson</div>
                  <div className="text-gray-400 text-sm">Homeschool Parent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 bg-leaf-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-leaf-100 text-lg mb-8">
            Join thousands of educators who are making learning more engaging with TinyTap.
          </p>
          <button 
            onClick={() => onEvent('cta_click')}
            className="bg-leaf-400 hover:bg-orange-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started Today - $9.99/month
          </button>
          <div className="text-leaf-200 text-sm mt-4">
            Start your free 7-day trial now
          </div>
        </div>
      </div>
    </div>
  );
}
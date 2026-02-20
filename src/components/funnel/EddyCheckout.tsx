// @ts-nocheck
'use client';

import { useState } from 'react';
import FakeCheckout from "@/components/funnel/FakeCheckout";

interface EddyCheckoutProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyCheckout({ onEvent }: EddyCheckoutProps) {
  const [selectedBonus, setSelectedBonus] = useState<string | null>(null);

  const handleCTAClick = () => {
    onEvent('cta_click');
  };

  const handlePurchase = () => {
    onEvent('purchase');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You're One Step Away from Mastering English!
          </h1>
          <p className="text-lg text-gray-600">
            Complete your booking for a personalized 1:1 lesson with Eddy
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary & Benefits */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">1:1 English Lesson with Eddy</h3>
                    <p className="text-sm text-gray-600">60-minute personalized session</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">$25.00</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-leaf-400">$25.00</span>
              </div>
            </div>

            {/* What You Get */}
            <div className="bg-leaf-100 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What You Get:</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">60 minutes of personalized instruction</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Customized learning plan based on your goals</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Interactive speaking practice and pronunciation help</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Detailed feedback and progress assessment</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Learning materials and resources included</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Flexible scheduling to fit your availability</span>
                </div>
              </div>
            </div>

            {/* Urgency Element */}
            <div className="bg-leaf-900 text-white p-4 rounded-xl text-center">
              <div className="font-semibold mb-1">⚡ Limited Availability</div>
              <div className="text-sm opacity-90">Only 3 spots left this week. Secure your lesson now!</div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Why Students Choose Eddy:</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-leaf-400">200+</div>
                  <div className="text-sm text-gray-600">Happy Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-leaf-400">4.9/5</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-leaf-400">95%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-leaf-400">3 Years</div>
                  <div className="text-sm text-gray-600">Experience</div>
                </div>
              </div>
            </div>

            {/* Money Back Guarantee */}
            <div className="bg-leaf-700 text-white p-6 rounded-xl text-center">
              <div className="text-2xl mb-2">💯</div>
              <h3 className="font-bold text-lg mb-2">100% Satisfaction Guarantee</h3>
              <p className="text-sm opacity-90">
                Not satisfied with your lesson? Get a full refund, no questions asked.
              </p>
            </div>
          </div>

          {/* Right Column - Checkout Form */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Complete Your Booking
              </h2>
              
              <FakeCheckout 
                price="25.00" 
                productName="Eddy - 1:1 English Lessons" 
                onPurchase={handlePurchase} 
              />
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                  <span className="mr-2">🔒</span>
                  Secure checkout powered by industry-leading encryption
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-2">
                    By completing your purchase, you agree to our terms of service.
                  </p>
                  <p className="text-xs text-gray-400">
                    Questions? Contact support for immediate assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Final Persuasion */}
            <div className="bg-leaf-200 p-6 rounded-xl mt-6">
              <h3 className="font-bold text-gray-900 mb-2 text-center">
                🎯 Your English Breakthrough Starts Here
              </h3>
              <p className="text-sm text-gray-700 text-center">
                Join hundreds of students who've transformed their English skills with Eddy's proven 1:1 method. 
                Book now and start speaking with confidence!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
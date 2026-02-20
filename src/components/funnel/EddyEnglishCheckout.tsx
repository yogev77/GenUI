// @ts-nocheck
"use client";

import FakeCheckout from "@/components/funnel/FakeCheckout";

interface Props {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyEnglishCheckout({ onEvent }: Props) {
  const handlePurchase = () => {
    onEvent("purchase");
  };

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-leaf-100">
            Complete Your English Learning Journey
          </h1>
          <p className="text-xl text-gray-300">
            You're one step away from personalized English instruction with Eddy
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Order Summary & Benefits */}
          <div>
            {/* Order Summary */}
            <div className="bg-leaf-900 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-leaf-200">Order Summary</h2>
              <div className="border-b border-leaf-700 pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg text-gray-300">Eddy English Lessons</span>
                  <span className="text-lg font-semibold text-leaf-100">$25.00</span>
                </div>
                <p className="text-sm text-gray-400">One-on-one personalized English lesson (60 minutes)</p>
              </div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-leaf-200">Total</span>
                <span className="text-leaf-400">$25.00</span>
              </div>
            </div>

            {/* What You Get */}
            <div className="bg-leaf-900 rounded-lg p-8 mb-8">
              <h3 className="text-xl font-bold mb-4 text-leaf-200">What You'll Receive</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300">60-minute personalized English lesson</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300">Customized lesson plan based on your goals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300">Real-time feedback and corrections</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300">Progress notes and improvement recommendations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-leaf-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300">Flexible online format - learn from anywhere</span>
                </div>
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-leaf-700 rounded-lg p-6 border-2 border-leaf-400">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-leaf-400 rounded-full flex items-center justify-center">
                  <span className="text-leaf-950 font-bold">✓</span>
                </div>
                <h3 className="text-lg font-bold text-leaf-100">30-Day Money-Back Guarantee</h3>
              </div>
              <p className="text-gray-300">If you're not completely satisfied with your lesson, we'll refund your money. No questions asked.</p>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <div className="bg-leaf-900 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-leaf-200">Secure Checkout</h2>
              
              <FakeCheckout 
                price="25.00" 
                productName="Eddy English Lessons" 
                onPurchase={handlePurchase} 
              />
            </div>

            {/* Trust Signals */}
            <div className="mt-8 text-center">
              <div className="flex justify-center space-x-6 mb-4">
                <div className="flex items-center space-x-2 text-gray-400">
                  <span className="text-leaf-400">🔒</span>
                  <span className="text-sm">SSL Encrypted</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <span className="text-leaf-400">✓</span>
                  <span className="text-sm">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <span className="text-leaf-400">💳</span>
                  <span className="text-sm">All Cards Accepted</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">Your payment information is processed securely. We do not store credit card details.</p>
            </div>
          </div>
        </div>

        {/* Final Reassurance */}
        <div className="mt-16 text-center bg-leaf-700 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4 text-leaf-100">Join 500+ Successful Students</h3>
          <p className="text-gray-300 mb-6">Students who book their first lesson see an average 40% improvement in confidence within just one month.</p>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
            <span>⭐⭐⭐⭐⭐</span>
            <span>4.9/5 average rating</span>
            <span>•</span>
            <span>500+ lessons completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
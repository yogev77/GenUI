// @ts-nocheck
"use client";

import FakeCheckout from "@/components/funnel/FakeCheckout";

interface TinyTapCheckoutProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function TinyTapCheckout({ onEvent }: TinyTapCheckoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your TinyTap Setup
          </h1>
          <p className="text-lg text-gray-600">
            Join 100,000+ educators transforming learning through interactive games
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Value Reinforcement */}
          <div className="space-y-6">
            {/* Limited Time Offer */}
            <div className="bg-leaf-900 text-white p-6 rounded-xl">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">⚡</span>
                <h3 className="text-lg font-bold">Limited Time: 50% Off First Month!</h3>
              </div>
              <p className="text-red-100 mb-3">
                This special offer expires in 24 hours. Save $5 on your first month!
              </p>
              <div className="flex items-center text-sm">
                <span className="line-through text-red-200 mr-2">$9.99</span>
                <span className="text-2xl font-bold">$4.99</span>
                <span className="text-red-100 ml-2">first month</span>
              </div>
            </div>

            {/* What You Get */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                What You Get With TinyTap Pro
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-leaf-700 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-medium text-gray-900">Unlimited Game Creation</div>
                    <div className="text-gray-600 text-sm">Build as many custom games as you need</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-leaf-700 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-medium text-gray-900">Premium Game Library</div>
                    <div className="text-gray-600 text-sm">Access 50,000+ professionally designed games</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-leaf-700 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-medium text-gray-900">Student Analytics Dashboard</div>
                    <div className="text-gray-600 text-sm">Track progress and identify learning gaps</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-leaf-700 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-medium text-gray-900">Priority Support</div>
                    <div className="text-gray-600 text-sm">24/7 email support + live chat</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-leaf-700 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-medium text-gray-900">Offline Play</div>
                    <div className="text-gray-600 text-sm">Download games for offline use</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-leaf-100 rounded-lg">
                <div className="text-sm text-gray-600">Total Value: <span className="font-bold text-gray-900">$297/month</span></div>
                <div className="text-lg font-bold text-leaf-700">Your Price: Just $9.99/month</div>
              </div>
            </div>

            {/* Risk-Free Guarantee */}
            <div className="bg-leaf-100 p-6 rounded-xl">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🛡️</span>
                <h3 className="text-lg font-bold text-gray-900">100% Risk-Free Guarantee</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>✓ 7-day free trial - no credit card required</p>
                <p>✓ 30-day money-back guarantee</p>
                <p>✓ Cancel anytime with one click</p>
                <p>✓ Keep all games you create, even if you cancel</p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Success Stories</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-leaf-200 rounded-full flex items-center justify-center text-sm mr-3">JM</div>
                  <div>
                    <div className="text-sm text-gray-600">
                      "My students' test scores improved 23% after using TinyTap games for just one month!"
                    </div>
                    <div className="text-xs text-gray-400 mt-1">- Jennifer M., 3rd Grade Teacher</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-leaf-200 rounded-full flex items-center justify-center text-sm mr-3">TR</div>
                  <div>
                    <div className="text-sm text-gray-600">
                      "Finally, a platform that makes creating educational content actually enjoyable!"
                    </div>
                    <div className="text-xs text-gray-400 mt-1">- Tom R., High School Science Teacher</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Checkout */}
          <div>
            <div className="sticky top-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Secure Checkout
                </h3>
                
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">TinyTap Pro (Monthly)</span>
                    <span className="line-through text-gray-400">$9.99</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">First Month Discount</span>
                    <span className="text-green-600">-$5.00</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-900">Total Today</span>
                      <span className="text-leaf-700 text-xl">$4.99</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Then $9.99/month. Cancel anytime.
                    </div>
                  </div>
                </div>

                <FakeCheckout 
                  price="9.99" 
                  productName="TinyTap" 
                  onPurchase={() => onEvent('purchase')} 
                />
                
                <div className="mt-4 text-center">
                  <div className="flex justify-center items-center gap-2 text-gray-500 text-sm mb-2">
                    <span>🔒</span>
                    <span>Secured by 256-bit SSL encryption</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </div>
                </div>
              </div>

              {/* Additional Trust Elements */}
              <div className="mt-6 text-center">
                <div className="flex justify-center items-center gap-4 text-gray-400 text-sm">
                  <span>💳 All major cards accepted</span>
                  <span>📱 Mobile optimized</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Questions? Contact our support team 24/7
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Alternative */}
        <div className="mt-12 text-center bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Not ready to start your trial yet?
          </h3>
          <p className="text-gray-600 mb-4">
            No problem! Get our free "Quick Start Guide for Educational Games" instead.
          </p>
          <button 
            onClick={() => onEvent('cta_click')}
            className="bg-leaf-700 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Download Free Guide
          </button>
        </div>
      </div>
    </div>
  );
}
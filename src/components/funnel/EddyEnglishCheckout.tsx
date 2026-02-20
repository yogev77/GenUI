// @ts-nocheck
'use client';

import FakeCheckout from '@/components/funnel/FakeCheckout';

interface Props {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyEnglishCheckout({ onEvent }: Props) {
  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            You're Almost <span className="text-leaf-100">There!</span>
          </h1>
          <p className="text-xl text-gray-300">
            Just one step away from revolutionizing your English learning journey
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Final Persuasion */}
          <div>
            <div className="bg-leaf-900 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-bold mb-6 text-leaf-200">🎉 What You're Getting Today</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-leaf-700">
                  <span className="text-gray-300">Personalized 1-on-1 English Lesson</span>
                  <span className="text-leaf-100 font-bold">$1.00</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-leaf-700">
                  <span className="text-gray-300">Custom Learning Plan</span>
                  <span className="text-leaf-100 font-bold">FREE</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-leaf-700">
                  <span className="text-gray-300">Interactive Learning Materials</span>
                  <span className="text-leaf-100 font-bold">FREE</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-leaf-700">
                  <span className="text-gray-300">Progress Assessment</span>
                  <span className="text-leaf-100 font-bold">FREE</span>
                </div>
                <div className="flex justify-between items-center py-3 text-xl font-bold">
                  <span className="text-leaf-200">Total Value: $50+</span>
                  <span className="text-leaf-100">Your Price: $1</span>
                </div>
              </div>
            </div>

            {/* Urgency & Guarantee */}
            <div className="bg-leaf-700 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold mb-4 text-leaf-100">🔒 Your Investment is Protected</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-leaf-400 mr-3">✓</span>
                  <span><strong>100% Satisfaction Guarantee</strong> - Love it or get your money back</span>
                </li>
                <li className="flex items-start">
                  <span className="text-leaf-400 mr-3">✓</span>
                  <span><strong>No Subscription Tricks</strong> - Pay per lesson, cancel anytime</span>
                </li>
                <li className="flex items-start">
                  <span className="text-leaf-400 mr-3">✓</span>
                  <span><strong>Instant Access</strong> - Schedule your first lesson immediately</span>
                </li>
              </ul>
            </div>

            {/* Social Proof */}
            <div className="bg-leaf-900 p-6 rounded-lg">
              <div className="text-center mb-4">
                <div className="text-3xl text-leaf-100 mb-2">🌟 4.9/5 Rating</div>
                <p className="text-gray-300">From over 500+ happy students</p>
              </div>
              <div className="border-t border-leaf-700 pt-4">
                <p className="text-gray-300 italic text-center">
                  "I can't believe how much my confidence improved after just one lesson with Eddy. 
                  Best $1 I've ever spent!"
                </p>
                <p className="text-leaf-200 text-center mt-2 font-semibold">- Isabella, Age 15</p>
              </div>
            </div>
          </div>

          {/* Right Side - Checkout */}
          <div>
            <div className="bg-leaf-900 p-8 rounded-lg sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-leaf-200">
                Complete Your Purchase
              </h2>
              
              <FakeCheckout 
                price="25-50 per lesson" 
                productName="Eddy English Learning" 
                onPurchase={() => onEvent('purchase')} 
              />
              
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-400 mb-4">
                  🔐 Secure checkout powered by industry-leading encryption
                </div>
                
                {/* Last Chance Offer */}
                <div className="bg-leaf-700 p-4 rounded-lg mt-6">
                  <h4 className="font-bold text-leaf-100 mb-2">⚡ Limited Time Bonus!</h4>
                  <p className="text-sm text-gray-300">
                    Book today and get a FREE pronunciation guide + 
                    access to Eddy's exclusive student community!
                  </p>
                </div>
                
                <button 
                  onClick={() => onEvent('cta_click')}
                  className="w-full mt-6 bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold py-4 px-6 rounded-lg transition-colors duration-300 text-lg"
                >
                  Secure My Spot - $1 Only
                </button>
                
                <p className="text-xs text-gray-400 mt-4">
                  By clicking above, you agree to start your English learning journey. 
                  No hidden fees, no surprises - just amazing results!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-leaf-700 to-leaf-900 p-8 rounded-lg">
            <p className="text-xl text-gray-300 mb-4">
              "My parents were skeptical about online English lessons, but after seeing my progress with Eddy, 
              they're now recommending it to all their friends. The price is just incredible for what you get!"
            </p>
            <p className="text-leaf-200 font-semibold">- Marco, 14 (Improved from beginner to conversational in 2 months)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
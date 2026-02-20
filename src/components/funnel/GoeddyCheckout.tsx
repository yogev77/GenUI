// @ts-nocheck
'use client';

import FakeCheckout from '@/components/funnel/FakeCheckout';

interface GoeddyCheckoutProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function GoeddyCheckout({ onEvent }: GoeddyCheckoutProps) {
  const handlePurchase = () => {
    onEvent('purchase');
  };

  const benefits = [
    '7 quick daily speaking lessons',
    '5 AI teachers with unique personalities', 
    'Multilingual support in 30+ languages',
    'Real-time interactive activities',
    'Progress tracking for parents',
    'Safe, ad-free environment for kids',
    'Works on all devices',
    'Cancel anytime'
  ];

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      {/* Header */}
      <div className="bg-leaf-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            You're Almost There! 🎉
          </h1>
          <p className="text-lg text-gray-300">
            Complete your order and your child can start speaking a new language today
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Order Summary & Benefits */}
          <div>
            <div className="bg-leaf-900 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-leaf-100 mb-6">Your goeddy.com Subscription</h2>
              
              <div className="border-b border-leaf-700 pb-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">Monthly Subscription</span>
                  <span className="text-lg font-bold">$30.00</span>
                </div>
                <p className="text-sm text-gray-400">Billed monthly • Cancel anytime</p>
              </div>
              
              <h3 className="font-bold text-leaf-200 mb-4">What's Included:</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="text-leaf-400 mr-3">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Guarantee */}
            <div className="bg-leaf-400 text-leaf-950 rounded-xl p-6 mb-8">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🛡️</span>
                <h3 className="font-bold text-lg">14-Day Money-Back Guarantee</h3>
              </div>
              <p>
                If your child doesn't love learning with our AI teachers, 
                we'll refund every penny. No questions asked!
              </p>
            </div>

            {/* Quick Testimonial */}
            <div className="bg-leaf-700 rounded-xl p-6">
              <div className="flex mb-3">
                <span className="text-leaf-100">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-gray-300 mb-4 italic">
                "Best investment we've made in our kids' education. They're 
                actually excited about language learning now!"
              </p>
              <p className="font-bold text-leaf-200">- Jennifer K., Mom of twins</p>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <div className="bg-leaf-900 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-leaf-100 mb-6">Complete Your Order</h2>
              
              <FakeCheckout 
                price="$30 for a monthly subscribtion for daily lessons, 7 quick daily lessons"
                productName="goeddy.com"
                onPurchase={handlePurchase}
              />
            </div>

            {/* Security & Trust */}
            <div className="mt-8 text-center">
              <div className="flex justify-center items-center space-x-6 mb-4">
                <div className="flex items-center text-leaf-200">
                  <span className="mr-2">🔒</span>
                  <span className="text-sm">Secure Checkout</span>
                </div>
                <div className="flex items-center text-leaf-200">
                  <span className="mr-2">💳</span>
                  <span className="text-sm">All Cards Accepted</span>
                </div>
                <div className="flex items-center text-leaf-200">
                  <span className="mr-2">🌟</span>
                  <span className="text-sm">Trusted by 10K+ Families</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Your payment information is encrypted and secure. 
                We never store your credit card details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final Motivational Section */}
      <div className="bg-leaf-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Your Child's Language Adventure Starts Today!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold text-leaf-100">Day 1</h3>
              <p className="text-sm text-gray-300">Meet your AI teacher & start first conversation</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-bold text-leaf-100">Week 1</h3>
              <p className="text-sm text-gray-300">Speaking basic phrases with confidence</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-bold text-leaf-100">Month 1</h3>
              <p className="text-sm text-gray-300">Having real conversations in new language</p>
            </div>
          </div>
          <p className="text-leaf-200 mt-8 font-medium">
            Join the thousands of families already seeing amazing results! 🌟
          </p>
        </div>
      </div>
    </div>
  );
}
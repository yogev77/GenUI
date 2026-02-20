// @ts-nocheck
'use client';

import FakeCheckout from "@/components/funnel/FakeCheckout";

interface PackingServicesCheckoutProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function PackingServicesCheckout({ onEvent }: PackingServicesCheckoutProps) {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="bg-leaf-100">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="bg-leaf-900 text-white px-4 py-2 rounded-xl inline-block mb-4 font-semibold">
            Limited Time: Free Photo Perfect Consultation
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Packing Service Booking
          </h1>
          <p className="text-xl text-gray-600">
            Join 2,500+ satisfied customers who chose professional packing services
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div>
            <div className="bg-gray-50 p-8 rounded-xl mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Service Package</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-900">Professional Packing & Unpacking Service</span>
                  <span className="font-bold text-gray-900">$300</span>
                </div>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-leaf-400 rounded-full"></div>
                    <span>Photo Perfect Packing service included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-leaf-400 rounded-full"></div>
                    <span>100% recycled eco-friendly moving boxes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-leaf-400 rounded-full"></div>
                    <span>Specialized handling for fragile items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-leaf-400 rounded-full"></div>
                    <span>Custom crating available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-leaf-400 rounded-full"></div>
                    <span>Flexible service levels</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-leaf-200 p-4 rounded-xl mb-6">
                <div className="font-semibold text-leaf-700 mb-2">🎁 Today's Bonus Inclusions:</div>
                <ul className="text-leaf-700 text-sm space-y-1">
                  <li>• Free consultation and planning session ($75 value)</li>
                  <li>• 50% discount on eco-friendly boxes</li>
                  <li>• Priority booking for your preferred dates</li>
                </ul>
              </div>
              
              <div className="bg-white border-2 border-leaf-400 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Investment:</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 line-through">$375</div>
                    <div className="text-2xl font-bold text-leaf-400">$300</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">One-time payment • No hidden fees</div>
              </div>
            </div>
            
            {/* Trust Signals */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="font-bold text-gray-900 mb-4">Why Choose Our Services?</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-leaf-700 rounded"></div>
                  <span className="text-gray-600">2,500+ Happy Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-leaf-700 rounded"></div>
                  <span className="text-gray-600">4.9/5 Star Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-leaf-700 rounded"></div>
                  <span className="text-gray-600">Fully Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-leaf-700 rounded"></div>
                  <span className="text-gray-600">100% Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <div className="bg-white border border-gray-200 p-8 rounded-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Secure Checkout</h2>
              
              <FakeCheckout 
                price="300" 
                productName="Packing & Unpacking Services" 
                onPurchase={() => onEvent('purchase')} 
              />
              
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-2">
                  <div className="w-4 h-4 bg-leaf-700 rounded"></div>
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span>VISA</span>
                  <span>•</span>
                  <span>MASTERCARD</span>
                  <span>•</span>
                  <span>AMEX</span>
                  <span>•</span>
                  <span>PAYPAL</span>
                </div>
              </div>
            </div>
            
            {/* Urgency */}
            <div className="bg-leaf-900 text-white p-6 rounded-xl mt-6 text-center">
              <div className="font-bold mb-2">⏰ Limited Time Offer</div>
              <div className="text-sm">Free consultation bonus expires in 24 hours</div>
            </div>
            
            {/* Guarantee */}
            <div className="bg-leaf-100 p-6 rounded-xl mt-6 text-center">
              <div className="font-bold text-leaf-700 mb-2">💯 100% Satisfaction Guarantee</div>
              <div className="text-leaf-700 text-sm">Not satisfied with our service? We'll make it right or provide a full refund within 30 days.</div>
            </div>
          </div>
        </div>
        
        {/* Final Testimonial */}
        <div className="mt-16 bg-gray-50 p-8 rounded-xl text-center max-w-4xl mx-auto">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-leaf-400 rounded"></div>
            ))}
          </div>
          <p className="text-lg text-gray-600 mb-4 italic">
            "Best money we've ever spent on a move. The Photo Perfect service meant our new house felt like home immediately. The team was professional, careful, and the eco-friendly boxes actually saved us money. Couldn't recommend them more highly."
          </p>
          <div className="font-semibold text-gray-900">Jennifer K., Business Owner</div>
          <div className="text-gray-400 text-sm">Relocated 4-bedroom home + home office</div>
        </div>
      </div>
    </div>
  );
}
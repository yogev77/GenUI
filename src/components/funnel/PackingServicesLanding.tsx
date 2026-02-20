// @ts-nocheck
'use client';

import { useState } from 'react';

interface PackingServicesLandingProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function PackingServicesLanding({ onEvent }: PackingServicesLandingProps) {
  const [email, setEmail] = useState<string>('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onEvent('email_capture', email);
      setEmail('');
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <div className="bg-leaf-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="bg-leaf-200 text-leaf-700 px-4 py-2 rounded-xl inline-block mb-6 font-medium">
              Professional Moving Services
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Stress-Free Packing &<br />Unpacking Services
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Let our professionals handle your precious belongings with our Photo Perfect Packing service and eco-friendly materials. From fragile art to electronics, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => onEvent('cta_click')}
                className="bg-leaf-400 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Get Your Quote Today
              </button>
              <div className="text-gray-600">
                Starting at <span className="font-bold text-gray-900">$300</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-8 rounded-xl">
            <div className="w-12 h-12 bg-leaf-400 rounded-xl mb-6 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Photo Perfect Packing</h3>
            <p className="text-gray-600">We photograph and recreate your exact home setup, so unpacking feels like magic. Every item finds its perfect place.</p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl">
            <div className="w-12 h-12 bg-leaf-700 rounded-xl mb-6 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Eco-Friendly Materials</h3>
            <p className="text-gray-600">100% recycled moving boxes with 50% cost savings and buyback program. Professional care meets environmental responsibility.</p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl">
            <div className="w-12 h-12 bg-leaf-400 rounded-xl mb-6 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Specialized Handling</h3>
            <p className="text-gray-600">Custom crating for fragile items, art, and electronics. From full-service to partial assistance - you choose your level of support.</p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by 2,500+ Families</h2>
            <div className="flex justify-center items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-leaf-400 rounded"></div>
              ))}
            </div>
            <p className="text-gray-600">4.9/5 average rating from verified customers</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-4">"The Photo Perfect service was incredible! They recreated our living room exactly as it was. Our kids didn't even notice we moved."</p>
              <div className="font-semibold text-gray-900">- Sarah M., Seattle</div>
            </div>
            
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-4">"Professional, careful, and the eco-friendly boxes saved us money. They handled our art collection like museum curators."</p>
              <div className="font-semibold text-gray-900">- James R., Portland</div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Capture CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Make Your Move Effortless?</h2>
        <p className="text-xl text-gray-600 mb-8">Get a personalized quote and learn how we can make your packing experience stress-free.</p>
        
        <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-leaf-400"
            required
          />
          <button 
            type="submit"
            className="bg-leaf-400 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Get Free Quote
          </button>
        </form>
        
        <button 
          onClick={() => onEvent('cta_click')}
          className="bg-leaf-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          Book Service Now - $300
        </button>
      </div>
    </div>
  );
}
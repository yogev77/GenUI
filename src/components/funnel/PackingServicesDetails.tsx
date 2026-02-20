// @ts-nocheck
'use client';

import { useState } from 'react';

interface PackingServicesDetailsProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function PackingServicesDetails({ onEvent }: PackingServicesDetailsProps) {
  const [email, setEmail] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onEvent('email_capture', email);
      setEmail('');
    }
  };

  const faqs = [
    {
      question: "What's included in the Photo Perfect Packing service?",
      answer: "We photograph your rooms and belongings before packing, then recreate the exact setup in your new home. This includes furniture placement, decorative items, and personal belongings arranged exactly as they were."
    },
    {
      question: "How do the eco-friendly boxes work?",
      answer: "Our boxes are made from 100% recycled materials and cost 50% less than traditional boxes. We also offer a buyback program where we'll purchase back boxes in good condition."
    },
    {
      question: "Do you handle fragile and valuable items?",
      answer: "Yes, we specialize in custom crating and handling of fragile items including artwork, electronics, antiques, and collectibles. Our team is trained in museum-quality packing techniques."
    },
    {
      question: "Can I choose partial packing services?",
      answer: "Absolutely! We offer flexible service levels from full-service packing to partial assistance. You can choose specific rooms, item types, or ask us to focus only on fragile items."
    },
    {
      question: "How far in advance should I book?",
      answer: "We recommend booking 2-3 weeks in advance, especially during peak moving seasons (summer months). However, we can often accommodate last-minute requests based on availability."
    }
  ];

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="bg-leaf-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Professional Packing & Unpacking Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive moving solutions with our signature Photo Perfect service, eco-friendly materials, and expert handling of your most precious belongings.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Features */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Complete Service Features</h2>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="bg-leaf-200 text-leaf-700 px-4 py-2 rounded-xl inline-block mb-6 font-semibold">
              Signature Service
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Photo Perfect Packing</h3>
            <p className="text-gray-600 mb-6">
              Our most popular service that takes the stress out of recreating your home setup. We document everything before packing and ensure your new space feels familiar from day one.
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-leaf-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Professional photography of all rooms and arrangements</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-leaf-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Detailed labeling system for precise placement</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-leaf-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Complete unpacking and arrangement service</span>
              </li>
            </ul>
          </div>
          
          <div>
            <div className="bg-leaf-700 text-white px-4 py-2 rounded-xl inline-block mb-6 font-semibold">
              Eco-Friendly
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustainable Moving Materials</h3>
            <p className="text-gray-600 mb-6">
              Professional-grade materials that are better for the environment and your budget. Our recycled boxes are just as strong as traditional options.
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-leaf-700 rounded-full mt-2 flex-shrink-0"></div>
                <span>100% recycled cardboard boxes and materials</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-leaf-700 rounded-full mt-2 flex-shrink-0"></div>
                <span>50% cost savings compared to traditional boxes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-leaf-700 rounded-full mt-2 flex-shrink-0"></div>
                <span>Buyback program for boxes in good condition</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Specialized Handling Services</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-leaf-400 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded"></div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Artwork & Antiques</h4>
              <p className="text-gray-600 text-sm">Museum-quality packing with custom crating for valuable pieces</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-leaf-400 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-sm"></div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Electronics</h4>
              <p className="text-gray-600 text-sm">Anti-static materials and original packaging recreation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-leaf-400 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Fragile Items</h4>
              <p className="text-gray-600 text-sm">Extra cushioning and protection for delicate belongings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-leaf-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-leaf-400 rounded"></div>
                ))}
              </div>
              <p className="text-gray-600 mb-4">"The Photo Perfect service was worth every penny. Walking into our new home felt like we never left the old one. Everything was exactly where it should be."</p>
              <div className="font-semibold text-gray-900">Sarah M.</div>
              <div className="text-gray-400 text-sm">Family of 4, Seattle</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-leaf-400 rounded"></div>
                ))}
              </div>
              <p className="text-gray-600 mb-4">"They handled our art collection with incredible care. The custom crating gave us complete peace of mind. Plus, the eco-friendly boxes saved us $200!"</p>
              <div className="font-semibold text-gray-900">James R.</div>
              <div className="text-gray-400 text-sm">Art Collector, Portland</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-leaf-400 rounded"></div>
                ))}
              </div>
              <p className="text-gray-600 mb-4">"We only needed help with fragile items, and they were so flexible. Professional service without paying for what we didn't need."</p>
              <div className="font-semibold text-gray-900">Maria L.</div>
              <div className="text-gray-400 text-sm">Office Manager, Denver</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-xl">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                  <div className={`w-6 h-6 bg-leaf-400 rounded transition-transform ${openFaq === index ? 'rotate-45' : ''}`}></div>
                </div>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Email Capture */}
      <div className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Experience Stress-Free Moving?</h2>
          <p className="text-xl text-gray-600 mb-8">Get a detailed quote tailored to your specific needs and timeline.</p>
          
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto mb-8">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for personalized quote"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-leaf-400"
              required
            />
            <button 
              type="submit"
              className="bg-leaf-400 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Get Custom Quote
            </button>
          </form>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onEvent('cta_click')}
              className="bg-leaf-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Book Now - Starting at $300
            </button>
            <div className="flex items-center justify-center text-gray-600">
              <span className="bg-leaf-200 text-leaf-700 px-3 py-2 rounded-xl text-sm font-medium">
                Free consultation included
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
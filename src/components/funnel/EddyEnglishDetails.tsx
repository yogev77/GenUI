// @ts-nocheck
'use client';

import { useState } from 'react';

interface Props {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyEnglishDetails({ onEvent }: Props) {
  const [email, setEmail] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onEvent('email_capture', email);
      setEmail('');
    }
  };

  const faqs = [
    {
      q: "How does the $1 per lesson work?",
      a: "Each lesson is individually priced at just $1, making it 30x cheaper than traditional tutors. Pay as you go with no long-term commitments."
    },
    {
      q: "Is Eddy really multilingual?",
      a: "Yes! Eddy speaks multiple languages which helps bridge communication gaps and explain concepts in your native language when needed."
    },
    {
      q: "What age groups do you teach?",
      a: "We specialize in younger learners (ages 8-18), but welcome anyone eager to learn English in a fun, interactive way."
    },
    {
      q: "How long are the lessons?",
      a: "Each session is 30-45 minutes of focused, personalized instruction tailored to your learning pace and goals."
    },
    {
      q: "What if I'm a complete beginner?",
      a: "Perfect! Eddy loves working with beginners and has special techniques to make your first steps in English comfortable and encouraging."
    }
  ];

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Why Choose <span className="text-leaf-100">Eddy English?</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the revolutionary approach to English learning that's helping students worldwide achieve fluency faster and cheaper than ever before.
          </p>
        </div>

        {/* Detailed Features */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-leaf-900 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-6 text-leaf-200">🎯 Personalized Learning Path</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Custom curriculum based on your current level and goals</span>
              </li>
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Progress tracking with regular assessments</span>
              </li>
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Flexible scheduling that fits your busy life</span>
              </li>
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>One-on-one attention you can't get in group classes</span>
              </li>
            </ul>
          </div>

          <div className="bg-leaf-900 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-6 text-leaf-200">🚀 Interactive Learning Tools</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Gamified lessons that make learning addictive</span>
              </li>
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Real-world conversation practice scenarios</span>
              </li>
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Multimedia resources: videos, audio, and visual aids</span>
              </li>
              <li className="flex items-start">
                <span className="text-leaf-400 mr-3">✓</span>
                <span>Homework and practice materials included</span>
              </li>
            </ul>
          </div>
        </div>

        {/* More Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-leaf-100">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-leaf-700 p-6 rounded-lg">
              <div className="text-leaf-100 text-xl mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 mb-4">"My daughter Sofia improved her English grades from C to A+ in just 3 months with Eddy!"</p>
              <p className="text-leaf-200 font-semibold">- Parent of Sofia, 13</p>
            </div>
            <div className="bg-leaf-700 p-6 rounded-lg">
              <div className="text-leaf-100 text-xl mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 mb-4">"I was scared to speak English before. Now I chat with my American friends online every day!"</p>
              <p className="text-leaf-200 font-semibold">- Ahmed, 16</p>
            </div>
            <div className="bg-leaf-700 p-6 rounded-lg">
              <div className="text-leaf-100 text-xl mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 mb-4">"The price is unbelievable! We tried expensive tutors before but Eddy is way better and costs almost nothing."</p>
              <p className="text-leaf-200 font-semibold">- Parent of twins Luis & Ana</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-leaf-100">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-leaf-900 rounded-lg">
                <button
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-leaf-700 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-leaf-200">{faq.q}</span>
                  <span className="text-leaf-400 text-xl">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Email Capture */}
        <div className="bg-gradient-to-r from-leaf-700 to-leaf-900 p-8 rounded-lg text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-leaf-100">Ready to Transform Your English?</h2>
          <p className="text-xl text-gray-300 mb-8">Get a free lesson plan and see how Eddy can help you reach fluency faster</p>
          
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-leaf-400"
              required
            />
            <button
              type="submit"
              className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold px-8 py-3 rounded-lg transition-colors duration-300"
            >
              Get Free Plan
            </button>
          </form>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <button 
            onClick={() => onEvent('cta_click')}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold text-xl px-12 py-4 rounded-lg transition-colors duration-300"
          >
            Start Your First Lesson - Only $1
          </button>
          <p className="text-gray-400 mt-4">No subscription required • Cancel anytime • 100% satisfaction guaranteed</p>
        </div>
      </div>
    </div>
  );
}
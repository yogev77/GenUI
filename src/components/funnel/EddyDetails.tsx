// @ts-nocheck
'use client';

import { useState } from 'react';

interface EddyDetailsProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyDetails({ onEvent }: EddyDetailsProps) {
  const [email, setEmail] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleCTAClick = () => {
    onEvent('cta_click');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onEvent('email_capture', email);
      setEmail('');
    }
  };

  const faqs = [
    {
      question: "How long is each lesson?",
      answer: "Each one-on-one lesson is 60 minutes, giving you plenty of time for meaningful practice and learning."
    },
    {
      question: "Can I schedule lessons at my convenience?",
      answer: "Yes! Eddy offers flexible scheduling including evenings and weekends to accommodate your busy lifestyle."
    },
    {
      question: "What if I'm a complete beginner?",
      answer: "No problem! Eddy specializes in working with all levels, from complete beginners to advanced learners preparing for exams."
    },
    {
      question: "Are lessons conducted online or in-person?",
      answer: "Lessons are conducted online via video call, making it convenient to learn from anywhere with an internet connection."
    },
    {
      question: "What materials do I need?",
      answer: "Just a computer or tablet with internet access. Eddy provides all learning materials and resources digitally."
    },
    {
      question: "Can I cancel or reschedule a lesson?",
      answer: "Yes, you can reschedule or cancel lessons with 24-hour notice. Eddy understands that life happens!"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-leaf-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
            Everything You Need to Know About Eddy's English Lessons
          </h1>
          <p className="text-xl text-gray-600 text-center">
            Discover how personalized 1:1 instruction can accelerate your English learning journey
          </p>
        </div>
      </div>

      {/* Detailed Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          What Makes Eddy's Lessons Different?
        </h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="bg-leaf-400 w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Customized Learning Plan</h3>
                  <p className="text-gray-600">
                    Every lesson begins with understanding your goals. Whether you need business English, exam prep, or conversational skills, Eddy creates a personalized curriculum just for you.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-leaf-400 w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl">🗣️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Speaking Practice Focus</h3>
                  <p className="text-gray-600">
                    50% of each lesson is dedicated to speaking practice. Build confidence through real conversations, pronunciation drills, and practical scenarios.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-leaf-400 w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                  <p className="text-gray-600">
                    Receive detailed feedback after each lesson and track your improvement over time with personalized progress reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-leaf-700 p-8 rounded-xl text-white">
            <h3 className="text-2xl font-bold mb-6">Lesson Structure</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Warm-up & Review</span>
                <span className="bg-white text-leaf-700 px-3 py-1 rounded-full text-sm font-medium">10 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span>New Content Learning</span>
                <span className="bg-white text-leaf-700 px-3 py-1 rounded-full text-sm font-medium">20 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Speaking Practice</span>
                <span className="bg-white text-leaf-700 px-3 py-1 rounded-full text-sm font-medium">25 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Feedback & Next Steps</span>
                <span className="bg-white text-leaf-700 px-3 py-1 rounded-full text-sm font-medium">5 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extended Testimonials */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Success Stories from Real Students
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-leaf-400 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  S
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Chen</div>
                  <div className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                "I went from being afraid to speak English at work to confidently presenting to international clients. Eddy's patient teaching style made all the difference."
              </p>
              <div className="text-sm text-gray-400">Business Professional</div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-leaf-400 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  A
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Ahmed Hassan</div>
                  <div className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                "Eddy helped me prepare for my university interviews. His personalized approach and mock interview sessions were invaluable. I got accepted!"
              </p>
              <div className="text-sm text-gray-400">University Student</div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-leaf-400 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  L
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa Andersson</div>
                  <div className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                "After 3 months of lessons with Eddy, I finally feel comfortable having conversations with native speakers. His encouragement boosted my confidence tremendously."
              </p>
              <div className="text-sm text-gray-400">Working Professional</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-xl">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 rounded-xl transition-colors flex justify-between items-center"
              >
                {faq.question}
                <span className={`transform transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Email Capture */}
      <div className="bg-leaf-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get Your Free English Learning Guide
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Download Eddy's "10 Daily Habits for English Fluency" plus receive exclusive learning tips
          </p>
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
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
                className="bg-leaf-400 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Get Free Guide
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              No spam. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your English Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Book your first personalized lesson with Eddy today and experience the difference 1:1 instruction makes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleCTAClick}
              className="bg-leaf-400 hover:bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Book Your First Lesson - $25
            </button>
            <div className="text-gray-300 text-sm">
              ✓ 60-minute session ✓ Personalized curriculum ✓ Instant feedback
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
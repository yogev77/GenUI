// @ts-nocheck
"use client";

import { useState } from 'react';

interface Props {
  onEvent: (type: string, value?: string | number) => void;
}

export default function EddyEnglishDetails({ onEvent }: Props) {
  const [email, setEmail] = useState<string>('');
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const handleCTAClick = () => {
    onEvent("cta_click");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onEvent("email_capture", email);
      setEmail('');
    }
  };

  const toggleFAQ = (index: number) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "How long are the lessons?",
      answer: "Each lesson is 60 minutes, giving you plenty of time for meaningful conversation practice and skill development."
    },
    {
      question: "What technology do I need?",
      answer: "Just a computer or tablet with internet connection and a camera. We use easy-to-access video calling platforms."
    },
    {
      question: "Can I reschedule lessons?",
      answer: "Yes! We offer flexible scheduling with 24-hour advance notice for rescheduling at no extra cost."
    },
    {
      question: "What if I'm a complete beginner?",
      answer: "Perfect! Eddy specializes in working with learners at all levels, from complete beginners to advanced speakers."
    },
    {
      question: "Do you offer lesson packages?",
      answer: "Currently we offer individual lessons for maximum flexibility. You can book as many or as few as you need."
    }
  ];

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-leaf-100">
            Everything You Need to Know
            <span className="block text-leaf-400">About Eddy English Lessons</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover why thousands of students choose personalized English instruction with Eddy.
          </p>
        </div>

        {/* Detailed Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-leaf-200">Comprehensive Learning Experience</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-leaf-400">What Makes Our Lessons Different</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-leaf-400 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h4 className="font-semibold text-leaf-200 mb-2">Customized Curriculum</h4>
                    <p className="text-gray-300">Every lesson plan is created based on your specific goals, whether it's business English, conversation skills, or exam preparation.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-leaf-400 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h4 className="font-semibold text-leaf-200 mb-2">Real-Time Feedback</h4>
                    <p className="text-gray-300">Get immediate corrections and suggestions to accelerate your learning and avoid developing bad habits.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-leaf-400 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h4 className="font-semibold text-leaf-200 mb-2">Progress Tracking</h4>
                    <p className="text-gray-300">Eddy keeps detailed notes on your progress and adjusts lessons to ensure continuous improvement.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-leaf-900 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-leaf-400">Meet Your Instructor</h3>
              <div className="mb-6">
                <div className="w-24 h-24 bg-leaf-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-leaf-200">E</span>
                </div>
                <h4 className="text-xl font-semibold text-leaf-200 mb-2">Eddy Thompson</h4>
                <p className="text-gray-300 mb-4">Certified English instructor with 8+ years of experience teaching students from over 30 countries.</p>
              </div>
              <div className="border-t border-leaf-700 pt-4">
                <p className="text-sm text-gray-400">"I believe every student has unique potential. My job is to unlock it through personalized, engaging lessons that make learning English both effective and enjoyable."</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-leaf-200">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-leaf-900 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-leaf-400">★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">"After 3 months of lessons with Eddy, I got promoted at work. My presentation skills improved dramatically, and I can now confidently lead international meetings."</p>
              <p className="font-semibold text-leaf-200">- Lisa Chen, Project Manager</p>
            </div>
            <div className="bg-leaf-900 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-leaf-400">★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">"Eddy helped me prepare for my IELTS exam. I scored 8.5 overall! His personalized approach made all the difference in my writing and speaking scores."</p>
              <p className="font-semibold text-leaf-200">- Carlos Rodriguez, University Student</p>
            </div>
            <div className="bg-leaf-900 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-leaf-400">★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">"I was so nervous about speaking English. Eddy's patient approach and encouraging feedback helped me gain confidence. Now I actually enjoy conversations!"</p>
              <p className="font-semibold text-leaf-200">- Yuki Tanaka, Marketing Specialist</p>
            </div>
          </div>
        </div>

        {/* Email Capture */}
        <div className="bg-leaf-700 rounded-lg p-12 mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4 text-leaf-100">Get Your Free English Learning Guide</h2>
          <p className="text-xl text-gray-300 mb-8">Download Eddy's proven strategies for faster English improvement, plus get lesson updates and learning tips.</p>
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-leaf-950 text-lg"
              required
            />
            <button 
              type="submit"
              className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold px-8 py-3 rounded-lg transition-colors duration-300"
            >
              Get Free Guide
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-leaf-200">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-leaf-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-6 hover:bg-leaf-700 transition-colors duration-300 flex justify-between items-center"
                >
                  <span className="font-semibold text-leaf-200 text-lg">{faq.question}</span>
                  <span className={`text-leaf-400 text-2xl transform transition-transform duration-300 ${activeFAQ === index ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {activeFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-leaf-900 rounded-lg p-12">
          <h2 className="text-4xl font-bold mb-4 text-leaf-100">Ready to Start Your English Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">Join the growing community of successful English learners. Book your first personalized lesson today.</p>
          <button 
            onClick={handleCTAClick}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold text-xl px-12 py-6 rounded-lg transition-colors duration-300 mb-4"
          >
            Book Your First Lesson - $25
          </button>
          <p className="text-sm text-gray-400">30-day satisfaction guarantee • Flexible scheduling</p>
        </div>
      </div>
    </div>
  );
}
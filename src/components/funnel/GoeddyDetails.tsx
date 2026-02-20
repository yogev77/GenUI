// @ts-nocheck
'use client';

import { useState } from 'react';

interface GoeddyDetailsProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function GoeddyDetails({ onEvent }: GoeddyDetailsProps) {
  const [email, setEmail] = useState<string>('');
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

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

  const features = [
    {
      title: 'AI-Powered Conversation Practice',
      description: 'Our advanced AI creates realistic conversations tailored to your child\'s level and interests',
      icon: '🤖'
    },
    {
      title: 'Native Language Support', 
      description: 'Teachers can switch to your child\'s native language when they need help understanding',
      icon: '🌐'
    },
    {
      title: 'Real-Time Interactive Activities',
      description: 'Games, role-plays, and challenges generated instantly based on your child\'s progress',
      icon: '🎯'
    },
    {
      title: 'Progress Tracking for Parents',
      description: 'See exactly how your child is improving with detailed progress reports',
      icon: '📊'
    },
    {
      title: 'Flexible Scheduling',
      description: '7 quick daily lessons that fit into any family routine - perfect for busy schedules',
      icon: '⏰'
    },
    {
      title: 'Character-Based Learning',
      description: '5 unique AI teachers with different personalities to keep learning engaging',
      icon: '👥'
    }
  ];

  const testimonials = [
    {
      name: 'Maria González',
      role: 'Mother of 3',
      quote: 'As a bilingual family, we wanted our kids to learn a third language. goeddy.com made it so easy! The AI teachers understand when to switch between English and Spanish to help our kids grasp new concepts in French.',
      rating: 5,
      highlight: 'Perfect for multilingual families'
    },
    {
      name: 'David Chen',
      role: 'Father & Software Engineer',
      quote: 'I was skeptical about AI teaching, but the technology is incredible. My 12-year-old is having actual conversations in Mandarin after just 3 months. The interactive activities keep him engaged way better than traditional apps.',
      rating: 5,
      highlight: 'Real conversations in just 3 months'
    },
    {
      name: 'Amanda Williams',
      role: 'Homeschool Mom',
      quote: 'The 7-minute daily lessons are perfect for our homeschool routine. My kids (ages 7, 10, and 14) all use different teachers and are learning different languages. The progress tracking helps me see their improvement.',
      rating: 5,
      highlight: 'Perfect for homeschooling'
    },
    {
      name: 'Roberto Silva',
      role: 'Single Dad',
      quote: 'My daughter struggled with Spanish in school, but Luna (her favorite teacher) made it click. She went from failing grades to being excited about speaking Spanish at home. Worth every penny!',
      rating: 5,
      highlight: 'From failing to fluent'
    }
  ];

  const faqs = [
    {
      question: 'Is AI teaching really effective for children?',
      answer: 'Yes! Our AI teachers are specifically designed for children ages 6-18. They use age-appropriate language, can repeat explanations patiently, and adapt to each child\'s learning pace. Plus, they never get tired or frustrated, creating a safe learning environment.'
    },
    {
      question: 'What languages can my child learn?',
      answer: 'We currently support Spanish, French, German, Italian, Mandarin, Japanese, Portuguese, Korean, Arabic, and Hindi. Our AI teachers can explain concepts in over 30 native languages including English, Spanish, French, German, Portuguese, and more.'
    },
    {
      question: 'How long are the daily lessons?',
      answer: 'Each lesson is designed to be 7 minutes or less. This keeps children engaged without overwhelming them, and fits easily into busy family schedules. You can always do multiple lessons if your child wants to continue!'
    },
    {
      question: 'What if my child gets frustrated or confused?',
      answer: 'Our AI teachers are programmed to recognize when children are struggling. They automatically switch to the child\'s native language to explain concepts, offer encouragement, and adjust the difficulty level in real-time.'
    },
    {
      question: 'Can multiple children use the same account?',
      answer: 'Absolutely! One subscription covers your entire family. Each child gets their own profile, progress tracking, and can choose their favorite AI teacher. Perfect for families with multiple kids learning different languages.'
    },
    {
      question: 'Is it safe for children to use?',
      answer: 'Yes, goeddy.com is completely safe. There are no chat features with other users, no social media elements, and all conversations are with our secure AI teachers. We take child privacy and safety very seriously.'
    },
    {
      question: 'What if we need to cancel?',
      answer: 'You can cancel anytime with no hassle. We offer a full refund within the first 14 days if you\'re not completely satisfied. Most families love it so much they upgrade to longer plans!'
    }
  ];

  return (
    <div className="min-h-screen bg-leaf-950 text-white">
      {/* Header */}
      <div className="bg-leaf-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Everything You Need to Know About <span className="text-leaf-100">goeddy.com</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The complete guide to how our AI teachers help children ages 6-18 master new languages through speaking practice
          </p>
        </div>
      </div>

      {/* Detailed Features */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Effective Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-leaf-900 p-6 rounded-xl hover:bg-leaf-800 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl bg-leaf-400 p-2 rounded-lg">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-leaf-100 mb-2">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Testimonials */}
      <div className="bg-leaf-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Real Stories from Real Families</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-leaf-700 p-8 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-leaf-100 text-xl">⭐</span>
                  ))}
                </div>
                <div className="bg-leaf-400 text-leaf-950 px-3 py-1 rounded-full text-sm font-bold inline-block mb-4">
                  {testimonial.highlight}
                </div>
                <p className="text-gray-300 mb-6 text-lg italic">"{testimonial.quote}"</p>
                <div className="border-t border-leaf-600 pt-4">
                  <p className="font-bold text-leaf-200">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-leaf-900 rounded-xl">
                <button
                  className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-leaf-400"
                  onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-leaf-100">{faq.question}</h3>
                    <span className="text-leaf-400 text-2xl">
                      {activeFAQ === index ? '−' : '+'}
                    </span>
                  </div>
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
      </div>

      {/* Email Capture */}
      <div className="bg-leaf-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Want a Free Demo Before You Subscribe?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Enter your email and we'll send you a 3-day free trial link so your child can meet our AI teachers!
          </p>
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-leaf-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-400"
                required
              />
              <button
                type="submit"
                className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Get Free Demo
              </button>
            </div>
          </form>
          <p className="text-sm text-gray-400 mt-4">No spam, just your demo link and helpful language learning tips!</p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Child's Language Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join over 10,000 families who've made language learning fun and effective with goeddy.com
          </p>
          <button 
            onClick={handleCTAClick}
            className="bg-leaf-400 hover:bg-leaf-200 text-leaf-950 font-bold py-4 px-8 rounded-full text-xl transition-colors transform hover:scale-105"
          >
            Start Learning Today - $30/Month
          </button>
          <div className="mt-6 text-leaf-200">
            <p>✅ 14-day money-back guarantee • ✅ Cancel anytime • ✅ Family-friendly & safe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
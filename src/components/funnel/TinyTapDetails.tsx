// @ts-nocheck
"use client";

import { useState } from 'react';

interface TinyTapDetailsProps {
  onEvent: (type: string, value?: string | number) => void;
}

export default function TinyTapDetails({ onEvent }: TinyTapDetailsProps) {
  const [email, setEmail] = useState<string>('');
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onEvent('email_capture', email);
      setEmail('');
    }
  };

  const features = [
    {
      title: 'Drag & Drop Game Builder',
      description: 'Create interactive games without coding. Simply drag elements, add questions, and customize with your content.',
      benefits: ['No technical skills required', 'Templates for all subjects', 'Real-time preview']
    },
    {
      title: 'Massive Game Library',
      description: 'Access thousands of pre-made educational games covering math, science, language arts, and social skills.',
      benefits: ['100+ new games monthly', 'Aligned with curriculum standards', 'Age-appropriate content']
    },
    {
      title: 'Student Analytics',
      description: 'Track student progress, identify learning gaps, and adjust instruction based on detailed performance data.',
      benefits: ['Individual progress tracking', 'Class performance summaries', 'Learning insights dashboard']
    },
    {
      title: 'Multi-Device Support',
      description: 'Games work seamlessly on tablets, phones, computers, and interactive whiteboards.',
      benefits: ['iOS and Android apps', 'Web browser compatibility', 'Offline play available']
    }
  ];

  const faqs = [
    {
      question: 'How easy is it to create games?',
      answer: 'Very easy! Our drag-and-drop interface requires no coding. Most teachers create their first game in under 10 minutes. We provide templates and tutorials to get you started quickly.'
    },
    {
      question: 'What subjects and grade levels are supported?',
      answer: 'TinyTap covers all major subjects (math, science, language arts, social studies) for ages 2-18. Content is organized by grade level and curriculum standards.'
    },
    {
      question: 'Can I use TinyTap offline?',
      answer: 'Yes! Once games are downloaded, they can be played offline on mobile devices. This is perfect for classrooms with limited internet connectivity.'
    },
    {
      question: 'Is there a limit to how many games I can create?',
      answer: 'No limits! Create unlimited games, access our entire library, and share with unlimited students. Your creativity is the only boundary.'
    },
    {
      question: 'What support is available?',
      answer: 'We offer 24/7 email support, video tutorials, live webinars, and an active community forum. Our education specialists are here to help you succeed.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely! Cancel your subscription anytime with no penalties. You\'ll retain access to your created games even after cancellation.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-leaf-100 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Know About TinyTap
          </h1>
          <p className="text-xl text-gray-600">
            Discover how TinyTap transforms education through interactive gaming
          </p>
        </div>
      </div>

      {/* Features Deep Dive */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Powerful Features That Make Learning Fun
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`p-6 rounded-xl cursor-pointer transition-all ${
                      activeFeature === index ? 'bg-leaf-700 text-white' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    {activeFeature === index && (
                      <div className="space-y-2">
                        <p className="text-leaf-100">{feature.description}</p>
                        <ul className="space-y-1">
                          {feature.benefits.map((benefit, i) => (
                            <li key={i} className="text-leaf-200 text-sm">✓ {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:pl-8">
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">
                  {activeFeature === 0 && '🎨'}
                  {activeFeature === 1 && '📚'}
                  {activeFeature === 2 && '📊'}
                  {activeFeature === 3 && '📱'}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {features[activeFeature].title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {features[activeFeature].description}
                </p>
                <button 
                  onClick={() => onEvent('cta_click')}
                  className="bg-leaf-400 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Try This Feature Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What Educators Are Saying
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex text-leaf-400 text-lg mb-4">★★★★★</div>
              <p className="text-gray-600 mb-4">
                "I've tried many educational platforms, but TinyTap is by far the most intuitive. My kindergarteners are learning sight words through games they actually want to play!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-leaf-200 rounded-full flex items-center justify-center text-sm">LT</div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Lisa Thompson</div>
                  <div className="text-gray-400 text-sm">Kindergarten Teacher</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex text-leaf-400 text-lg mb-4">★★★★★</div>
              <p className="text-gray-600 mb-4">
                "The analytics feature is a game-changer. I can see exactly where each student struggles and create targeted games to help them improve."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-leaf-200 rounded-full flex items-center justify-center text-sm">DR</div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">David Rodriguez</div>
                  <div className="text-gray-400 text-sm">5th Grade Math Teacher</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex text-leaf-400 text-lg mb-4">★★★★★</div>
              <p className="text-gray-600 mb-4">
                "As a special education teacher, I need customizable content. TinyTap lets me create games perfectly suited to each student's needs and abilities."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-leaf-200 rounded-full flex items-center justify-center text-sm">AC</div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Angela Chen</div>
                  <div className="text-gray-400 text-sm">Special Education Teacher</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-xl">
                <button
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors rounded-xl"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    <div className="text-gray-400 text-xl">
                      {openFaq === index ? '−' : '+'}
                    </div>
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
      </div>

      {/* Email Capture */}
      <div className="py-16 bg-leaf-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get a Free Demo & Setup Guide
          </h2>
          <p className="text-leaf-100 text-lg mb-8">
            See TinyTap in action with a personalized demo plus our complete teacher setup guide (usually $29, yours free)
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-400 w-full"
              required
            />
            <button 
              type="submit"
              className="bg-leaf-400 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap"
            >
              Send My Demo
            </button>
          </form>
          <div className="text-leaf-200 text-sm mt-4">
            ✓ No spam ever ✓ Unsubscribe anytime ✓ Demo sent instantly
          </div>
          <div className="mt-8">
            <button 
              onClick={() => onEvent('cta_click')}
              className="bg-white text-leaf-700 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              Skip Demo - Start Free Trial Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
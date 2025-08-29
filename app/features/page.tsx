'use client';

import { Phone, MessageSquare, Globe, Shield, Zap, Settings, Cloud, Headphones, Mail, PhoneForwarded, BarChart, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: Phone,
    title: 'Local Phone Numbers',
    description: 'Get local numbers in 50+ countries. Build trust with customers by having a local presence anywhere in the world.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    icon: MessageSquare,
    title: 'SMS & MMS Support',
    description: 'Send and receive text messages and multimedia content. Perfect for verification codes and customer communication.',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    icon: PhoneForwarded,
    title: 'Smart Call Forwarding',
    description: 'Forward calls to any number worldwide. Set up custom routing rules based on time, caller ID, or location.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    icon: Mail,
    title: 'Voicemail to Email',
    description: 'Never miss a message. Get voicemails delivered directly to your email as audio attachments with transcriptions.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    icon: Zap,
    title: 'Instant Activation',
    description: 'Start using your number immediately. No waiting periods, no complex setup - just instant communication.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    icon: Shield,
    title: 'Privacy Protection',
    description: 'Keep your personal number private. Use virtual numbers for online listings, dating apps, or business.',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  {
    icon: Cloud,
    title: 'Cloud-Based System',
    description: 'Access your number from anywhere. Works on any device with internet - no hardware or apps required.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    icon: Settings,
    title: 'API Integration',
    description: 'Integrate with your existing systems. Full REST API for developers to build custom solutions.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  {
    icon: BarChart,
    title: 'Analytics & Reporting',
    description: 'Track call volumes, duration, and patterns. Export detailed reports for business insights.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Military-grade encryption for all communications. Your calls and messages are completely secure.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Get help whenever you need it. Our expert support team is always ready to assist you.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  {
    icon: Globe,
    title: 'International Calling',
    description: 'Make and receive international calls at local rates. Save up to 90% on international communication.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  }
];

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Communication
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage your business communications professionally and efficiently.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className={`${feature.bgColor} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses using NumNinja to power their communications.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => router.push('/numbers')}
            >
              Get Your Number
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => router.push('/pricing')}
            >
              View Pricing
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
            <p className="text-gray-600">Countries Available</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
            <p className="text-gray-600">Uptime Guarantee</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
            <p className="text-gray-600">Customer Support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
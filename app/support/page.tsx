'use client';

import { Mail, MessageSquare, Phone, Clock, Book, HelpCircle, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const faqs = [
  {
    question: 'How quickly can I get a phone number?',
    answer: 'Phone numbers are activated instantly after purchase. You can start using your number within seconds of completing the checkout process.'
  },
  {
    question: 'Can I port my existing number?',
    answer: 'Yes! We support number porting from most carriers. The process typically takes 5-7 business days. Contact our support team to get started.'
  },
  {
    question: 'What countries are available?',
    answer: 'We offer local numbers in over 50 countries including the US, Canada, UK, Australia, and most of Europe. Check our numbers page for the full list.'
  },
  {
    question: 'Can I use the number for business?',
    answer: 'Absolutely! Our Professional and Enterprise plans are designed specifically for business use with features like multiple numbers, call recording, and API access.'
  },
  {
    question: 'How does call forwarding work?',
    answer: 'You can forward calls to any phone number worldwide. Set up is simple - just enter your forwarding number in the dashboard. You can also set up time-based routing rules.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees! You only pay the monthly subscription price. All features are included in your plan with no hidden costs.'
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle support ticket submission
    alert('Support ticket submitted! We\'ll get back to you within 24 hours.');
    setMessage('');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How Can We Help You?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant answers from our knowledge base or contact our support team.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email</p>
            <p className="text-sm font-medium text-blue-600">support@numninja.io</p>
            <p className="text-xs text-gray-500 mt-2">Response within 24 hours</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with our team</p>
            <Button className="bg-green-600 hover:bg-green-700">
              Start Chat
            </Button>
            <p className="text-xs text-gray-500 mt-2">Available 9am-6pm EST</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Call us directly</p>
            <p className="text-sm font-medium text-purple-600">+1 (555) 123-4567</p>
            <p className="text-xs text-gray-500 mt-2">Enterprise customers only</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {filteredFAQs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start">
                  <HelpCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 ml-7">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
          {filteredFAQs.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No results found. Try a different search term or contact support.
            </p>
          )}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Still Need Help? Send Us a Message
          </h2>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">General Question</option>
                <option value="billing">Billing & Payments</option>
                <option value="technical">Technical Support</option>
                <option value="account">Account Issues</option>
                <option value="feature">Feature Request</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your issue or question..."
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </form>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Resources
          </h3>
          <div className="flex justify-center gap-6">
            <a href="#" className="flex items-center text-blue-600 hover:text-blue-700">
              <Book className="h-5 w-5 mr-2" />
              Documentation
            </a>
            <a href="#" className="flex items-center text-blue-600 hover:text-blue-700">
              <Clock className="h-5 w-5 mr-2" />
              System Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
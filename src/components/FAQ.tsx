import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Is Adstartup Meta compliant?',
      answer: 'Yes, absolutely. Adstartup uses the official Meta Marketing API and follows all Meta advertising policies. Your campaigns are created and managed using the same infrastructure that agencies use, ensuring full compliance with Meta\'s terms of service.',
    },
    {
      question: 'Do you control my ad account?',
      answer: 'No. You maintain complete ownership and control of your Meta ad account. Adstartup simply connects via OAuth to execute campaigns on your behalf. You can revoke access at any time, and you always have full visibility into every action taken in your Meta Ads Manager.',
    },
    {
      question: 'Can I stop or modify campaigns anytime?',
      answer: 'Yes. You have full control through both Adstartup\'s dashboard and your Meta Ads Manager. You can pause, stop, or modify any campaign at any time. Adstartup works alongside your existing Meta infrastructure, not as a replacement.',
    },
    {
      question: 'Who owns the campaign data and results?',
      answer: 'You do. All campaign data, performance metrics, and results belong to you. Everything runs in your Meta ad account, and you can export or analyze data using Meta\'s native tools or Adstartup\'s dashboard.',
    },
    {
      question: 'How fast do campaigns go live after I submit a brief?',
      answer: 'Typically 5-10 minutes. Once you submit your campaign brief, our AI generates the campaign structure, ad sets, and creatives, then deploys them via the Meta API. You\'ll receive a notification when your campaigns are live.',
    },
    {
      question: 'What if I already have active campaigns?',
      answer: 'No problem. Adstartup can work alongside your existing campaigns without interfering. You can choose to let AI manage specific campaigns while keeping others under manual control. It\'s your choice.',
    },
    {
      question: 'Do I need technical expertise to use Adstartup?',
      answer: 'Not at all. Adstartup is designed for business owners, marketers, and entrepreneurs who want results without technical complexity. Just answer simple questions in the campaign brief, and AI handles the technical execution.',
    },
    {
      question: 'What happens if I cancel my subscription?',
      answer: 'Your campaigns will continue running in your Meta ad account. You\'ll lose access to Adstartup\'s optimization and automation features, but your ads and data remain yours. You can manage them manually through Meta Ads Manager.',
    },
    {
      question: 'How does the free trial work?',
      answer: '14 days, full access, no credit card required. Connect your Meta account, launch campaigns, and see results. If you love it, choose a plan. If not, simply walk away with no charges.',
    },
  ];

  return (
    <div id="faq" className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">Common Questions</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Adstartup and automated Meta ads.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our team is here to help. Get in touch and we'll answer any questions about how Adstartup can work for your business.
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all inline-flex items-center space-x-2">
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

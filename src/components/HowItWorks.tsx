import React from 'react';
import { Link2, Target, FileText, Zap, Activity, TrendingUp } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const HowItWorks = () => {
  const steps = [
    {
      icon: Link2,
      number: '01',
      title: 'Connect Meta Business Manager',
      description: 'Securely link your Meta Business Manager account through our OAuth integration. Your credentials stay safe.',
    },
    {
      icon: Target,
      number: '02',
      title: 'Select Ad Account, Pixel & Catalog',
      description: 'Choose which ad account, tracking pixel, and product catalog to use. Adstartup works with your existing setup.',
    },
    {
      icon: FileText,
      number: '03',
      title: 'Fill Campaign Brief',
      description: 'Answer simple questions about your target audience, budget, goals, and creative assets. No technical expertise needed.',
    },
    {
      icon: Zap,
      number: '04',
      title: 'AI Generates & Deploys',
      description: 'Our AI creates complete campaigns, ad sets, and creatives—then deploys them live via Meta Marketing API.',
    },
    {
      icon: Activity,
      number: '05',
      title: 'Campaigns Go Live',
      description: 'Your ads start running immediately in your Meta Ads Manager. You maintain full visibility and control.',
    },
    {
      icon: TrendingUp,
      number: '06',
      title: 'Continuous Optimization',
      description: 'AI monitors performance 24/7, automatically adjusting budgets, pausing underperformers, and scaling winners.',
    },
  ];

  const headingRef = useScrollAnimation();
  const stepsRef = useScrollAnimation({ threshold: 0.15 });
  const bottomSectionRef = useScrollAnimation({ threshold: 0.2 });

  return (
    <div id="how-it-works" className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef.ref} className={`text-center mb-16 ${headingRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <Activity className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">Automated Workflow</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            From Brief to Live Campaigns{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              in Minutes
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect once, then let AI handle campaign creation, deployment, and optimization automatically.
          </p>
        </div>

        <div ref={stepsRef.ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-red-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                stepsRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                {step.number}
              </div>
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                <step.icon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div ref={bottomSectionRef.ref} className={`mt-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 lg:p-12 border border-gray-800 ${
          bottomSectionRef.isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'
        }`}>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Complete API Integration
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Adstartup uses the official Meta Marketing API to create and manage campaigns directly in your ad account. Every action is transparent and visible in your Meta Ads Manager.
              </p>
              <div className="space-y-3">
                {['Campaign creation & structure', 'Ad set configuration', 'Creative deployment', 'Budget management', 'Performance tracking'].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-400 text-sm">Connected to Meta API</span>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Campaign Status</div>
                  <div className="text-white font-semibold">Active & Optimizing</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Last Optimization</div>
                  <div className="text-white font-semibold">2 minutes ago</div>
                </div>
                <div className="bg-gradient-to-r from-red-600/10 to-red-400/10 border border-red-600/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-red-600 text-sm font-semibold">AI analyzing performance data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;

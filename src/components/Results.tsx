import React from 'react';
import { TrendingUp, Users, ShoppingCart, Briefcase } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCountUp } from '../hooks/useCountUp';

const Results = () => {
  const headingRef = useScrollAnimation();
  const cardsRef = useScrollAnimation({ threshold: 0.15 });
  const metricsRef = useScrollAnimation({ threshold: 0.2 });

  const roasCounter = useCountUp({ end: 4.8, decimals: 1, suffix: 'x' });
  const cpaCounter = useCountUp({ end: 47, prefix: '-', suffix: '%' });
  const timeSavedCounter = useCountUp({ end: 89, suffix: '%' });
  const speedCounter = useCountUp({ end: 5, suffix: 'min' });

  const useCases = [
    {
      icon: ShoppingCart,
      title: 'E-Commerce Brands',
      metric: '4.2x Average ROAS',
      description: 'Product catalog automation, dynamic retargeting, and conversion-focused campaigns that scale with your inventory.',
      results: [
        '342% increase in ROAS',
        '58% lower cost per purchase',
        '3x more products tested',
      ],
    },
    {
      icon: Briefcase,
      title: 'B2B & SaaS',
      metric: '$42 Average CPA',
      description: 'Lead generation campaigns with intelligent nurturing, multi-touch attribution, and account-based targeting.',
      results: [
        '67% more qualified leads',
        '41% reduction in CPA',
        '2.8x faster scale',
      ],
    },
    {
      icon: Users,
      title: 'Agencies & Teams',
      metric: '12 Clients Per Manager',
      description: 'Manage multiple client accounts simultaneously with automated execution, unified reporting, and white-label capabilities.',
      results: [
        '85% time savings',
        '5x more campaigns managed',
        '92% client retention',
      ],
    },
  ];

  return (
    <div className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef.ref} className={`text-center mb-16 ${headingRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">Real Results</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Built for{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Your Use Case
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're scaling an e-commerce store, generating B2B leads, or managing client accounts, Adstartup adapts to your needs.
          </p>
        </div>

        <div ref={cardsRef.ref} className="grid lg:grid-cols-3 gap-8 mb-16">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-red-600 transition-all duration-300 hover:shadow-lg group ${
                cardsRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:from-red-100 group-hover:to-red-200 transition-colors">
                <useCase.icon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {useCase.title}
              </h3>
              <div className="text-red-600 font-bold text-lg mb-4">
                {useCase.metric}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                {useCase.description}
              </p>
              <div className="space-y-3 border-t border-gray-200 pt-6">
                {useCase.results.map((result, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-medium">{result}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div ref={metricsRef.ref} className={`bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 lg:p-12 border border-gray-800 ${
          metricsRef.isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'
        }`}>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Performance That Speaks for Itself
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Real metrics from campaigns managed by Adstartup across different industries and budgets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div ref={roasCounter.ref} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="text-gray-400 text-sm mb-2">Average ROAS</div>
              <div className="text-4xl font-bold text-white mb-1">{roasCounter.value}</div>
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+156% vs manual</span>
              </div>
            </div>
            <div ref={cpaCounter.ref} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="text-gray-400 text-sm mb-2">Cost Per Acquisition</div>
              <div className="text-4xl font-bold text-white mb-1">{cpaCounter.value}</div>
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>vs agency average</span>
              </div>
            </div>
            <div ref={timeSavedCounter.ref} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="text-gray-400 text-sm mb-2">Time Saved</div>
              <div className="text-4xl font-bold text-white mb-1">{timeSavedCounter.value}</div>
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>on ad management</span>
              </div>
            </div>
            <div ref={speedCounter.ref} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="text-gray-400 text-sm mb-2">Campaign Speed</div>
              <div className="text-4xl font-bold text-white mb-1">{speedCounter.value}</div>
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>from brief to live</span>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-gradient-to-r from-red-600/10 to-red-400/10 border border-red-600/20 rounded-xl p-6 text-center">
            <p className="text-gray-300 text-lg">
              <span className="text-white font-semibold">"Adstartup delivers agency-level results at a fraction of the cost and time."</span>
              <br />
              <span className="text-gray-400 text-base mt-2 block">— Marketing Director, 7-figure DTC Brand</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

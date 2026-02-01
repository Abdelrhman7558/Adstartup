import { Brain, DollarSign, Target, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const AIEngine = () => {
  const headingRef = useScrollAnimation();
  const featuresRef = useScrollAnimation({ threshold: 0.15 });
  const bottomSectionRef = useScrollAnimation({ threshold: 0.2 });
  const features = [
    {
      icon: Brain,
      title: 'Intelligent Decision-Making',
      description: 'AI analyzes thousands of data points in real-time to make optimal campaign decisions based on your goals and historical performance.',
    },
    {
      icon: DollarSign,
      title: 'Automated Budget Allocation',
      description: 'Dynamically shifts budget to top-performing ad sets and audiences. Reduces spend on underperformers automatically.',
    },
    {
      icon: Target,
      title: 'Creative Testing Engine',
      description: 'Continuously tests ad variations, headlines, images, and CTAs to find winning combinations that drive results.',
    },
    {
      icon: TrendingUp,
      title: 'ROAS & CPA Monitoring',
      description: 'Tracks return on ad spend and cost per acquisition in real-time, adjusting campaigns to hit your target metrics.',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Deep learning algorithms identify patterns and opportunities humans miss, improving performance over time.',
    },
    {
      icon: Zap,
      title: 'Scaling & Pausing Logic',
      description: 'Automatically scales winning campaigns and pauses losers based on statistical significance and conversion data.',
    },
  ];

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef.ref} className={`text-center mb-16 ${headingRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <Brain className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">AI-Powered Engine</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Brain Behind{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Your Performance
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI doesn't just create campaigns. It thinks, learns, and optimizes 24/7 to maximize your ROI.
          </p>
        </div>

        <div ref={featuresRef.ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-red-600 transition-all duration-300 hover:shadow-lg ${featuresRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:from-red-100 group-hover:to-red-200 transition-colors">
                <feature.icon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div ref={bottomSectionRef.ref} className={`bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 lg:p-12 border border-gray-800 ${bottomSectionRef.isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'
          }`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                Technical but Simple
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Behind the scenes, The Ad Agent uses advanced machine learning algorithms, real-time data processing, and Meta's Marketing API to execute campaigns with precision.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                But you don't need to understand any of that. Just set your goals, and let AI do the heavy lifting.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Real-Time Optimization</div>
                    <div className="text-gray-400">AI adjusts campaigns every 15 minutes based on performance data</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Predictive Analytics</div>
                    <div className="text-gray-400">Machine learning predicts performance trends before they happen</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">Autonomous Execution</div>
                    <div className="text-gray-400">No manual intervention needed—AI makes and executes decisions</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">AI Confidence Score</span>
                  <span className="text-green-400 font-semibold">94%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Active Optimizations</div>
                <div className="text-3xl font-bold text-white mb-4">24</div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">Budget reallocation in progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">Testing 8 new ad variations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">Analyzing audience segments</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-600/10 to-red-400/10 border border-red-600/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Brain className="w-6 h-6 text-red-600" />
                  <span className="text-red-600 font-semibold">AI Learning</span>
                </div>
                <p className="text-gray-300 text-sm">
                  The system improves with every campaign, learning what works best for your specific business and audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEngine;

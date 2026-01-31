import React, { useEffect, useState, useRef } from 'react';
import { Zap, TrendingUp, Users, BarChart3, Clock, Target } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import gsap from 'gsap';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  benefits: string[];
}

const FeatureRotation = () => {
  const sectionRef = useScrollAnimation({ threshold: 0.3, triggerOnce: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const features: Feature[] = [
    {
      icon: Zap,
      title: 'Automated Campaign Execution',
      description: 'AI builds and deploys complete Meta ad campaigns in minutes. No manual setup, no technical expertise required.',
      benefits: [
        'Campaign structure created automatically',
        'Ad sets configured based on your brief',
        'Creatives generated and deployed live',
        'Full Meta API integration'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Performance Optimization',
      description: 'Continuous AI monitoring adjusts budgets, pauses underperformers, and scales winners automatically every 15 minutes.',
      benefits: [
        'Budget reallocation in real-time',
        'Automatic bid optimization',
        'Performance-based scaling logic',
        'Stop-loss protection built-in'
      ]
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics & Insights',
      description: 'Deep learning algorithms identify patterns humans miss, providing actionable insights to improve performance over time.',
      benefits: [
        'Predictive performance forecasting',
        'Audience segment analysis',
        'Creative performance scoring',
        'Multi-touch attribution tracking'
      ]
    },
    {
      icon: Users,
      title: 'Multi-Account Management',
      description: 'Manage unlimited Meta ad accounts from one dashboard. Perfect for agencies handling multiple client campaigns.',
      benefits: [
        'Centralized campaign control',
        'Client-specific reporting',
        'Team collaboration tools',
        'White-label capabilities'
      ]
    },
    {
      icon: Clock,
      title: 'Time-Saving Automation',
      description: 'Eliminate 89% of manual ad management work. Focus on strategy while AI handles execution and optimization.',
      benefits: [
        'No daily budget checks needed',
        'Automated reporting generation',
        'Instant campaign deployment',
        'Set-and-forget optimization'
      ]
    },
    {
      icon: Target,
      title: 'Precision Audience Targeting',
      description: 'AI-powered audience discovery and testing finds your best-performing customer segments automatically.',
      benefits: [
        'Lookalike audience generation',
        'Interest-based targeting refinement',
        'Behavioral pattern detection',
        'Geo-location optimization'
      ]
    }
  ];

  useEffect(() => {
    if (!sectionRef.isVisible) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const rotateFeature = () => {
      if (isAnimating) return;

      setIsAnimating(true);

      if (contentRef.current) {
        gsap.to(contentRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % features.length);

            gsap.fromTo(
              contentRef.current,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                onComplete: () => {
                  setIsAnimating(false);
                }
              }
            );
          }
        });
      }
    };

    timerRef.current = setInterval(rotateFeature, 5000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sectionRef.isVisible, isAnimating, features.length]);

  const activeFeature = features[activeIndex];
  const IconComponent = activeFeature.icon;

  return (
    <div ref={sectionRef.ref} className="bg-gradient-to-br from-gray-900 to-black py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 ${sectionRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">Platform Features</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything Your Ad Team Needs,{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              In One Platform
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From automated execution to real-time optimization, Adstartup handles every aspect of Meta ad management.
          </p>
        </div>

        <div className="relative min-h-[500px] flex items-center justify-center">
          <div
            ref={contentRef}
            className="w-full max-w-5xl"
            style={{ willChange: 'opacity, transform' }}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/25">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex space-x-2">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === activeIndex
                            ? 'w-8 bg-red-600'
                            : 'w-1.5 bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {activeFeature.title}
                </h3>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  {activeFeature.description}
                </p>

                <div className="space-y-4">
                  {activeFeature.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-300 leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                        <span className="text-gray-400 text-sm font-medium">Active Feature</span>
                        <span className="text-green-400 text-sm font-semibold flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          Live
                        </span>
                      </div>

                      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <IconComponent className="w-6 h-6 text-red-600" />
                          <span className="text-white font-semibold">
                            {activeFeature.title}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {activeFeature.benefits.slice(0, 2).map((benefit, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                              <span className="text-gray-400 text-sm">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                          <div className="text-gray-400 text-xs mb-1">Status</div>
                          <div className="text-white font-bold text-lg">Active</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                          <div className="text-gray-400 text-xs mb-1">Priority</div>
                          <div className="text-white font-bold text-lg">High</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-600/20 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-red-600/20 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureRotation;

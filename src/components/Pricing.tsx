import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Zap } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useAuth } from '../contexts/AuthContext';

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const headingRef = useScrollAnimation();
  const plansRef = useScrollAnimation({ threshold: 0.2 });

  const handleSubscribeClick = () => {
    navigate('/payment', {
      state: {
        planName: 'SOLO',
        price: 39,
        billingPeriod: 'monthly'
      }
    });
  };

  const handleTrialClick = () => {
    if (!user) {
      navigate('/signup?trial=true');
    } else {
      navigate('/brief');
    }
  };

  const plans = [
    {
      name: 'SOLO',
      description: 'Perfect for solo entrepreneurs',
      price: 39,
      features: [
        '1 Meta Ad Account',
        'Unlimited campaigns',
        'AI optimization every 30 minutes',
        'Basic reporting',
        'Email support',
      ],
      popular: true,
    },
  ];

  return (
    <div id="pricing" className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef.ref} className={`text-center mb-12 ${headingRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">Simple Pricing</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            One Plan,{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Full Power
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start automating your Meta ads today. No setup fees. Cancel anytime.
          </p>
        </div>

        <div ref={plansRef.ref} className="flex justify-center">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-8 border-2 max-w-md w-full ${plan.popular
                  ? 'border-red-600 shadow-xl shadow-red-600/10'
                  : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-300 hover:-translate-y-1 ${plansRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'
                }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-end justify-center">
                  <span className="text-6xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 ml-2 mb-2">/month</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={handleSubscribeClick}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center justify-center space-x-2 shadow-lg shadow-red-600/25"
                >
                  <span>Subscribe Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleTrialClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center justify-center space-x-2 shadow-lg shadow-green-600/25"
                >
                  <span>Trial 14-days Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-200">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-red-600' : 'text-green-500'
                        }`}
                    />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            14-day free trial. No credit card required. Cancel anytime.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Full refund within 30 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

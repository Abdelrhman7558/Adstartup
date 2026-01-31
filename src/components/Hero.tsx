import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, TrendingUp, DollarSign, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleCTAClick = () => {
    if (!user) {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleSeeHowItWorks = () => {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/90 backdrop-blur-lg border-b border-gray-800 shadow-lg' : 'bg-black/80 backdrop-blur-md border-b border-gray-800'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">Adstartup</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#faq" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/signin" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Sign In
                </Link>
                <button
                  onClick={handleCTAClick}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 hover:scale-105 active:scale-95"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className={`inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 ${
              isVisible ? 'animate-slide-up-fast opacity-100' : 'opacity-0'
            }`}>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-red-600 text-sm font-semibold">AI-Powered Meta Ads Automation</span>
            </div>
            <h1 className={`text-5xl lg:text-7xl font-bold text-white leading-tight ${
              isVisible ? 'animate-slide-up animation-delay-100 opacity-100' : 'opacity-0'
            }`}>
              Launch, optimize, and scale Meta ads —{' '}
              <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent inline-block transform transition-all duration-300 hover:scale-105">
                automatically
              </span>
            </h1>
            <p className={`text-xl text-gray-400 leading-relaxed ${
              isVisible ? 'animate-fade-in animation-delay-300 opacity-100' : 'opacity-0'
            }`}>
              AI turns your brief into live Meta ads using your own Business Manager.
              No manual setup. No agency fees. Complete ownership and control.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 ${
              isVisible ? 'animate-fade-in animation-delay-400 opacity-100' : 'opacity-0'
            }`}>
              <button
                onClick={handleCTAClick}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:scale-105 active:scale-95 group"
              >
                <span>{!user ? 'Start Free' : 'Go to Dashboard'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <button
                onClick={handleSeeHowItWorks}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5" />
                <span>See How It Works</span>
              </button>
            </div>
            <div className={`flex items-center space-x-6 text-sm text-gray-500 ${
              isVisible ? 'animate-fade-in animation-delay-600 opacity-100' : 'opacity-0'
            }`}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className={`relative ${
            isVisible ? 'animate-scale-in animation-delay-400 opacity-100' : 'opacity-0'
          }`}>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Campaign Performance</span>
                    <span className="text-green-400 text-sm font-semibold flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +342%
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">$127,450</div>
                  <div className="text-sm text-gray-500">Total Ad Spend</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-red-600" />
                      <span className="text-gray-400 text-sm">ROAS</span>
                    </div>
                    <div className="text-2xl font-bold text-white">4.8x</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-red-600" />
                      <span className="text-gray-400 text-sm">CPA</span>
                    </div>
                    <div className="text-2xl font-bold text-white">$12.40</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-red-600/10 to-red-400/10 border border-red-600/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-red-600 text-sm font-semibold">AI Optimizing</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Analyzing 24 ad variations across 8 audiences...
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-red-600/20 rounded-full blur-3xl animate-glow"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-600/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  );
};

export default Hero;

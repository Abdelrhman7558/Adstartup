import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Target } from 'lucide-react';
import gsap from 'gsap';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useAuth } from '../contexts/AuthContext';

const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contentRef = useScrollAnimation({ threshold: 0.3 });
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  const handleTrialClick = () => {
    if (!user) {
      navigate('/signup?trial=true');
    } else {
      navigate('/brief');
    }
  };

  useEffect(() => {
    if (glow1Ref.current && glow2Ref.current) {
      gsap.to(glow1Ref.current, {
        y: -30,
        x: 30,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(glow2Ref.current, {
        y: 30,
        x: -30,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
    }
  }, []);

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div ref={glow1Ref} className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        <div ref={glow2Ref} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
      </div>

      <div ref={contentRef.ref} className="max-w-5xl mx-auto px-6 relative z-10">
        <div className={`text-center ${contentRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">Start Today</span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Meta Ads Manager Wasn't Built for{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Automation.
            </span>
            <br />
            The Ad Agent Is.
          </h2>

          <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Stop wasting time on manual campaign management. Let AI handle execution, optimization, and scaling while you focus on growing your business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <button onClick={handleTrialClick} className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 group text-lg">
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 border border-white/10 text-lg">
              <Target className="w-5 h-5" />
              <span>Book a Demo</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>14-day free trial</span>
            </div>
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

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">5min</div>
            <div className="text-gray-400">From brief to live campaigns</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">4.8x</div>
            <div className="text-gray-400">Average ROAS improvement</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">89%</div>
            <div className="text-gray-400">Time saved on ad management</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalCTA;

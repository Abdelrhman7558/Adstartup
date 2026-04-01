import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const SocialProof = () => {
  const logos = [
    'TechCorp',
    'ShopFlow',
    'Digital+',
    'Growthify',
    'MediaHouse',
    'ScaleUp',
    'Brandify',
    'AdVenture',
    'EcomGrowth',
    'MarketPro',
    'SalesBoost',
  ];

  const sliderRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!sliderRef.current) return;

    const timeline = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'none' },
    });

    timeline.to(sliderRef.current, {
      xPercent: -50,
      duration: 30,
      ease: 'none',
    });

    timelineRef.current = timeline;

    const handleMouseEnter = () => {
      gsap.to(timeline, { timeScale: 0.3, duration: 0.5 });
    };

    const handleMouseLeave = () => {
      gsap.to(timeline, { timeScale: 1, duration: 0.5 });
    };

    const slider = sliderRef.current;
    slider.addEventListener('mouseenter', handleMouseEnter);
    slider.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      slider.removeEventListener('mouseenter', handleMouseEnter);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      timeline.kill();
    };
  }, []);

  return (
    <div className="bg-white py-16 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-gray-500 text-sm font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          Trusted by Performance-Focused Teams
        </p>
        <div className="relative overflow-hidden">
          <div ref={sliderRef} className="flex space-x-12 will-change-transform">
            {[...logos, ...logos, ...logos].map((logo, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-center h-12 px-8 text-gray-400 font-semibold text-lg whitespace-nowrap hover:text-gray-600 transition-colors duration-300"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialProof;

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import SocialProof from '../components/SocialProof';
import ValueProposition from '../components/ValueProposition';
import HowItWorks from '../components/HowItWorks';
import FeatureRotation from '../components/FeatureRotation';
import AIEngine from '../components/AIEngine';
import Results from '../components/Results';
import Comparison from '../components/Comparison';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToPricing) {
      setTimeout(() => {
        const pricingElement = document.getElementById('pricing-section');
        if (pricingElement) {
          pricingElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <SocialProof />
      <ValueProposition />
      <HowItWorks />
      <FeatureRotation />
      <AIEngine />
      <Results />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

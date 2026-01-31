import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      '5 Active Campaigns',
      'Basic Analytics',
      'Email Support',
      '1 Ad Account',
      'Standard Assets Library',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'month',
    popular: true,
    features: [
      '20 Active Campaigns',
      'Advanced Analytics',
      'Priority Support',
      '3 Ad Accounts',
      'Unlimited Assets',
      'A/B Testing',
      'Custom Reports',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited Campaigns',
      'Enterprise Analytics',
      '24/7 Dedicated Support',
      'Unlimited Ad Accounts',
      'Unlimited Assets',
      'Advanced A/B Testing',
      'Custom Integrations',
      'White Label Options',
    ],
  },
];

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (!user?.id) {
      navigate('/signin?redirect=/plans');
      return;
    }

    setLoading(true);
    setSelectedPlan(planId);

    try {
      const { error } = await supabase
        .from('user_flow_state')
        .upsert({
          user_id: user.id,
          current_step: 'payment',
          has_selected_plan: true,
          selected_plan_id: planId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      navigate('/payment');
    } catch (error) {
      console.error('Error saving plan selection:', error);
      alert('Failed to select plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-400">Choose Your Plan</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Start Your Advertising
            <br />
            Journey Today
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select the perfect plan for your business and unlock powerful AI-driven Meta advertising campaigns
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-gray-900 border-2 rounded-2xl p-8 ${
                plan.popular
                  ? 'border-red-600 shadow-2xl shadow-red-600/20'
                  : 'border-gray-800 hover:border-gray-700'
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading && selectedPlan === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading && selectedPlan === plan.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Select {plan.name}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16 text-gray-400"
        >
          <p>All plans include a 14-day free trial. Cancel anytime.</p>
        </motion.div>
      </div>
    </div>
  );
}

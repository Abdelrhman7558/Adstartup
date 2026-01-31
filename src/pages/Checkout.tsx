import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CheckoutState {
  planName: string;
  price: number;
  billingPeriod: 'monthly' | 'annual';
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const state = location.state as CheckoutState;

  if (!state) {
    navigate('/');
    return null;
  }

  const { planName, price, billingPeriod } = state;
  const totalPrice = billingPeriod === 'annual' ? price * 12 : price;


  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(formatExpiryDate(value));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvv(value);
    }
  };

  const validateCardDetails = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    const cleanedExpiry = expiryDate.replace(/\D/g, '');

    if (cleanedCardNumber.length !== 16) {
      return 'Please enter a valid 16-digit card number';
    }

    if (cleanedExpiry.length !== 4) {
      return 'Please enter a valid expiry date';
    }

    const month = parseInt(cleanedExpiry.slice(0, 2));
    const year = parseInt('20' + cleanedExpiry.slice(2, 4));
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      return 'Invalid expiry month';
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'Card has expired';
    }

    if (cvv.length < 3) {
      return 'Please enter a valid CVV';
    }

    if (cardName.trim().length < 3) {
      return 'Please enter cardholder name';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to subscribe');
      return;
    }

    // Validate card details
    const validationError = validateCardDetails();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with real Stripe integration
      // Simulating payment processing for MVP
      await new Promise(resolve => setTimeout(resolve, 2000));

      const expiresAt = new Date();
      if (billingPeriod === 'annual') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_name: planName,
          plan_price: price,
          payment_method: 'stripe',
          payment_id: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: expiresAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          plan_id: planName.toLowerCase(),
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          subscription_id: subscriptionData.id,
          amount: totalPrice,
          provider: 'stripe',
          status: 'completed',
          paid_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      const { error: userStateError } = await supabase
        .from('user_states')
        .upsert({
          user_id: user.id,
          has_active_subscription: true,
          current_step: 'subscribed',
        }, {
          onConflict: 'user_id'
        });

      if (userStateError) throw userStateError;

      await refreshSubscription();

      console.log('[Checkout] Payment successful, redirecting to brief...');
      navigate('/brief');
    } catch (err) {
      console.error('[Checkout] Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 transition-colors"
        >
          ← Back
        </button>


        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Complete Your Subscription</h1>
          <p className="text-gray-400 text-lg">
            Join Adstartup and start automating your Meta ads today
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 mb-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-600" />
            Plan Summary
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Plan</span>
              <span className="font-semibold text-white">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Billing</span>
              <span className="font-semibold text-white capitalize">{billingPeriod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Monthly Price</span>
              <span className="font-semibold text-white">${price}/mo</span>
            </div>
            {billingPeriod === 'annual' && (
              <div className="flex justify-between items-center text-green-500">
                <span>Annual Discount (20%)</span>
                <span className="font-semibold">-${(price * 12 * 0.2).toFixed(0)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center text-xl">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-red-600">${totalPrice}</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {billingPeriod === 'annual' ? 'Billed annually' : 'Billed monthly'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">Payment Details</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay ${totalPrice} Securely
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>SSL Encrypted</span>
              </div>
            </div>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          By subscribing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Checkout;

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const [loading, setLoading] = useState(false);

  // Default to SOLO plan if no state provided
  const planDetails = location.state || {
    planName: 'SOLO',
    price: 39,
    billingPeriod: 'monthly'
  };

  const handlePay = async () => {
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to signup with success flag
      navigate('/signup?payment_success=true');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Complete Your Order</h1>
            <p className="text-xl text-gray-400">
              {planDetails.planName} Plan - ${planDetails.price}/mo
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-800">
              <Lock className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">Your payment information is secure</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all placeholder-gray-600"
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM / YY"
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVC</label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all placeholder-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all placeholder-gray-600"
                />
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-8">
                <p className="text-sm text-yellow-500 font-medium mb-2">Demo Mode</p>
                <p className="text-xs text-gray-400">
                  This applies a mock payment. You will be redirected to create your account.
                </p>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay ${planDetails.price}</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

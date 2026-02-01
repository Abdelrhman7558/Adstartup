import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';

declare const FS: any;

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Default details
  const planDetails = location.state || {
    planName: 'Starter',
    price: 39,
    billingPeriod: 'monthly'
  };

  const handlePay = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    if (typeof FS === 'undefined') {
      console.error('Freemius script not loaded');
      setLoading(false);
      return;
    }

    const handler = new FS.Checkout({
      product_id: '23627',
      plan_id: '39504',
      public_key: 'pk_3076d2e358e621bc1c607e0947d19',
      image: 'https://bolt.new/static/og_default.png'
    });

    handler.open({
      name: 'Starter',
      licenses: 1,
      purchaseCompleted: (response: any) => {
        console.log('Purchase completed:', response);
        console.log('User email:', response.user.email);
        console.log('License key:', response.license.key);
        setLoading(false);
        navigate('/signup?payment_success=true', { state: { ...response } });
      },
      success: (response: any) => {
        console.log('Checkout closed after successful purchase:', response);
        console.log('User email:', response.user.email);
        console.log('License key:', response.license.key);
        setLoading(false);
      },
      cancel: () => {
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#333333] font-sans">
      {/* Header / Navbar placeholder if needed, or just padding */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#333333] hover:text-[#1A73E8] transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start mt-8">
          {/* Left Column: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mb-6">
              <img
                src="https://bolt.new/static/og_default.png"
                alt="Product Logo"
                className="w-24 h-24 rounded-xl shadow-md mb-6 object-cover"
              />
              <h1 className="text-3xl font-bold mb-4 text-[#333333]">The Ad Agent - {planDetails.planName}</h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Unlock the full power of AI-driven advertising. Create, manage, and optimize your campaigns with our professional tools.
              </p>

              <ul className="space-y-3 mb-8">
                {['Advanced AI Analytics', 'Unlimited Campaigns', '24/7 Support', 'Real-time Optimization'].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-[#1A73E8]/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#1A73E8]"></div>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Right Column: Checkout Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-8"
          >
            <div className="border-b border-gray-100 pb-6 mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-lg font-semibold text-gray-600">Total Price</span>
                <span className="text-4xl font-bold text-[#1A73E8]">${planDetails.price}</span>
              </div>
              <p className="text-right text-sm text-gray-400">Billed {planDetails.billingPeriod}</p>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-8">
              <span className="font-medium text-gray-700">Quantity</span>
              <span className="font-bold text-[#333333]">1 License</span>
            </div>

            {/* Buy Button with specified ID */}
            <button
              id="purchase"
              onClick={handlePay}
              disabled={loading}
              className="w-full py-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mb-6"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Buy Button</span>
                  <CreditCard className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Confirmation / Trust Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-3 rounded-lg">
                <Lock className="w-4 h-4 text-[#FF6600]" />
                <span className="font-medium">256-bit SSL Secure Payment</span>
              </div>

              <p className="text-center text-xs text-gray-400 leading-relaxed">
                By completing your purchase, you agree to our <a href="#" className="text-[#1A73E8] hover:underline">Terms of Service</a> and <a href="#" className="text-[#1A73E8] hover:underline">Privacy Policy</a>.
                <br />
                30-day money-back guarantee.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

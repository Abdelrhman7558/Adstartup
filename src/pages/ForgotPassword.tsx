import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const sendWebhook = async (data: any) => {
    try {
      await fetch('https://n8n.srv1181726.hstgr.cloud/webhook-test/Forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Webhook error:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setShake(false);
    setIsLoading(true);

    const timestamp = new Date().toISOString();

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError.message);
        setShake(true);
        setTimeout(() => setShake(false), 650);
        await sendWebhook({
          email,
          timestamp,
          status: 'failure',
          error: resetError.message,
        });
        setIsLoading(false);
        return;
      }

      await sendWebhook({
        email,
        timestamp,
        status: 'success',
      });

      setSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setShake(true);
      setTimeout(() => setShake(false), 650);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-red-600 mb-4">The Ad Agent</div>
          <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
          <p className="text-gray-400">Enter your email to receive a reset link</p>
        </div>

        {!success ? (
          <>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: shake ? [0, -10, 10, -10, 10, 0] : 0
                  }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: shake ? 0.5 : 0.3 }}
                  className="mb-6 p-4 bg-red-600/10 border border-red-600/20 rounded-lg text-red-500 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              animate={{ x: shake ? [0, -10, 10, -10, 10, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 transition-all duration-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all duration-300 text-white placeholder-gray-600"
                  placeholder="Enter your email"
                />
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-red-700"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                <span className="relative">{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
              </motion.button>

              {/* Back to Sign In */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link
                  to="/signin"
                  className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </motion.div>
            </motion.form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="w-10 h-10 text-red-600" />
            </motion.div>

            <h3 className="text-2xl font-bold mb-2">Check your email</h3>
            <p className="text-gray-400 mb-8">
              We've sent a password reset link to <span className="text-white">{email}</span>
            </p>

            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-500 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

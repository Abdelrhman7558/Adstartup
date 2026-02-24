import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MetaCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'cancelled'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);

  const handleCallback = async () => {
    try {
      // 1. CHECK FOR SUCCESS FROM EDGE FUNCTION
      if (searchParams.get('meta_connected') === 'true') {
        setStatus('success');
        const userId = searchParams.get('user_id') || user?.id;
        const mode = searchParams.get('mode');
        setTimeout(() => {
          navigate(`/meta-select?user_id=${userId}${mode ? `&mode=${mode}` : ''}`);
        }, 1500);
        return;
      }

      // 2. CHECK FOR ERRORS
      const errorParam = searchParams.get('error');
      if (errorParam) {
        if (errorParam === 'access_denied') {
          setErrorMsg('Meta connection was canceled. You can try again at any time.');
          setStatus('cancelled');
        } else {
          const details = searchParams.get('details');
          setErrorMsg(`We could not complete the Meta connection. Please try again. (${errorParam}${details ? `: ${details}` : ''})`);
          setStatus('error');
        }
        return;
      }

      // 3. LEGACY/FALLBACK: HANDLE IMPLICIT FLOW (Token in Hash)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get('access_token');
      const state = hashParams.get('state') || searchParams.get('state');

      if (accessToken && state) {
        // ... (keep legacy logic if needed, but the new flow is preferred)
        console.log('[MetaCallback] Handling legacy implicit flow');
        // We'll just show loading then redirect if they have an access token already
        setStatus('success');
        setTimeout(() => navigate('/meta-select'), 1000);
        return;
      }

      // If we got here with nothing, it's an error
      setErrorMsg("No connection data found. Please reconnect your account.");
      setStatus('error');

    } catch (error: any) {
      console.error('[MetaCallback] Error:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!user?.id) {
      navigate('/signin');
      return;
    }

    handleCallback();
  }, [user, navigate, searchParams]);

  const handleRetry = async () => {
    setRetrying(true);
    setStatus('loading');
    setErrorMsg('');
    await handleCallback();
    setRetrying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-400 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">Connecting Meta Account</h1>
            <p className="text-gray-400">Authenticating and fetching your accounts...</p>
          </>
        )}

        {(status === 'error' || status === 'cancelled') && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {status === 'cancelled' ? 'Connection Canceled' : 'Connection Failed'}
            </h1>
            <p className="text-gray-400 mb-8">{errorMsg}</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {retrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">Connected Successfully</h1>
            <p className="text-gray-400">Redirecting to account selection...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}

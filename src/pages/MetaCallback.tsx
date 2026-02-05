import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { validateUserId, logWebhookCall } from '../lib/webhookUtils';

export default function MetaCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'cancelled'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);

  const handleCallback = async () => {
    try {
      // HANDLE IMPLICIT FLOW (Token in Hash)
      const hashParams = new URLSearchParams(window.location.hash.slice(1)); // Remove leading '#'
      const accessToken = hashParams.get('access_token');
      const state = hashParams.get('state') || searchParams.get('state'); // State might be in query or hash
      const dataResId = hashParams.get('data_access_expiration_time'); // Check if it returned extra data

      // HANDLE ERROR (Usually in Query)
      const errorParam = searchParams.get('error') || hashParams.get('error');
      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');

      if (errorParam === 'access_denied') {
        setErrorMsg('Meta connection was canceled. You can try again at any time.');
        setStatus('cancelled');
        return;
      }

      if (errorParam) {
        console.error('Meta Auth Error:', errorParam, errorDesc);
        setErrorMsg(errorDesc || "We couldn't complete the Meta connection. Please try again.");
        setStatus('error');
        return;
      }

      if (!accessToken && !state) {
        // Only error if completely missing. 
        // Note: Sometimes redirects might strip hash if not handled carefully, but standard Meta flow preserves it.
        setErrorMsg("No connection data found. Please reconnect your account.");
        setStatus('error');
        return;
      }

      // Validate user_id from state parameter
      // Allow exact match OR match with __manager suffix
      const isManagerConnection = state?.endsWith('__manager');
      const cleanStateUserId = isManagerConnection ? state?.split('__')[0] : state;

      if (cleanStateUserId !== user?.id) {
        setErrorMsg('Security validation failed. Please reconnect your account.');
        setStatus('error');
        logWebhookCall('POST', 'Meta-Callback', state || 'MISSING', false, { reason: 'state_mismatch' });
        return;
      }

      const validatedUserId = validateUserId(user?.id);

      // Access Token is already here! No need to exchange code.
      // Fetch User Details directly
      const meResponse = await fetch(
        `https://graph.instagram.com/v19.0/me?fields=id,name,email,business&access_token=${accessToken}`
      );

      if (!meResponse.ok) {
        const errData = await meResponse.json();
        console.error('User Info Fetch Error:', errData);
        throw new Error('user_info_fetch_failed');
      }

      const meData = await meResponse.json();
      const business_id = meData.business?.id || meData.id;

      await supabase
        .from('meta_account_selections')
        .upsert(
          {
            user_id: validatedUserId,
            business_id,
            access_token: accessToken, // Store the implicit token
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      logWebhookCall('POST', 'Meta-Callback', validatedUserId, true, { business_id, method: 'implicit' });

      setStatus('success');
      setTimeout(() => {
        // Redirect with clean user_id and mode flag if applicable
        const isManager = state?.endsWith('__manager');
        navigate(`/meta-select?user_id=${validatedUserId}${isManager ? '&mode=manager' : ''}`);
      }, 1500);
    } catch (error: any) {
      console.error('[MetaCallback] Error:', {
        message: error.message,
        code: error.code,
      });

      const errorCode = error.message || 'unknown_error';

      if (error.message === 'user_info_fetch_failed') {
        setErrorMsg('We could not access your Meta account details. Please try again.');
      } else {
        setErrorMsg('Network issue detected. Please check your connection and try again.');
      }

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

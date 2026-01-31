import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { buildMetaOAuthUrl, checkMetaConnectionStatus, N8N_WEBHOOKS } from '../lib/oauthState';

interface MetaAccountManagerProps {
  className?: string;
}

export default function MetaAccountManager({ className = '' }: MetaAccountManagerProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkMetaConnection();
    }
  }, [user?.id]);

  const checkMetaConnection = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const connected = await checkMetaConnectionStatus(user.id);
      setIsConnected(connected);
    } catch (err) {
      console.error('[Meta Account] Check error:', err);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const oauthUrl = buildMetaOAuthUrl(user.id);
      window.location.href = oauthUrl;
    } catch (err) {
      console.error('[Meta Account] OAuth initiation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate Meta OAuth');
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    try {
      setDisconnecting(true);
      setError(null);

      const response = await fetch(N8N_WEBHOOKS.checkConnection, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'disconnect',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Meta account');
      }

      setIsConnected(false);
      setSuccess('Meta account disconnected');
      setShowDisconnectModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[Meta Account] Disconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect Meta account');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span className="px-3 py-1 bg-green-600 dark:bg-green-600 text-white text-xs font-semibold rounded-full">
            Active Account
          </span>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <p className="text-sm text-green-700 dark:text-green-400 mb-4">
          Your Meta account is securely connected and ready to use.
        </p>

        <button
          onClick={() => setShowDisconnectModal(true)}
          className="w-full py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors"
        >
          Disconnect Account
        </button>

        {showDisconnectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disconnect Account?</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will disconnect your Meta account from Adstartup. You can reconnect anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisconnectModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                >
                  Keep Connected
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Connect your Meta account to start managing your campaigns and viewing analytics.
      </p>

      <button
        onClick={handleConnect}
        className="w-full py-3 bg-black dark:bg-red-600 hover:bg-gray-900 dark:hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        Connect Meta Account
      </button>
    </div>
  );
}

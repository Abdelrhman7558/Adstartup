import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getMetaOAuthUrl } from '../lib/metaOAuthState';
import { Link as LinkIcon, CheckCircle, Loader, AlertCircle } from 'lucide-react';

interface MetaConnectionStatusProps {
  userId?: string;
  onStatusChange?: (connected: boolean) => void;
  className?: string;
}

export default function MetaConnectionStatus({ userId, onStatusChange, className = '' }: MetaConnectionStatusProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkMetaConnection = async () => {
      try {
        setLoading(true);

        const { data: metaConnData, error: metaConnError } = await supabase
          .from('meta_connections')
          .select('is_connected')
          .eq('user_id', userId)
          .maybeSingle();

        if (metaConnError && metaConnError.code !== 'PGRST116') {
          throw metaConnError;
        }

        const isConnected = metaConnData?.is_connected || false;
        setConnected(isConnected);
        setError(null);

        if (onStatusChange) {
          onStatusChange(isConnected);
        }
      } catch (err) {
        console.error('[MetaConnection] Error checking connection:', err);
        setError('Failed to check connection status');
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkMetaConnection();
  }, [userId, onStatusChange]);

  const handleConnect = async () => {
    if (!userId) {
      setError('User ID not available. Please sign in again.');
      return;
    }

    try {
      console.log('[MetaConnection] Initiating OAuth for user:', userId.slice(0, 8) + '...');
      const oauthUrl = getMetaOAuthUrl(userId);
      console.log('[MetaConnection] Redirecting to Meta OAuth...');
      window.location.href = oauthUrl;
    } catch (err) {
      console.error('[MetaConnection] Error generating OAuth URL:', err);
      setError('Failed to initialize Meta connection');
    }
  };

  const handleDisconnect = async () => {
    if (!userId) {
      setError('User ID not available');
      return;
    }

    if (!window.confirm('Are you sure you want to disconnect your Meta account? This will remove access to your ad campaigns.')) {
      return;
    }

    try {
      setDisconnecting(true);
      console.log('[MetaConnection] Disconnecting Meta account for user:', userId.slice(0, 8) + '...');

      const { error: updateError } = await supabase
        .from('meta_connections')
        .update({
          is_connected: false,
          access_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      setConnected(false);
      setError(null);
      console.log('[MetaConnection] Successfully disconnected');

      if (onStatusChange) {
        onStatusChange(false);
      }
    } catch (err) {
      console.error('[MetaConnection] Error disconnecting Meta account:', err);
      setError('Failed to disconnect account');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading Meta status...</span>
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className={`space-y-4 ${className}`}>
        <button
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Active Meta Account
        </button>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="w-full py-2 px-4 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      <button
        onClick={handleConnect}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <LinkIcon className="w-5 h-5" />
        Connect Meta Account
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Connect your Meta Business Account to manage your ads and assets
      </p>
    </div>
  );
}

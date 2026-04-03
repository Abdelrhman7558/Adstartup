import { useState } from 'react';
import { LinkIcon } from 'lucide-react';
import { validateUserId } from '../lib/webhookUtils';
import { supabase } from '../lib/supabase';

interface ConnectMetaButtonProps {
  userId: string | undefined;
  isConnected: boolean;
  onConnecting?: () => void;
  className?: string;
  variant?: 'button' | 'compact';
  trialExpired?: boolean;
  onDisconnect?: () => void;
}

export default function ConnectMetaButton({
  userId,
  isConnected,
  onConnecting,
  className = '',
  variant = 'button',
  trialExpired = false,
  onDisconnect,
}: ConnectMetaButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    if (!userId || isConnected || trialExpired) {
      return;
    }

    setIsLoading(true);
    onConnecting?.();

    try {
      const validatedUserId = validateUserId(userId);
      const clientId = '891623109984411';

      // Use the new Supabase Edge Function as the redirect URI
      // This replaces the old n8n flow and handles token exchange securely
      const redirectUri = `https://avzyuhhbmzhxqksnficn.supabase.co/functions/v1/meta-oauth-callback`;

      const scope = encodeURIComponent('ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,catalog_management,pages_show_list');

      // Create a state string with userId, timestamp and origin for dynamic redirect
      const stateContent = `${validatedUserId}:${Date.now()}:${window.location.origin}`;
      const state = btoa(stateContent);

      const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}&response_type=code`;

      window.location.href = oauthUrl;
    } catch (error) {
      console.error('[Meta OAuth] Error:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!userId || !confirm('Are you sure you want to disconnect your Meta account?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('meta_connections')
        .delete()
        .eq('user_id', userId);
        
      if (error) throw error;
      
      onDisconnect?.();
      window.location.reload(); // Quick refresh to update all states
    } catch (err) {
      console.error('Error disconnecting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'compact') {
    if (isConnected) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">Active Account</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={isLoading || !userId}
        className={`flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        <LinkIcon className="w-4 h-4" />
        {isLoading ? 'Connecting...' : 'Connect Meta Account'}
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center justify-between gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-xl w-full sm:w-auto ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
          <span className="font-semibold text-green-900">Active Account</span>
        </div>
        <button 
            onClick={handleDisconnect}
            disabled={isLoading}
            className="ml-4 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  if (trialExpired) {
    return (
      <div className={`px-6 py-3 bg-gray-200 border border-gray-300 rounded-xl ${className}`}>
        <p className="text-sm font-semibold text-gray-600">Trial Expired</p>
        <p className="text-xs text-gray-500 mt-1">Subscribe to connect Meta</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading || !userId}
      className={`px-6 py-3 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <LinkIcon className="w-4 h-4" />
      {isLoading ? 'Connecting...' : 'Connect Meta Account'}
    </button>
  );
}

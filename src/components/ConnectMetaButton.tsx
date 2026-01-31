import { useState } from 'react';
import { LinkIcon } from 'lucide-react';
import { validateUserId } from '../lib/webhookUtils';

interface ConnectMetaButtonProps {
  userId: string | undefined;
  isConnected: boolean;
  onConnecting?: () => void;
  className?: string;
  variant?: 'button' | 'compact';
  trialExpired?: boolean;
}

export default function ConnectMetaButton({
  userId,
  isConnected,
  onConnecting,
  className = '',
  variant = 'button',
  trialExpired = false,
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
      const redirectUri = encodeURIComponent('https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback');
      const scope = encodeURIComponent('ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,pages_show_list,instagram_basic,business_management,catalog_management');

      const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${validatedUserId}`;

      window.location.href = oauthUrl;
    } catch (error) {
      console.error('[Meta OAuth] Error:', error);
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
      <div className={`flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-xl ${className}`}>
        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
        <span className="font-semibold text-green-900">Active Account</span>
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

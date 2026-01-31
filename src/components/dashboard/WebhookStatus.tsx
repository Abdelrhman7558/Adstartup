import { useEffect, useState } from 'react';
import { Webhook } from 'lucide-react';
import { Webhook as WebhookType } from '../../lib/supabase';
import { getRecentWebhooks } from '../../lib/webhookManager';

interface WebhookStatusProps {
  userId: string;
}

export default function WebhookStatus({ userId }: WebhookStatusProps) {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebhooks();
  }, [userId]);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const data = await getRecentWebhooks(userId, 5);
      setWebhooks(data);
    } catch (err) {
      console.error('[WebhookStatus] Error loading webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: WebhookType['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-600/20 text-green-400 border-green-700';
      case 'sent':
        return 'bg-blue-600/20 text-blue-400 border-blue-700';
      case 'failed':
        return 'bg-red-600/20 text-red-400 border-red-700';
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-700';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-700';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-8">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-blue-600"></div>
        <p className="mt-2 text-sm text-gray-400">Loading webhook status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Webhook size={20} className="text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Webhook Activity</h3>
      </div>

      {webhooks.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-8 text-center">
          <p className="text-sm text-gray-400">No webhook activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-start justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {formatEventType(webhook.event_type)}
                  </span>
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(webhook.status)}`}>
                    {webhook.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(webhook.created_at).toLocaleString()}
                </p>
              </div>

              {webhook.response_code && (
                <div className="text-right">
                  <p className="text-xs font-mono text-gray-400">
                    {webhook.response_code}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadWebhooks}
        className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
      >
        Refresh Status
      </button>
    </div>
  );
}

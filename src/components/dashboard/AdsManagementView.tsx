import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Loader, PlayCircle, PauseCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { validateUserId, logWebhookCall, WebhookValidationError } from '../../lib/webhookUtils';

interface Ad {
  id: string;
  name: string;
  status: string;
  campaign_id: string | null;
  created_at: string;
  revenue?: number;
  views?: number;
}

interface AdsManagementViewProps {
  userId: string;
  userEmail: string;
  userName: string;
}

export default function AdsManagementView({ userId, userEmail, userName }: AdsManagementViewProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingAdId, setRemovingAdId] = useState<string | null>(null);
  const [killingAll, setKillingAll] = useState(false);

  const fetchAds = async () => {
    try {
      setLoading(true);

      const { data: adsData, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const adsWithMetrics = await Promise.all(
        (adsData || []).map(async (ad) => {
          const { data: perfData } = await supabase
            .from('ads_performance')
            .select('revenue, impressions')
            .eq('ad_id', ad.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...ad,
            revenue: perfData?.revenue || 0,
            views: perfData?.impressions || 0,
          };
        })
      );

      setAds(adsWithMetrics);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();

    const interval = setInterval(() => {
      fetchAds();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleKillAllAds = async () => {
    if (!window.confirm('Are you sure you want to kill all ads? This action cannot be undone.')) {
      return;
    }

    setKillingAll(true);
    try {
      const validatedUserId = validateUserId(userId);

      const { error: updateError } = await supabase
        .from('ads')
        .update({ status: 'paused' })
        .eq('user_id', validatedUserId)
        .eq('status', 'active');

      if (updateError) throw updateError;

      const response = await fetch('https://n8n.srv1181726.hstgr.cloud/webhook-test/Kill-All-Ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Action: 'Killed All Ads',
          user_id: validatedUserId,
          'User Name': userName,
        }),
      });

      if (response.ok) {
        await fetchAds();
        logWebhookCall('POST', 'Kill-All-Ads', validatedUserId, true);
        alert('All ads have been killed successfully');
      } else {
        throw new Error('Webhook failed');
      }
    } catch (error) {
      if (error instanceof WebhookValidationError) {
        console.error('[handleKillAllAds] Validation error:', error.message);
      } else {
        console.error('Error killing all ads:', error);
      }
      logWebhookCall('POST', 'Kill-All-Ads', userId, false, { error: String(error) });
      alert('Failed to kill all ads. Please try again.');
    } finally {
      setKillingAll(false);
    }
  };

  const handleRemoveAd = async (ad: Ad) => {
    if (!window.confirm(`Are you sure you want to remove the ad "${ad.name}"?`)) {
      return;
    }

    setRemovingAdId(ad.id);
    try {
      const validatedUserId = validateUserId(userId);

      const { error: deleteError } = await supabase
        .from('ads')
        .delete()
        .eq('id', ad.id);

      if (deleteError) throw deleteError;

      const response = await fetch('https://n8n.srv1181726.hstgr.cloud/webhook-test/Remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Action: 'Remove',
          'Ad Name': ad.name,
          user_id: validatedUserId,
          'User Email': userEmail,
        }),
      });

      if (response.ok) {
        await fetchAds();
        logWebhookCall('POST', 'Remove', validatedUserId, true);
        alert(`Ad "${ad.name}" has been removed successfully`);
      } else {
        throw new Error('Webhook failed');
      }
    } catch (error) {
      if (error instanceof WebhookValidationError) {
        console.error('[handleRemoveAd] Validation error:', error.message);
      } else {
        console.error('Error removing ad:', error);
      }
      logWebhookCall('POST', 'Remove', userId, false, { error: String(error) });
      alert('Failed to remove ad. Please try again.');
    } finally {
      setRemovingAdId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ads Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and monitor your advertising campaigns</p>
        </div>
        <button
          onClick={handleKillAllAds}
          disabled={killingAll || ads.length === 0 || ads.filter(a => a.status === 'active').length === 0}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          {killingAll ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              Kill All Ads
            </>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-gray-400 dark:text-gray-500"
              >
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Ads Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
              You haven't created any ads yet. Connect your Meta account and create your first campaign to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Ad Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{ad.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                        {getStatusIcon(ad.status)}
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(ad.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${ad.revenue?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">{ad.views?.toLocaleString() || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveAd(ad)}
                        disabled={removingAdId === ad.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {removingAdId === ad.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, FolderOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { isManagerPlanUser } from '../../lib/managerPlanService';
import { formatCurrency } from '../../lib/currencyUtils';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  daily_budget?: number;
  spend?: number;
  revenue?: number;
  roas?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  runtime?: number | null;
  date_start?: string;
  date_stop?: string;
  account_name?: string;
  ad_account_id?: string;
}

export default function CampaignsListView() {
  const { user, countryCode } = useAuth();
  const { theme } = useTheme();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = isManagerPlanUser(user?.email);

  const fetchCampaigns = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-meta-campaigns', {
        body: { userId: user.id },
      });

      if (fnError) throw fnError;

      const list: Campaign[] = (data?.recent_campaigns || data?.all_campaigns || []).map((c: any) => ({
        campaign_id: c.campaign_id || c.id,
        campaign_name: c.campaign_name || c.name,
        status: c.status,
        daily_budget: c.daily_budget ?? c.budget,
        spend: c.spend,
        revenue: c.revenue,
        roas: c.roas,
        impressions: c.impressions,
        clicks: c.clicks,
        ctr: c.ctr,
        cpc: c.cpc,
        cpa: c.cpa,
        runtime: c.runtime,
        date_start: c.date_start || c.start_date,
        date_stop: c.date_stop || c.end_date,
        account_name: c.account_name,
        ad_account_id: c.ad_account_id,
      }));

      setCampaigns(list);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const formatDate = (d?: string) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString();
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Campaigns
            </h1>
            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              All campaigns across connected accounts
            </p>
          </div>
          <button
            onClick={fetchCampaigns}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Reload'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {isLoading && campaigns.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className={`w-12 h-12 mx-auto mb-4 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
            <FolderOpen className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No campaigns found</p>
          </div>
        ) : (
          <div className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Campaign</th>
                  {isManager && (
                    <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Account</th>
                  )}
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Daily Budget</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Spend</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Revenue</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>ROAS</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Impressions</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Clicks</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CTR</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CPC</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CPA</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Runtime</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Start</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>End</th>
                </tr>
              </thead>
              <tbody className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
                {campaigns.map((campaign, idx) => (
                  <tr
                    key={campaign.campaign_id || idx}
                    className={`border-b last:border-0 ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <td className="p-4">
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {campaign.campaign_name || 'Unnamed'}
                      </div>
                      <div className={`text-xs mt-0.5 font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {campaign.campaign_id}
                      </div>
                    </td>
                    {isManager && (
                      <td className={`p-4 text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {campaign.account_name || campaign.ad_account_id || '--'}
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[campaign.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {campaign.status || '--'}
                      </span>
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {campaign.daily_budget ? formatCurrency(campaign.daily_budget, countryCode) : '--'}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency(campaign.spend || 0, countryCode)}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(campaign.revenue || 0, countryCode)}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                      {Number(campaign.roas || 0).toFixed(2)}x
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {Number(campaign.impressions || 0).toLocaleString()}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {Number(campaign.clicks || 0).toLocaleString()}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {Number(campaign.ctr || 0).toFixed(2)}%
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency(campaign.cpc || 0, countryCode)}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency(campaign.cpa || 0, countryCode)}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {campaign.runtime != null ? `${campaign.runtime}d` : '--'}
                    </td>
                    <td className={`p-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(campaign.date_start)}
                    </td>
                    <td className={`p-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(campaign.date_stop)}
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

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, FolderOpen, ShieldCheck } from 'lucide-react';
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
  currency?: string;
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
        currency: c.currency || 'USD'
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
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Meta Campaigns Dashboard
            </h1>
            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Real-time performance metrics across all your connected Meta accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isManager && (
              <div className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                Manager Plan
              </div>
            )}
            <button
              onClick={fetchCampaigns}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Reload Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {isLoading && campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-12 h-12 mb-4 animate-spin text-blue-500" />
            <p className="text-lg font-medium opacity-60">Aggregating campaign data...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className={`text-center py-24 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-3xl border border-dashed border-gray-300 dark:border-gray-700`}>
            <FolderOpen className="w-16 h-16 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-bold mb-2">No campaigns found</h3>
            <p className="opacity-60 max-w-md mx-auto">Make sure your Meta accounts are correctly connected in the Accounts Manager section.</p>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border shadow-xl ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Campaign</th>
                    {isManager && (
                      <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60 text-blue-500">Ad Account</th>
                    )}
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Status</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Daily Budget</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Spend (30d)</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">ROAS</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">CPA (Cost/Pur)</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Impressions</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">CTR</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Runtime</th>
                    <th className="p-5 font-bold text-xs uppercase tracking-wider opacity-60">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {campaigns.map((campaign, idx) => (
                    <tr
                      key={campaign.campaign_id || idx}
                      className={`transition-colors ${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}
                    >
                      <td className="p-5">
                        <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          {campaign.campaign_name || 'Unnamed'}
                        </div>
                        <div className="text-[10px] mt-1 font-mono opacity-40">
                          ID: {campaign.campaign_id}
                        </div>
                      </td>
                      {isManager && (
                        <td className="p-5">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold ring-1 ring-inset ring-blue-500/20">
                            {campaign.account_name || 'Direct Connection'}
                          </div>
                        </td>
                      )}
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${statusColors[campaign.status?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {campaign.status || 'unknown'}
                        </span>
                      </td>
                      <td className="p-5 font-mono text-sm">
                        {campaign.daily_budget ? formatCurrency(campaign.daily_budget, countryCode) : '--'}
                      </td>
                      <td className="p-5">
                        <div className="font-bold font-mono">
                          {formatCurrency(campaign.spend || 0, countryCode)}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className={`text-sm font-black ${Number(campaign.roas || 0) >= 1 ? 'text-green-500' : 'opacity-60'}`}>
                          {Number(campaign.roas || 0).toFixed(2)}x
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-bold text-purple-500">
                          {campaign.cpa ? formatCurrency(campaign.cpa, countryCode) : '--'}
                        </div>
                      </td>
                      <td className="p-5 opacity-70 text-sm">
                        {Number(campaign.impressions || 0).toLocaleString()}
                      </td>
                      <td className="p-5 opacity-70 text-sm font-mono">
                        {Number(campaign.ctr || 0).toFixed(2)}%
                      </td>
                      <td className="p-5">
                        <div className="text-xs font-bold opacity-60">
                          {campaign.runtime != null ? `${campaign.runtime} days` : 'N/A'}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] uppercase opacity-40 font-bold">Starts: {formatDate(campaign.date_start)}</div>
                          <div className="text-[10px] uppercase opacity-40 font-bold">Ends: {formatDate(campaign.date_stop)}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchActiveCampaigns } from '../../lib/n8nWebhookService';
import { formatCurrency } from '../../lib/currencyUtils';

interface ActiveCampaign {
  campaign_name: string;
  campaign_id: string;
  budget: number;
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpa: number;
  start_date: string | null;
  end_date: string | null;
}

export default function ActiveAdsView() {
  const { user, countryCode } = useAuth();
  const { theme } = useTheme();
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveCampaigns = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchActiveCampaigns(user.id);
      setActiveCampaigns(data);
    } catch (err) {
      console.error('Error loading active campaigns:', err);
      setError('Failed to load active campaigns. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveCampaigns();
  }, [user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Active Campaigns
            </h1>
            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Real-time performance metrics
            </p>
          </div>

          <button
            onClick={loadActiveCampaigns}
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

        {isLoading && activeCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className={`w-12 h-12 mx-auto mb-4 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading active campaigns...</p>
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
            <Zap className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No active campaigns found</p>
          </div>
        ) : (
          <div className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Name</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>ID</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Budget</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Spend</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Revenue</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>ROAS</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Impressions</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Clicks</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CTR</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CPC</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CPA</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Start Date</th>
                  <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>End Date</th>
                </tr>
              </thead>
              <tbody className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
                {activeCampaigns.map((campaign, idx) => (
                  <tr
                    key={idx}
                    className={`border-b last:border-0 ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <td className={`p-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {campaign.campaign_name || 'Unnamed'}
                    </td>
                    <td className={`p-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {campaign.campaign_id || '--'}
                    </td>
                    <td className={`p-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency(campaign.budget || 0, countryCode)}
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
                    <td className={`p-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(campaign.start_date)}
                    </td>
                    <td className={`p-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(campaign.end_date)}
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

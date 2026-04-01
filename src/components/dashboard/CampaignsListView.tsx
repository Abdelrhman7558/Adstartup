import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, AlertCircle, FolderOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isManagerPlanUser } from '../../lib/managerPlanService';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  profit?: number;
  loss?: number;
  spend?: number;
  revenue?: number;
  date_start?: string;
  date_stop?: string;
  account_name?: string; // For Manager plan users
}

export default function CampaignsListView() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is Manager plan
  const isManager = isManagerPlanUser(user?.email);

  const fetchCampaigns = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://n8n.srv1181726.hstgr.cloud/webhook/All_Campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCampaign = async (campaignId: string) => {
    if (!user || !confirm('Are you sure you want to remove this campaign?')) return;

    try {
      setCampaigns(campaigns.filter(c => c.campaign_id !== campaignId));
    } catch (err) {
      console.error('Error removing campaign:', err);
      setError('Failed to remove campaign. Please try again.');
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Campaigns
          </h1>
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
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const profit = campaign.profit || (campaign.revenue && campaign.spend ? campaign.revenue - campaign.spend : 0);
              const isProfit = profit >= 0;

              return (
                <div
                  key={campaign.campaign_id}
                  className={`p-6 rounded-xl border ${theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {campaign.campaign_name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${campaign.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : campaign.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Campaign ID
                          </p>
                          <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                            {campaign.campaign_id}
                          </p>
                        </div>

                        {/* Account - Only for Manager plan */}
                        {isManager && (
                          <div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Account
                            </p>
                            <p className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                              {campaign.account_name || '--'}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Result
                          </p>
                          <p className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {isProfit ? 'Profit' : 'Loss'}: ${Math.abs(profit).toFixed(2)}
                          </p>
                        </div>

                        {campaign.date_start && (
                          <div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Start Date
                            </p>
                            <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                              {new Date(campaign.date_start).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {campaign.date_stop && (
                          <div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              End Date
                            </p>
                            <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                              {new Date(campaign.date_stop).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeCampaign(campaign.campaign_id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove Campaign"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

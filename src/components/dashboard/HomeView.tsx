import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UploadAssets from '../UploadAssets';
import MetaConnectionStatus from '../MetaConnectionStatus';

interface HomeViewProps {
  userId?: string;
  firstName: string;
  setMetaConnected: (connected: boolean) => void;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  roas?: number;
  impressions?: number;
}

export default function HomeView({ userId, setMetaConnected }: HomeViewProps) {
  const [topCampaigns, setTopCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchTopCampaigns = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            id,
            name,
            status,
            spend
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('spend', { ascending: false })
          .limit(4);

        if (error) throw error;

        const campaignsWithMetrics = await Promise.all(
          (data || []).map(async (campaign) => {
            const { data: perfData } = await supabase
              .from('ads_performance')
              .select('impressions, roas')
              .eq('campaign_id', campaign.id)
              .order('date', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...campaign,
              impressions: perfData?.impressions || 0,
              roas: perfData?.roas || 0
            };
          })
        );

        setTopCampaigns(campaignsWithMetrics);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCampaigns();
  }, [userId]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Credit Assessment
              </p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">4.4K</span>
                <span className="text-red-500 text-sm font-semibold mb-1">-0.4%</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Credit status remains strong</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Your score reflects strong financial stability.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance Summary
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Your financial score is 710, which means that you are a high-performing player.</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">+12.6%</span>
              </div>
            </div>
            <div className="relative h-24 flex items-end justify-between gap-1">
              {[65, 45, 55, 70, 60, 75, 50].map((height, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-sm" style={{ height: `${height}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Annual Portfolio Growth
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500">Jan 01, 2024 - Jul 31, 2024</p>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">$26,444.54</h3>
            <p className="text-sm text-green-600 dark:text-green-400">+7.4% +$12,546.44 this year</p>
          </div>
          <div className="flex items-end justify-between h-32 gap-2">
            {[15, 35, 45, 50, 45, 55, 65].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1">
                <div className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg" style={{ height: `${height}%` }}></div>
                <div className="w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded" style={{ height: `${height * 0.5}%` }}></div>
                <div className="w-full bg-gradient-to-t from-blue-200 to-blue-100 rounded" style={{ height: `${height * 0.3}%` }}></div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-500">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-black dark:bg-gray-800 dark:border dark:border-gray-700 rounded-2xl p-8 text-white relative overflow-hidden h-96">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          </div>
          <div className="relative flex flex-col items-center justify-center h-full gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-gray-600 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white"></div>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-center">Earn 5.0% APY</h3>
            <p className="text-center text-gray-400">On savings.</p>
            <button className="mt-4 px-6 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Campaigns
            </h3>
            <button className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">View All</button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading campaigns...</div>
            ) : topCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No active campaigns yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first campaign to get started</p>
              </div>
            ) : (
              topCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{campaign.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Spend: ${campaign.spend.toFixed(2)} · {campaign.impressions?.toLocaleString() || 0} views
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {campaign.roas && campaign.roas > 1 ? (
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-semibold ${campaign.roas && campaign.roas > 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {campaign.roas ? `${campaign.roas.toFixed(2)}x` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Portfolio Snapshot</h3>
            <button className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">...</button>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">$654k</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-500 flex items-center justify-center">
                    <span className="text-xs font-bold">64%</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Allocation Breakdown</span>
                </div>
                <span className="text-xs text-gray-400">...</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-green-500 flex items-center justify-center">
                    <span className="text-xs font-bold">36%</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Investment Growth Potential</span>
                </div>
                <span className="text-xs text-gray-400">...</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-red-500 flex items-center justify-center">
                    <span className="text-xs font-bold">48%</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risk Exposure Insights</span>
                </div>
                <span className="text-xs text-gray-400">...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Meta Marketing Features</h3>
          </div>
          <div className="space-y-4">
            <MetaConnectionStatus userId={userId} onStatusChange={setMetaConnected} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <UploadAssets />
      </div>
    </>
  );
}

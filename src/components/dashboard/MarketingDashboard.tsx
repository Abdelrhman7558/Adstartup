import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, Users, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { marketingDashboardService, MarketingCampaign, MarketingAd, SalesTrendData, DashboardInsights } from '../../lib/marketingDashboardService';

export default function MarketingDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [ads, setAds] = useState<MarketingAd[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [topCampaigns, setTopCampaigns] = useState<MarketingCampaign[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [campaignsData, adsData, trendData, insightsData, topData] = await Promise.all([
        marketingDashboardService.getCampaigns(user.id),
        marketingDashboardService.getAds(user.id),
        marketingDashboardService.getSalesTrend(user.id),
        marketingDashboardService.getInsights(user.id),
        marketingDashboardService.getTopCampaigns(user.id),
      ]);
      setCampaigns(campaignsData);
      setAds(adsData);
      setSalesTrend(trendData);
      setInsights(insightsData);
      setTopCampaigns(topData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon: Icon, unit = '' }: { label: string; value: number | string; icon: any; unit?: string }) => (
    <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {typeof value === 'number' ? value.toFixed(2) : value}
            {unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Summary Cards */}
      <div>
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights && (
            <>
              <StatCard label="Total Sales" value={insights.total_sales} icon={TrendingUp} unit="$" />
              <StatCard label="Total Spend" value={insights.total_spend} icon={DollarSign} unit="$" />
              <StatCard label="ROAS" value={insights.overall_roas} icon={Target} />
              <StatCard label="Avg CTR" value={insights.average_ctr} icon={Activity} unit="%" />
              <StatCard label="Total Clicks" value={insights.total_clicks} icon={Users} />
              <StatCard label="Total Impressions" value={insights.total_impressions} icon={Users} />
              <StatCard label="Conversion Rate" value={insights.conversion_rate} icon={Target} unit="%" />
            </>
          )}
        </div>
      </div>

      {/* Best & Worst Performing */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
            <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
              <TrendingUp className="w-5 h-5" /> Best Performing
            </h3>
            <p className={`mt-2 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {insights.best_performing_campaign || 'No campaigns'}
            </p>
          </div>
          <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
              <AlertCircle className="w-5 h-5" /> Worst Performing
            </h3>
            <p className={`mt-2 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {insights.worst_performing_campaign || 'No campaigns'}
            </p>
          </div>
        </div>
      )}

      {/* Top 5 Campaigns */}
      <div>
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top 5 Campaigns</h2>
        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Campaign Name</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Status</th>
                <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Spend</th>
                <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Revenue</th>
                <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>ROAS</th>
                <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Conversions</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((campaign) => (
                <tr key={campaign.campaign_id} className={`border-b last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{campaign.campaign_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.status === 'active'
                        ? theme === 'dark'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-green-100 text-green-700'
                        : campaign.status === 'paused'
                        ? theme === 'dark'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-yellow-100 text-yellow-700'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>${campaign.spend.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>${campaign.revenue.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-bold ${campaign.roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>{campaign.roas.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{campaign.conversion.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Trend Chart */}
      {salesTrend.length > 0 && (
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sales Trend</h2>
          <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-64 flex items-end gap-1 justify-between">
              {salesTrend.map((trend) => {
                const maxSales = Math.max(...salesTrend.map((t) => t.sales), 1);
                const height = (trend.sales / maxSales) * 100;
                return (
                  <div key={trend.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className={`w-full rounded-t-lg transition-colors ${
                      theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
                    }`} style={{ height: `${Math.max(height, 5)}%` }} title={`${trend.date}: $${trend.sales.toFixed(2)}`} />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All Campaigns</h2>
          <div className={`rounded-xl border overflow-x-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Campaign</th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Objective</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Impressions</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Clicks</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>CTR</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Spend</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Revenue</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.campaign_id} className={`border-b last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{campaign.campaign_name}</td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{campaign.objective || '-'}</td>
                    <td className={`px-6 py-4 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{campaign.impressions.toFixed(0)}</td>
                    <td className={`px-6 py-4 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{campaign.clicks.toFixed(0)}</td>
                    <td className={`px-6 py-4 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{campaign.ctr.toFixed(2)}%</td>
                    <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>${campaign.spend.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>${campaign.revenue.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${campaign.roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>{campaign.roas.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Ads */}
      {ads.length > 0 && (
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All Ads</h2>
          <div className={`rounded-xl border overflow-x-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Ad Name</th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Status</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Impressions</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Clicks</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>CTR</th>
                  <th className={`px-6 py-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Conversions</th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Creative Type</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.ad_id} className={`border-b last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ad.ad_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ad.status === 'active'
                          ? theme === 'dark'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-green-100 text-green-700'
                          : ad.status === 'paused'
                          ? theme === 'dark'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-yellow-100 text-yellow-700'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{ad.impressions.toFixed(0)}</td>
                    <td className={`px-6 py-4 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{ad.clicks.toFixed(0)}</td>
                    <td className={`px-6 py-4 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{ad.ctr.toFixed(2)}%</td>
                    <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{ad.conversion.toFixed(0)}</td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{ad.creative_type || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaigns.length === 0 && ads.length === 0 && (
        <div className={`text-center py-12 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No campaign data available yet. Start by creating your first campaign.</p>
        </div>
      )}
    </div>
  );
}

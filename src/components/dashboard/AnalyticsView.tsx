import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Eye, AlertTriangle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsViewProps {
  userId?: string;
}

interface PerformanceMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgROAS: number;
  avgCPA: number;
  avgCTR: number;
  avgCPM: number;
}

interface DailyMetric {
  date: string;
  spend: number;
  revenue: number;
  impressions: number;
  roas: number;
}

export default function AnalyticsView({ userId }: AnalyticsViewProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data: perfData, error } = await supabase
        .from('ads_performance')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;

      if (!perfData || perfData.length === 0) {
        setMetrics({
          totalSpend: 0,
          totalRevenue: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          avgROAS: 0,
          avgCPA: 0,
          avgCTR: 0,
          avgCPM: 0,
        });
        setDailyMetrics([]);
        return;
      }

      const totalSpend = perfData.reduce((sum, row) => sum + Number(row.spend || 0), 0);
      const totalRevenue = perfData.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
      const totalImpressions = perfData.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
      const totalClicks = perfData.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
      const totalConversions = perfData.reduce((sum, row) => sum + Number(row.conversions || 0), 0);

      const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

      setMetrics({
        totalSpend,
        totalRevenue,
        totalImpressions,
        totalClicks,
        totalConversions,
        avgROAS,
        avgCPA,
        avgCTR,
        avgCPM,
      });

      const dailyData = perfData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7)
        .map((row) => ({
          date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          spend: Number(row.spend || 0),
          revenue: Number(row.revenue || 0),
          impressions: Number(row.impressions || 0),
          roas: Number(row.roas || 0),
        }));

      setDailyMetrics(dailyData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!metrics || metrics.totalSpend === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Analytics Data</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              Start running ads and performance data will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxSpend = Math.max(...dailyMetrics.map((m) => m.spend), 1);
  const maxRevenue = Math.max(...dailyMetrics.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
        <button
          onClick={fetchAnalytics}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            {metrics.avgCTR > 2 && (
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                Healthy
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalImpressions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">CTR: {metrics.avgCTR.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            {metrics.avgROAS < 1 && (
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${metrics.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">ROAS: {metrics.avgROAS.toFixed(2)}x</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Conversions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalConversions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">CPA: ${metrics.avgCPA.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Spend</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${metrics.totalSpend.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">CPM: ${metrics.avgCPM.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Performance Trends</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spend vs Revenue</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                  Spend
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                  Revenue
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between h-40 gap-2">
              {dailyMetrics.map((metric, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-green-600 to-green-500 rounded-t"
                      style={{ height: `${(metric.revenue / maxRevenue) * 120}px` }}
                      title={`Revenue: $${metric.revenue.toFixed(2)}`}
                    ></div>
                    <div
                      className="w-full bg-gradient-to-t from-red-600 to-red-500 rounded-b"
                      style={{ height: `${(metric.spend / maxSpend) * 120}px` }}
                      title={`Spend: $${metric.spend.toFixed(2)}`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{metric.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {metrics.avgROAS < 1 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-1">
                Low ROAS Alert
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Your campaigns are spending more than they're earning. Consider optimizing your targeting, creative, or bidding strategy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

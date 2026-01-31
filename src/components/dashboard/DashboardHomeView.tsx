import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Eye, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SummaryMetrics {
  totalActiveAds: number;
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  profitLoss: number;
}

export default function DashboardHomeView() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalActiveAds: 0,
    totalSpend: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    profitLoss: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('active_ads')
        .select('profit, loss, impressions, spend, revenue')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        const totalActiveAds = data.length;
        const totalSpend = data.reduce((sum, ad) => sum + (parseFloat(ad.spend?.toString() || '0')), 0);
        const totalRevenue = data.reduce((sum, ad) => sum + (parseFloat(ad.revenue?.toString() || '0')), 0);
        const totalImpressions = data.reduce((sum, ad) => sum + (parseInt(ad.impressions?.toString() || '0')), 0);
        const profitLoss = totalRevenue - totalSpend;

        setMetrics({
          totalActiveAds,
          totalSpend,
          totalRevenue,
          totalImpressions,
          profitLoss
        });
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Active Ads',
      value: metrics.totalActiveAds,
      icon: Activity,
      color: 'blue'
    },
    {
      label: 'Total Spend',
      value: `$${metrics.totalSpend.toFixed(2)}`,
      icon: DollarSign,
      color: 'red'
    },
    {
      label: 'Total Revenue',
      value: `$${metrics.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Profit / Loss',
      value: `$${metrics.profitLoss.toFixed(2)}`,
      icon: metrics.profitLoss >= 0 ? TrendingUp : DollarSign,
      color: metrics.profitLoss >= 0 ? 'green' : 'red'
    },
    {
      label: 'Total Impressions',
      value: metrics.totalImpressions.toLocaleString(),
      icon: Eye,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-900 dark:text-blue-100',
        icon: 'text-blue-600 dark:text-blue-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-900 dark:text-red-100',
        icon: 'text-red-600 dark:text-red-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-900 dark:text-green-100',
        icon: 'text-green-600 dark:text-green-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-900 dark:text-purple-100',
        icon: 'text-purple-600 dark:text-purple-400'
      }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600 dark:text-slate-400">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Your campaign performance at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.bg} rounded-xl p-6 border border-slate-200 dark:border-slate-700`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {metrics.totalActiveAds === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
        >
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Active Ads Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Your ads will appear here once they're created and running.
          </p>
        </motion.div>
      )}
    </div>
  );
}
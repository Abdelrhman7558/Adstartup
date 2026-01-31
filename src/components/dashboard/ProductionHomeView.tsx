import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import SalesTrendChart from './SalesTrendChart';
import { DashboardData, DEFAULT_DASHBOARD_DATA, Campaign } from '../../lib/dataTransformer';
import { TrendingUp, DollarSign, Target, Zap, ChevronRight } from 'lucide-react';
import CampaignDetailsModal from './CampaignDetailsModal';
import { formatCurrency } from '../../lib/currencyUtils';

interface HomeViewProps {
  isMetaConnected: boolean;
  data: DashboardData | null;
  isLoading: boolean;
  onDataRefresh?: () => void;
}

interface KPICard {
  label: string;
  value: string;
  icon: React.ReactNode;
}

export default function ProductionHomeView({ data, isLoading, onDataRefresh }: HomeViewProps) {
  const { theme } = useTheme();
  const { countryCode } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const displayData = data || DEFAULT_DASHBOARD_DATA;
  const campaigns = Array.isArray(displayData.top_5_campaigns) ? displayData.top_5_campaigns : [];
  const recentCampaigns = Array.isArray(displayData.recent_campaigns) ? displayData.recent_campaigns : [];
  const salesTrend = Array.isArray(displayData.sales_trend) ? displayData.sales_trend : [];

  const formatValue = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '--';
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num) && (value.includes('$') || !isNaN(Number(value)))) {
        return formatCurrency(num, countryCode);
      }
      return value;
    }
    if (typeof value === 'number') {
      return formatCurrency(value, countryCode);
    }
    return '--';
  };

  // Helper to get value from summary_cards or legacy fields
  const getMetricValue = (labels: string[], legacyValue?: string | number) => {
    if (displayData.insights?.summary_cards) {
      for (const label of labels) {
        const card = displayData.insights.summary_cards.find(c => c.label.toLowerCase() === label.toLowerCase());
        if (card) {
          // Try to parse card value to currency if it looks like money or just a number
          const valStr = card.value.replace(/[^0-9.-]+/g, "");
          const valNum = parseFloat(valStr);
          // If the label implies money, format it
          if (['Total Sales', 'Total Revenue', 'Total Spend', 'Spend', 'Ad Spend'].includes(card.label) && !isNaN(valNum)) {
            return formatCurrency(valNum, countryCode);
          }
          return card.value;
        }
      }
    }

    // Fallback legacy value formatting
    // Special handling for legacy metric names to ensure currency formatting
    const isMonetary = labels.some(l => ['Total Sales', 'Total Spend'].some(k => l.includes(k)));
    if (isMonetary && legacyValue !== undefined) {
      return formatCurrency(legacyValue, countryCode);
    }

    return formatValue(legacyValue);
  };

  const kpiCards: KPICard[] = [
    {
      label: 'Total Sales',
      value: getMetricValue(['Total Sales', 'Total Revenue', 'Sales', 'Revenue'], displayData.insights?.total_sales),
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    },
    {
      label: 'Total Spend',
      value: getMetricValue(['Total Spend', 'Spend', 'Ad Spend'], displayData.insights?.total_spend),
      icon: <DollarSign className="w-5 h-5 text-green-500" />,
    },
    {
      label: 'ROAS',
      value: getMetricValue(['ROAS', 'Return on Ad Spend', 'ROI'], displayData.insights?.roas),
      icon: <Target className="w-5 h-5 text-purple-500" />,
    },
    {
      label: 'Conversion Rate',
      value: getMetricValue(['Conversion Rate', 'CR', 'Conv. Rate'], displayData.insights?.conversion_rate),
      icon: <Zap className="w-5 h-5 text-orange-500" />,
    },
  ];

  const renderKPICard = (card: KPICard, index: number) => (
    <div
      key={index}
      className={`p-6 rounded-xl border transition-all ${theme === 'dark'
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
        : 'bg-white border-gray-200 hover:border-gray-300'
        } shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {card.label}
        </h3>
        <div className="p-2 rounded-lg bg-opacity-10" style={{
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }}>
          {card.icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {card.value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 w-full">
      {/* KPI Cards Grid - Always Render */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {kpiCards.map((card, index) => renderKPICard(card, index))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Sales Trend Chart - Left (2 cols) */}
        <div
          className={`lg:col-span-2 p-6 rounded-xl border ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Sales Trend
            </h2>
            {isLoading && (
              <div className="w-4 h-4 rounded-full animate-spin border-2 border-blue-500 border-t-transparent"></div>
            )}
          </div>
          <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLoading ? (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading chart...
              </p>
            ) : salesTrend.length > 0 ? (
              <SalesTrendChart data={salesTrend} />
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                No data yet
              </p>
            )}
          </div>
        </div>

        {/* Top 5 Campaigns Summary - Right */}
        <div
          className={`p-6 rounded-xl border ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            } shadow-sm flex flex-col`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Top 5 Campaigns
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {campaigns.slice(0, 5).length > 0 ? (
              campaigns.slice(0, 5).map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className={`w-full text-left p-4 rounded-lg border transition-all group ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                    : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-blue-200 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        {campaign.name || 'Unnamed Campaign'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                          ROAS: {campaign.roas}x
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          ID: {campaign.id ? campaign.id.slice(-6) : '--'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${theme === 'dark' ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-blue-500'
                      }`} />
                  </div>
                </button>
              ))
            ) : (
              <p className={`text-sm text-center py-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                No top campaigns found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Campaigns Card */}
      <div
        className={`p-6 rounded-xl border ${theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
          } shadow-sm`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Recent Campaigns
        </h2>
        {recentCampaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Name</th>
                  <th className={`text-left py-3 px-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>ID</th>
                  <th className={`text-left py-3 px-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Status</th>
                  <th className={`text-left py-3 px-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Result</th>
                  <th className={`text-left py-3 px-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Start Date</th>
                  <th className={`text-left py-3 px-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((campaign) => {
                  const profit = campaign.revenue && campaign.spend ? campaign.revenue - campaign.spend : 0;
                  const isProfit = profit >= 0;

                  return (
                    <tr
                      key={campaign.id}
                      className={`border-b ${theme === 'dark'
                        ? 'border-gray-700 hover:bg-gray-700/50'
                        : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {campaign.name || '--'}
                      </td>
                      <td className={`py-3 px-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {campaign.id || '--'}
                      </td>
                      <td className={`py-3 px-4`}>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${campaign.status === 'active' || campaign.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : campaign.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                          {campaign.status || '--'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {isProfit ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(profit), countryCode)}
                      </td>
                      <td className={`py-3 px-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {campaign.date_start ? new Date(campaign.date_start).toLocaleDateString() : '--'}
                      </td>
                      <td className={`py-3 px-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {campaign.date_stop ? new Date(campaign.date_stop).toLocaleDateString() : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            No campaigns yet
          </p>
        )}
      </div>

      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

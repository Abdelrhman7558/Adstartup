import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { DashboardData } from '../../lib/dashboardDataService';

interface InsightsViewProps {
  data: DashboardData | null;
  isLoading: boolean;
}

export default function InsightsView({ data, isLoading }: InsightsViewProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 animate-spin">
            <div className={`w-12 h-12 border-4 border-transparent rounded-full ${theme === 'dark' ? 'border-t-blue-500' : 'border-t-blue-600'
              }`}></div>
          </div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading insights...
          </p>
        </div>
      </div>
    );
  }

  const insights = data?.insights;

  // Fallback defaults if no data
  const summaryCards = insights?.summary_cards || [];
  const activityGrid = insights?.activity_grid || [];
  const campaignPerformance = insights?.campaign_performance || [];
  const weeklyTrend = insights?.weekly_trend || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Insights Overview
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Deep dive into your ad performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex justify-between items-start mb-4">
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {card.label}
              </p>
              <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${card.trend_direction === 'up'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {card.trend_direction === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {card.trend}
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Grid (Heatmap style) */}
        <div className={`col-span-1 lg:col-span-2 p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Activity Heatmap
              </h3>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              Last 60 Days
            </span>
          </div>

          <div className="grid grid-cols-10 gap-2">
            {activityGrid.length > 0 ? activityGrid.map((day, idx) => (
              <div key={idx} className="group relative">
                <div
                  className={`w-full pt-[100%] rounded-md transition-all ${day.count === 0 ? (theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100') :
                      day.count < 3 ? 'bg-blue-200 dark:bg-blue-900/40' :
                        day.count < 6 ? 'bg-blue-400 dark:bg-blue-700' :
                          'bg-blue-600 dark:bg-blue-500'
                    }`}
                ></div>
                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10`}>
                  {day.date}: {day.count} activities
                </div>
              </div>
            )) : (
              <p className={`col-span-10 text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No activity data available</p>
            )}
          </div>
        </div>

        {/* Weekly Trend (Bar Chart Placeholder) */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Weekly Trend
            </h3>
          </div>

          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyTrend.length > 0 ? weeklyTrend.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="w-full relative flex-1 flex items-end bg-gray-100 dark:bg-gray-700/50 rounded-t-lg overflow-hidden">
                  <div
                    className="w-full bg-purple-500 transition-all duration-500 group-hover:bg-purple-400"
                    style={{ height: `${Math.min(day.value, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {day.day}
                </span>
              </div>
            )) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No trend data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Performance List */}
      <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Top Performing Campaigns
            </h3>
          </div>
        </div>

        <div className="space-y-6">
          {campaignPerformance.length > 0 ? campaignPerformance.map((campaign, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.name}
                  </h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {campaign.metric}: <span className="font-mono">{campaign.value}</span>
                  </p>
                </div>
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  {campaign.progress}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${campaign.progress}%`,
                    backgroundColor: campaign.color || '#3b82f6'
                  }}
                ></div>
              </div>
            </div>
          )) : (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              No campaign performance data found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

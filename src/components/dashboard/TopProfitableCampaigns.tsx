import { useTheme } from '../../contexts/ThemeContext';
import { TrendingUp, Loader, DollarSign } from 'lucide-react';
import { Campaign } from '../../lib/dataTransformer';
import { isManagerPlanUser } from '../../lib/managerPlanService';

interface TopProfitableCampaignsProps {
  campaigns?: Campaign[];
  isLoading?: boolean;
  userEmail?: string; // For Manager plan check
}

export default function TopProfitableCampaigns({ campaigns = [], isLoading = false, userEmail }: TopProfitableCampaignsProps) {
  const { theme } = useTheme();

  // Check if user is Manager plan
  const isManager = isManagerPlanUser(userEmail);

  const topCampaigns = campaigns.slice(0, 5);

  const maxProfit = topCampaigns.length > 0
    ? Math.max(...topCampaigns.map(c => {
      const revenue = typeof c.revenue === 'number' ? c.revenue : 0;
      const spend = typeof c.spend === 'number' ? c.spend : 0;
      const profit = revenue - spend;
      return profit;
    }))
    : 1;

  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
            Top 5 Profitable Campaigns
          </h3>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            Best performing campaigns by profit
          </p>
        </div>
        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Campaigns List */}
      {topCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            No campaigns yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topCampaigns.map((campaign, index) => {
            const revenue = typeof campaign.revenue === 'number' ? campaign.revenue : 0;
            const spend = typeof campaign.spend === 'number' ? campaign.spend : 0;
            const profit = revenue - spend;
            const profitPercentage = (profit / maxProfit) * 100;
            const roas = typeof campaign.roas === 'number' ? campaign.roas : 0;

            return (
              <div
                key={campaign.id}
                className={`p-4 rounded-lg transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0
                      ? 'bg-yellow-500 text-white'
                      : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                          ? 'bg-orange-600 text-white'
                          : theme === 'dark'
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                      }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        {campaign.name === "-" ? "Untitled Campaign" : campaign.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        {/* Account - Only for Manager plan */}
                        {isManager && (campaign as any).account_name && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                            Account: {(campaign as any).account_name}
                          </span>
                        )}
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          ROAS: {roas === 0 ? "-" : `${roas.toFixed(2)}x`}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          Spend: {spend === 0 ? "-" : `$${spend.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className={`font-bold text-lg ${profit > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {profit.toLocaleString()}
                      </span>
                    </div>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      profit
                    </span>
                  </div>
                </div>

                {/* Profit bar */}
                <div className={`h-2 rounded-full overflow-hidden mt-3 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${index === 0
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : index === 1
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                    style={{ width: `${Math.max(profitPercentage, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer stats */}
      {topCampaigns.length > 0 && (
        <div className={`mt-6 pt-4 border-t grid grid-cols-2 gap-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Total Profit
            </p>
            <p className={`text-lg font-bold text-green-600 mt-1`}>
              ${topCampaigns.reduce((sum, c) => {
                const revenue = c.revenue || 0;
                const spend = c.spend || 0;
                return sum + (revenue - spend);
              }, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Avg ROAS
            </p>
            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              } mt-1`}>
              {(topCampaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / topCampaigns.length).toFixed(2)}x
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

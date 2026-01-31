import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader, AlertCircle, RefreshCw, Search, Filter, Image as ImageIcon, Trash2 } from 'lucide-react';
import { fetchAllAds } from '../../lib/n8nWebhookService';
import { Ad } from '../../lib/dataTransformer';

export default function AdsView() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAds = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllAds(user.id);

      const mappedAds: Ad[] = Array.isArray(data) ? data.map((ad: any) => ({
        id: ad.ad_id || ad.id || '',
        name: ad.ad_name || ad.name || 'Unnamed Ad',
        status: ad.status || 'unknown',
        image_url: ad.ad_image || ad.image_url || ad.image,
        impressions: Number(ad.impressions || 0),
        clicks: Number(ad.clicks || 0),
        spend: Number(ad.spend || 0),
        ctr: Number(ad.ctr || 0),
        cpc: Number(ad.cpc || 0),
        cpr: Number(ad.cpr || ad.cost_per_result || 0),
      })) : [];

      setAds(mappedAds);
    } catch (err) {
      console.error('Error loading ads:', err);
      setError('Failed to load ads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAds();
    }
  }, [user]);

  const totalProfit = 0; // Calculated fields if needed, but not in webhook data
  const totalLoss = 0;
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalSpend = ads.reduce((sum, ad) => sum + ad.spend, 0);
  const totalRevenue = 0; // Not sending revenue for ads yet

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ads Manager
          </h1>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor performance across all your active creatives
          </p>
        </div>
        <button
          onClick={loadAds}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark'
            ? 'bg-gray-800 hover:bg-gray-700 text-white'
            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Main Table Card */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader className={`w-8 h-8 animate-spin mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Fetching your ads...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className={`p-4 rounded-full bg-red-100 dark:bg-red-900/20 w-fit mx-auto mb-4`}>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className={`text-red-500 mb-2`}>{error}</p>
            <button onClick={loadAds} className="text-sm underline text-red-500">Try Again</button>
          </div>
        ) : ads.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''}`}>No ads found coming from your webhook.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <th className={`p-4 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Ad Details</th>
                  <th className={`p-4 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`p-4 text-xs font-semibold uppercase tracking-wider text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Inc. Amount</th>
                  <th className={`p-4 text-xs font-semibold uppercase tracking-wider text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Results</th>
                  <th className={`p-4 text-xs font-semibold uppercase tracking-wider text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CPR</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {ads.map((ad) => (
                  <tr key={ad.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    {/* Ad Details: Image + Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                          }`}>
                          {ad.image_url ? (
                            <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate max-w-[200px] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {ad.name}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            ID: {ad.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ad.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : ad.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                        {ad.status}
                      </span>
                    </td>

                    {/* Spent (Inc. Amount) */}
                    <td className="p-4 text-right">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ${ad.spend.toLocaleString()}
                      </p>
                    </td>

                    {/* Results / Clicks */}
                    <td className="p-4 text-right">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {ad.clicks.toLocaleString()} <span className="text-xs font-normal text-gray-500">Clicks</span>
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {ad.impressions.toLocaleString()} Imp.
                      </p>
                    </td>

                    {/* CPR (Cost per Result) */}
                    <td className="p-4 text-right">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ${ad.cpr?.toFixed(2) || '0.00'}
                      </p>
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

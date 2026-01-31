import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Ad {
  id: string;
  ad_name: string;
  profit: number;
  loss: number;
  impressions: number;
  spend: number;
  revenue: number;
}

export default function DashboardAdsView() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKillAllModal, setShowKillAllModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('active_ads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(data || []);
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAd = async (adId: string) => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('active_ads')
        .delete()
        .eq('id', adId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (err) {
      console.error('Error removing ad:', err);
      alert('Failed to remove ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKillAllAds = async () => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('active_ads')
        .delete()
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      setAds([]);
      setShowKillAllModal(false);
    } catch (err) {
      console.error('Error killing all ads:', err);
      alert('Failed to remove all ads');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ads Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage all your active advertising campaigns
          </p>
        </div>

        {ads.length > 0 && (
          <button
            onClick={() => setShowKillAllModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Kill All Ads
          </button>
        )}
      </div>

      {ads.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Active Ads
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            You don't have any active ads at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Ad Name
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Spend
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Impressions
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <AnimatePresence>
                  {ads.map((ad) => {
                    const profitLoss = (ad.revenue || 0) - (ad.spend || 0);
                    const isProfitable = profitLoss >= 0;

                    return (
                      <motion.tr
                        key={ad.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          {ad.ad_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
                          ${(ad.spend || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
                          ${(ad.revenue || 0).toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-semibold ${
                          isProfitable
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isProfitable ? '+' : ''}${profitLoss.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
                          {(ad.impressions || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoveAd(ad.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showKillAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !actionLoading && setShowKillAllModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Kill All Ads?
                </h3>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                This will remove all {ads.length} active ad{ads.length !== 1 ? 's' : ''} from your account. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowKillAllModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKillAllAds}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Kill All'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Pause, Play } from 'lucide-react';
import { Ad } from '../../lib/supabase';

type SortColumn = 'name' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface AdsManagementTableProps {
  ads: Ad[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onAction: (adId: string, action: 'kill' | 'remove' | 'pause' | 'activate') => Promise<void>;
  onKillAll: () => Promise<void>;
}

export default function AdsManagementTable({
  ads,
  loading,
  onRefresh,
  onAction,
  onKillAll,
}: AdsManagementTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<Map<string, boolean>>(new Map());
  const [killAllInProgress, setKillAllInProgress] = useState(false);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAds = [...ads].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = () => {
    if (selectedAds.size === ads.length) {
      setSelectedAds(new Set());
    } else {
      setSelectedAds(new Set(ads.map((ad) => ad.id)));
    }
  };

  const handleSelectAd = (adId: string) => {
    const newSelected = new Set(selectedAds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedAds(newSelected);
  };

  const handleAction = async (adId: string, action: 'kill' | 'remove' | 'pause' | 'activate') => {
    setActionInProgress((prev) => new Map(prev).set(adId, true));
    try {
      await onAction(adId, action);
    } finally {
      setActionInProgress((prev) => {
        const copy = new Map(prev);
        copy.delete(adId);
        return copy;
      });
    }
  };

  const handleKillAll = async () => {
    setKillAllInProgress(true);
    try {
      await onKillAll();
      setSelectedAds(new Set());
    } finally {
      setKillAllInProgress(false);
    }
  };

  const getStatusColor = (status: Ad['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-600/20 text-green-400 border-green-700';
      case 'paused':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-700';
      case 'disabled':
        return 'bg-red-600/20 text-red-400 border-red-700';
      case 'deleted':
        return 'bg-gray-600/20 text-gray-400 border-gray-700';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-700';
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ChevronUp size={16} className="text-gray-600" />;
    return sortDirection === 'asc' ? (
      <ChevronUp size={16} className="text-blue-400" />
    ) : (
      <ChevronDown size={16} className="text-blue-400" />
    );
  };

  if (ads.length === 0 && !loading) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-12 text-center">
        <p className="text-gray-400">No ads found. Connect Meta to manage your ads.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kill All Ads Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        <button
          onClick={handleKillAll}
          disabled={killAllInProgress || ads.length === 0}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {killAllInProgress ? 'Killing...' : 'Kill All Ads'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAds.size === ads.length && ads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left font-medium text-gray-400 hover:text-gray-300"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  <span>Ad Name</span>
                  <SortIcon column="name" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left font-medium text-gray-400 hover:text-gray-300"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  <span>Start Date</span>
                  <SortIcon column="created_at" />
                </div>
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-400">Revenue</th>
              <th className="px-6 py-3 text-left font-medium text-gray-400">Views</th>
              <th
                className="cursor-pointer px-6 py-3 text-left font-medium text-gray-400 hover:text-gray-300"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  <SortIcon column="status" />
                </div>
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAds.map((ad) => {
              const isSelected = selectedAds.has(ad.id);
              const isProcessing = actionInProgress.get(ad.id);

              return (
                <tr
                  key={ad.id}
                  className={`border-b border-gray-700 transition ${isSelected ? 'bg-blue-600/10' : 'hover:bg-gray-800/50'}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectAd(ad.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{ad.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(ad.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {ad.metadata?.revenue || '$0'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {ad.metadata?.views || '0'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusColor(ad.status)}`}
                    >
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {ad.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleAction(ad.id, 'pause')}
                            disabled={isProcessing}
                            className="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-yellow-400 disabled:opacity-50"
                            title="Pause ad"
                          >
                            <Pause size={16} />
                          </button>
                          <button
                            onClick={() => handleAction(ad.id, 'kill')}
                            disabled={isProcessing}
                            className="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-red-400 disabled:opacity-50"
                            title="Kill ad"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      {ad.status === 'paused' && (
                        <button
                          onClick={() => handleAction(ad.id, 'activate')}
                          disabled={isProcessing}
                          className="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-green-400 disabled:opacity-50"
                          title="Activate ad"
                        >
                          <Play size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-blue-600"></div>
          <p className="mt-2 text-sm text-gray-400">Loading ads...</p>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500">
        Showing {sortedAds.length} of {ads.length} ads
        {selectedAds.size > 0 && ` • ${selectedAds.size} selected`}
      </div>
    </div>
  );
}

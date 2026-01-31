import { AlertCircle, Loader2 } from 'lucide-react';
import { Ad } from '../../lib/supabase';

type ActionType = 'kill' | 'remove' | 'pause' | 'activate' | 'kill-all';

interface AdActionModalProps {
  isOpen: boolean;
  ad?: Ad;
  actionType: ActionType;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function AdActionModal({
  isOpen,
  ad,
  actionType,
  onConfirm,
  onCancel,
  loading = false,
  error = null,
}: AdActionModalProps) {
  if (!isOpen) return null;

  const getActionDetails = () => {
    switch (actionType) {
      case 'kill':
        return {
          title: 'Kill Ad',
          description: `Are you sure you want to kill "${ad?.name}"? This will permanently remove the ad and send a webhook notification.`,
          confirmText: 'Kill Ad',
          dangerLevel: 'high',
        };
      case 'remove':
        return {
          title: 'Remove Ad',
          description: `Are you sure you want to remove "${ad?.name}"? This action cannot be undone.`,
          confirmText: 'Remove Ad',
          dangerLevel: 'high',
        };
      case 'pause':
        return {
          title: 'Pause Ad',
          description: `Are you sure you want to pause "${ad?.name}"? You can activate it again later.`,
          confirmText: 'Pause Ad',
          dangerLevel: 'medium',
        };
      case 'activate':
        return {
          title: 'Activate Ad',
          description: `Are you sure you want to activate "${ad?.name}"?`,
          confirmText: 'Activate Ad',
          dangerLevel: 'low',
        };
      case 'kill-all':
        return {
          title: 'Kill All Ads',
          description: 'Are you sure you want to kill all active ads? This will permanently remove them and send a webhook notification.',
          confirmText: 'Kill All Ads',
          dangerLevel: 'critical',
        };
      default:
        return {
          title: 'Confirm Action',
          description: 'Confirm this action?',
          confirmText: 'Confirm',
          dangerLevel: 'medium',
        };
    }
  };

  const details = getActionDetails();

  const getButtonColor = () => {
    switch (details.dangerLevel) {
      case 'critical':
      case 'high':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-600';
      case 'medium':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600';
      case 'low':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-600';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-yellow-600/20 p-3">
            <AlertCircle className="text-yellow-400" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{details.title}</h2>
            <p className="mt-2 text-sm text-gray-400">{details.description}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-600/20 border border-red-700 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 font-medium text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 ${getButtonColor()}`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Processing...' : details.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

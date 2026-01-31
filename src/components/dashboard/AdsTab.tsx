import { useEffect, useState } from 'react';
import { Ad } from '../../lib/supabase';
import { fetchAds, killAllAds, triggerAdAction, AdActionType } from '../../lib/adManagement';
import {
  triggerKillAllAdsWebhook,
  triggerRemoveAdWebhook,
} from '../../lib/webhookManager';
import AdsManagementTable from './AdsManagementTable';
import AdActionModal from './AdActionModal';

interface AdsTabProps {
  userId: string;
  userEmail: string;
}

type ModalActionType = 'kill' | 'remove' | 'pause' | 'activate' | 'kill-all';

export default function AdsTab({ userId, userEmail }: AdsTabProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ModalActionType | null>(null);
  const [modalAd, setModalAd] = useState<Ad | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadAds();
  }, [userId]);

  const loadAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAds(userId);
      setAds(data);
    } catch (err) {
      console.error('[AdsTab] Error loading ads:', err);
      setError('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAds();
    setSuccess('Ads refreshed');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAction = async (adId: string, action: AdActionType) => {
    const ad = ads.find((a) => a.id === adId);
    if (!ad) return;

    setModalAd(ad);
    setModalAction(action);
    setModalOpen(true);
    setModalError(null);
  };

  const handleKillAll = async () => {
    setModalAction('kill-all');
    setModalOpen(true);
    setModalError(null);
  };

  const executeModalAction = async () => {
    if (!modalAction) return;

    setModalLoading(true);
    setModalError(null);

    try {
      if (modalAction === 'kill-all') {
        const activeAds = ads.filter((a) => a.status === 'active');
        await killAllAds(userId);
        await triggerKillAllAdsWebhook(
          userId,
          activeAds.map((a) => a.name),
          userEmail
        );
        setSuccess(`Killed ${activeAds.length} ads`);
        await loadAds();
      } else if (modalAd) {
        await triggerAdAction(userId, modalAd.id, modalAction);

        if (modalAction === 'kill' || modalAction === 'remove') {
          await triggerRemoveAdWebhook(userId, modalAd.name, userEmail);
        }

        setSuccess(`Ad ${modalAction}ed successfully`);
        await loadAds();
      }

      setModalOpen(false);
      setModalAd(null);
      setModalAction(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Action failed';
      console.error('[AdsTab] Error executing action:', err);
      setModalError(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-700 bg-red-600/20 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-700 bg-green-600/20 px-4 py-3">
          <p className="text-sm text-green-300">{success}</p>
        </div>
      )}

      {/* Ads Table */}
      <AdsManagementTable
        ads={ads}
        loading={loading}
        onRefresh={handleRefresh}
        onAction={handleAction}
        onKillAll={handleKillAll}
      />

      {/* Action Modal */}
      <AdActionModal
        isOpen={modalOpen}
        ad={modalAd || undefined}
        actionType={modalAction || 'kill'}
        onConfirm={executeModalAction}
        onCancel={() => {
          setModalOpen(false);
          setModalAd(null);
          setModalAction(null);
          setModalError(null);
        }}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  );
}

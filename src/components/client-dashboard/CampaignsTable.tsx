import React, { useState, useEffect } from 'react';
import { MarketingCampaign } from '../../lib/marketingDashboardService';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, Info } from 'lucide-react';
import { botControlService } from '../../lib/botControlService';
import CampaignDetailsModal from '../dashboard/CampaignDetailsModal';
import { Campaign } from '../../lib/dataTransformer';
import { fetchDashboardData } from '../../lib/dashboardDataService';

interface CampaignsTableProps {
    onActionCompleted?: (action: string, metadata?: any) => void;
}

export function CampaignsTable({ onActionCompleted }: CampaignsTableProps) {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);

    useEffect(() => {
        if (user) {
            loadCampaigns();
        }
    }, [user]);

    // Helper to get/set optimization preferences from localStorage
    const getOptimizationPrefs = (): Record<string, boolean> => {
        try {
            const key = `optimization_prefs_${user?.id}`;
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch { return {}; }
    };

    const saveOptimizationPrefs = (prefs: Record<string, boolean>) => {
        try {
            const key = `optimization_prefs_${user?.id}`;
            localStorage.setItem(key, JSON.stringify(prefs));
        } catch (e) { console.error('Failed to save optimization prefs:', e); }
    };

    const loadCampaigns = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch live campaigns from webhook source
            const liveData = await fetchDashboardData(user.id);
            const liveCampaigns = [...(liveData.top_5_campaigns || []), ...(liveData.recent_campaigns || [])];

            const mergedMap = new Map<string, MarketingCampaign>();

            // Add live campaigns
            liveCampaigns.forEach((liveC: any) => {
                 const mappedId = liveC.id || liveC.campaign_id;
                 if(!mappedId) return;
                 mergedMap.set(String(mappedId), {
                      campaign_id: String(mappedId),
                      campaign_name: liveC.name || liveC.campaign_name || 'Unnamed',
                      status: liveC.status || 'active',
                      spend: liveC.spend || 0,
                      revenue: liveC.revenue || 0,
                      roas: liveC.roas || 0,
                      impressions: liveC.impressions || 0,
                      clicks: liveC.clicks || 0,
                      ctr: liveC.ctr || 0,
                      conversion: 0,
                      frequency: liveC.frequency,
                      cpm: liveC.cpm,
                      landing_page_views: liveC.landing_page_views,
                      cost_per_lpv: liveC.cost_per_lpv,
                      content_view_cost: liveC.content_view_cost,
                      content_view_value: liveC.content_view_value,
                      add_to_cart_cost: liveC.add_to_cart_cost,
                      add_to_cart_value: liveC.add_to_cart_value,
                      checkout_cost: liveC.checkout_cost,
                      checkout_value: liveC.checkout_value,
                      date_start: liveC.date_start || liveC.start_time,
                      date_stop: liveC.date_stop || liveC.end_time,
                      optimization_enabled: false,
                      account_name: liveC.account_name,
                      ad_account_id: liveC.ad_account_id
                 } as MarketingCampaign);
            });

            // Apply saved optimization preferences from localStorage
            const savedPrefs = getOptimizationPrefs();
            mergedMap.forEach((campaign, id) => {
                if (id in savedPrefs) {
                    campaign.optimization_enabled = savedPrefs[id];
                }
            });

            setCampaigns(Array.from(mergedMap.values()));
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOptimization = async (campaignId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        const newStatus = !currentStatus;

        // Optimistic UI Update
        setCampaigns(prev => prev.map(c => c.campaign_id === campaignId ? { ...c, optimization_enabled: newStatus } : c));

        // Persist to DB via botControlService
        botControlService.toggleOptimization(user.id, campaignId, newStatus).catch(err => {
            console.error('[CampaignsTable] Failed to sync toggle to DB:', err);
        });

        // Still keep localStorage for immediate UX if needed, though DB is source of truth now
        const prefs = getOptimizationPrefs();
        prefs[campaignId] = newStatus;
        saveOptimizationPrefs(prefs);

        if (onActionCompleted) {
            const actionTitle = newStatus ? "Enabled Optimization" : "Disabled Optimization";
            onActionCompleted(actionTitle, { campaignId });
        }
    };

    const handleToggleAll = async () => {
        if (!user) return;
        const anyDisabled = campaigns.some(c => !c.optimization_enabled);
        const targetStatus = anyDisabled;

        // Optimistic UI Update
        setCampaigns(prev => prev.map(c => ({ ...c, optimization_enabled: targetStatus })));

        // Persist all to DB
        Promise.all(campaigns.map(c => botControlService.toggleOptimization(user.id, c.campaign_id, targetStatus)))
            .catch(err => console.error('[CampaignsTable] Failed to sync all toggles to DB:', err));

        // Persist all to localStorage
        const prefs = getOptimizationPrefs();
        campaigns.forEach(c => { prefs[c.campaign_id] = targetStatus; });
        saveOptimizationPrefs(prefs);

        if (onActionCompleted) {
            const actionTitle = targetStatus ? "Enabled Optimization for All Campaigns" : "Disabled Optimization for All Campaigns";
            onActionCompleted(actionTitle, { count: campaigns.length });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500">No campaigns found. Start by creating one.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Optimization & Scaling</h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Automatically balance daily budgets, duplicate winning adsets, and stop losing ones.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleToggleAll}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Enable All Optimization
                </button>
            </div>
            
            <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm w-full custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1100px]">
                    <thead className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-4">ID</th>
                            <th className="px-4 py-4 w-full">Name</th>
                            <th className="px-4 py-4">Ad Account</th>
                            <th className="px-4 py-4 text-right">Daily Budget</th>
                            <th className="px-4 py-4 text-center">Start Time</th>
                            <th className="px-4 py-4 text-center">End Time</th>
                            <th className="px-4 py-4 text-center">ROAS</th>
                            <th className="px-4 py-4 text-center">Freq</th>
                            <th className="px-4 py-4 text-center">CPM</th>
                            <th className="px-4 py-4 text-center">LPV</th>
                            <th className="px-4 py-4 text-center">Cost/LPV</th>
                            <th className="px-4 py-4 text-center">Optimize</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {campaigns.map((campaign) => (
                            <tr 
                                key={campaign.campaign_id} 
                                onClick={() => setSelectedCampaign(campaign)}
                                className="hover:bg-red-50/40 transition-colors cursor-pointer group"
                            >
                                <td className="px-4 py-4 text-sm font-medium text-gray-500 font-mono">
                                    {campaign.campaign_id.slice(-6)}
                                </td>
                                <td className="px-4 py-4 text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors max-w-[200px] truncate">
                                    {campaign.campaign_name}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                                        {campaign.account_name || 'Primary'}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-700 text-right font-semibold">
                                    ${(campaign.spend || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 font-medium text-center">
                                    {campaign.date_start ? new Date(campaign.date_start).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 font-medium text-center">
                                    {campaign.date_stop ? new Date(campaign.date_stop).toLocaleDateString() : 'Ongoing'}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        campaign.roas >= 2 ? 'bg-green-100 text-green-700' : 
                                        campaign.roas > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {campaign.roas.toFixed(2)}x
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 font-medium text-center">
                                    {campaign.frequency?.toFixed(2) || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 font-medium text-center">
                                    ${campaign.cpm?.toFixed(2) || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 font-medium text-center">
                                    {campaign.landing_page_views || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 font-medium text-center">
                                    ${campaign.cost_per_lpv?.toFixed(2) || '—'}
                                </td>
                                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={(e) => handleToggleOptimization(campaign.campaign_id, !!campaign.optimization_enabled, e)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                            campaign.optimization_enabled ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                            campaign.optimization_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedCampaign && (
                <CampaignDetailsModal 
                    campaign={{
                        id: selectedCampaign.campaign_id,
                        name: selectedCampaign.campaign_name,
                        status: selectedCampaign.status,
                        spend: selectedCampaign.spend,
                        revenue: selectedCampaign.revenue,
                        roas: selectedCampaign.roas,
                        impressions: selectedCampaign.impressions,
                        clicks: selectedCampaign.clicks,
                        ctr: selectedCampaign.ctr,
                        cpc: undefined,
                        cpa: undefined,
                        frequency: selectedCampaign.frequency,
                        cpm: selectedCampaign.cpm,
                        landing_page_views: selectedCampaign.landing_page_views,
                        cost_per_lpv: selectedCampaign.cost_per_lpv,
                        content_view_cost: selectedCampaign.content_view_cost,
                        content_view_value: selectedCampaign.content_view_value,
                        add_to_cart_cost: selectedCampaign.add_to_cart_cost,
                        add_to_cart_value: selectedCampaign.add_to_cart_value,
                        checkout_cost: selectedCampaign.checkout_cost,
                        checkout_value: selectedCampaign.checkout_value,
                        date_start: selectedCampaign.date_start,
                        date_stop: selectedCampaign.date_stop,
                    } as Campaign} 
                    onClose={() => setSelectedCampaign(null)} 
                />
            )}
        </div>
    );
}

export default CampaignsTable;

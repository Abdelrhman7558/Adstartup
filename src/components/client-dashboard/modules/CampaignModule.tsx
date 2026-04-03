
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus } from 'lucide-react';
import CampaignsTable from '../CampaignsTable';

export default function CampaignModule() {
    const now = new Date();
    const currentMonthRange = `1 ${format(startOfMonth(now), 'MMMM')} - ${format(endOfMonth(now), 'd MMMM yyyy')}`;

    const handleActionCompleted = (action: string, metadata?: any) => {
        let type = 'general';
        let details = '';

        if (action.includes('Enabled')) {
            type = 'scaling';
            details = metadata?.campaignId 
                ? `Optimization enabled for campaign ${metadata.campaignId.slice(-6)}` 
                : 'Optimization enabled for all campaigns';
        } else if (action.includes('Disabled')) {
            type = 'alert';
            details = metadata?.campaignId 
                ? `Optimization paused for campaign ${metadata.campaignId.slice(-6)}` 
                : 'Optimization disabled for all campaigns';
        }

        const newLog = {
            id: Date.now().toString(),
            action,
            details,
            timestamp: new Date(),
            type
        };

        window.dispatchEvent(new CustomEvent('addOptimizationLog', { detail: newLog }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-6 w-full">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        Campaign
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">{currentMonthRange}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.dispatchEvent(new Event('openNewCampaignModal'))}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200"
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </button>
                </div>
            </div>

            <div className="w-full">
                <CampaignsTable onActionCompleted={handleActionCompleted} />
            </div>
        </div>
    );
}

import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useCampaignsAgent } from '../../../lib/agents/CampaignAgent';
import { CampaignCards } from '../CampaignCards';
import { CampaignCardsSkeleton } from '../skeletons/CampaignCardsSkeleton';
import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

type FilterState = 'All' | 'Active' | 'Draft';

export default function CampaignModule() {
    const [filter, setFilter] = useState<FilterState>('All');
    const { data: campaigns, isLoading } = useCampaignsAgent();
    const now = new Date();
    const currentMonthRange = `1 ${format(startOfMonth(now), 'MMMM')} - ${format(endOfMonth(now), 'd MMMM yyyy')}`;

    const filteredCampaigns = campaigns?.filter(c => {
        if (filter === 'All') return true;
        return c.status.toLowerCase() === filter.toLowerCase();
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-6">
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
                    {/* Filter Toggle */}
                    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                        {(['All', 'Active', 'Draft'] as FilterState[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-5 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200",
                                    filter === f
                                        ? "bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* New Campaign Button */}
                    <button
                        onClick={() => window.dispatchEvent(new Event('openNewCampaignModal'))}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200"
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </button>
                </div>
            </div>

            {isLoading || !filteredCampaigns ? (
                <CampaignCardsSkeleton />
            ) : (
                <CampaignCards campaigns={filteredCampaigns} />
            )}
        </div>
    );
}

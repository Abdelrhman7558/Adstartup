import React, { useState } from 'react';
import { useOverviewAgent } from '../../../lib/agents/OverviewAgent';
import { useAnalyticsAgent, TimeRange } from '../../../lib/agents/AnalyticsAgent';
import { useCampaignsAgent } from '../../../lib/agents/CampaignAgent';
import { OverviewMetrics } from '../OverviewMetrics';
import { OverviewMetricsSkeleton } from '../skeletons/OverviewMetricsSkeleton';
import { AnalyticsChart } from '../AnalyticsChart';
import { ViewerBehavior } from '../ViewerBehavior';
import { CampaignCards } from '../CampaignCards';
import { CampaignCardsSkeleton } from '../skeletons/CampaignCardsSkeleton';
import { ChevronDown, Info } from 'lucide-react';
import { Card } from '../../ui/Card';
import { cn } from '../../../lib/utils';

type FilterState = 'All' | 'Active' | 'Draft';

export default function OverviewModule() {
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [campaignFilter, setCampaignFilter] = useState<FilterState>('All');

    const {
        data: overviewData,
        isLoading: isOverviewLoading
    } = useOverviewAgent();

    const {
        data: analyticsData,
        isLoading: isAnalyticsLoading
    } = useAnalyticsAgent(timeRange);

    const {
        data: campaignsData,
        isLoading: isCampaignsLoading
    } = useCampaignsAgent();

    const filteredCampaigns = campaignsData?.filter(c => {
        if (campaignFilter === 'All') return true;
        return c.status.toLowerCase() === campaignFilter.toLowerCase();
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time insights into the month's performance</p>
                </div>

                {/* Month Selector mapping to design */}
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                    October 2025
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Summary Engagement Section */}
            <div>
                <h2 className="text-[15px] font-bold text-gray-900 mb-4 tracking-tight">Summary Engagement</h2>
                {isOverviewLoading || !overviewData ? (
                    <OverviewMetricsSkeleton />
                ) : (
                    <OverviewMetrics data={overviewData} />
                )}
            </div>

            {/* Analytics Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {isAnalyticsLoading || !analyticsData ? (
                    // Analytics Skeleton
                    <>
                        <Card className="col-span-1 lg:col-span-2 h-[420px] bg-gray-50 animate-pulse border-gray-100 rounded-2xl"></Card>
                        <Card className="col-span-1 h-[420px] bg-gray-50 animate-pulse border-gray-100 rounded-2xl"></Card>
                    </>
                ) : (
                    <>
                        <AnalyticsChart data={analyticsData.chartData} />
                        <ViewerBehavior data={analyticsData.viewerBehavior} />
                    </>
                )}
            </div>

            {/* Campaigns Section */}
            <div className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            Campaign
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">1 October - 31 October 2025</p>
                    </div>

                    {/* Filter Toggle */}
                    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                        {(['All', 'Active', 'Draft'] as FilterState[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setCampaignFilter(f)}
                                className={cn(
                                    "px-5 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer",
                                    campaignFilter === f
                                        ? "bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-gray-900"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {isCampaignsLoading || !filteredCampaigns ? (
                    <CampaignCardsSkeleton />
                ) : (
                    <CampaignCards campaigns={filteredCampaigns} />
                )}
            </div>

        </div>
    );
}

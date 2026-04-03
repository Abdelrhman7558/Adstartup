import { useState } from 'react';
import { useAnalyticsAgent, TimeRange } from '../../../lib/agents/AnalyticsAgent';
import { AnalyticsChart } from '../AnalyticsChart';
import { ViewerBehavior } from '../ViewerBehavior';
import { OverviewMetrics } from '../OverviewMetrics';
import { useOverviewAgent } from '../../../lib/agents/OverviewAgent';
import { OverviewMetricsSkeleton } from '../skeletons/OverviewMetricsSkeleton';
import { Card } from '../../ui/Card';

export default function AnalyticsModule() {
    const [timeRange] = useState<TimeRange>('all');
    
    const { data: analyticsData, isLoading: isAnalyticsLoading } = useAnalyticsAgent(timeRange);
    const { data: overviewData, isLoading: isOverviewLoading } = useOverviewAgent();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Insights & Analytics</h1>
                <p className="text-gray-500 text-sm mt-1">Deep dive into your performance data and optimization outcomes</p>
            </div>

            {/* Top Level Summary Metrics */}
            <div className="w-full">
                {isOverviewLoading || !overviewData ? (
                    <OverviewMetricsSkeleton />
                ) : (
                    <OverviewMetrics data={overviewData} />
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {isAnalyticsLoading || !analyticsData ? (
                    <>
                        <div className="lg:col-span-2 min-w-0">
                            <Card className="h-[420px] bg-gray-50 animate-pulse border-gray-100 rounded-2xl"></Card>
                        </div>
                        <div className="lg:col-span-1 min-w-0">
                            <Card className="h-[420px] bg-gray-50 animate-pulse border-gray-100 rounded-2xl"></Card>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="lg:col-span-2 min-w-0">
                            <AnalyticsChart data={analyticsData.chartData} />
                        </div>
                        <div className="lg:col-span-1 min-w-0">
                            <ViewerBehavior data={analyticsData.viewerBehavior} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

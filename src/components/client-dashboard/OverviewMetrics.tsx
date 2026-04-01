import React from 'react';
import { Eye, Users, MousePointerClick, ShoppingCart } from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import { OverviewMetricsPayload } from '../../lib/agents/OverviewAgent';

interface OverviewMetricsProps {
    data: OverviewMetricsPayload;
}

export function OverviewMetrics({ data }: OverviewMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
                title="Page Views"
                value={data.views.value}
                icon={Eye}
                iconColor="text-red-600 bg-red-50"
                trend={{
                    value: data.views.trendValue,
                    isPositive: data.views.trendPositive,
                    label: 'vs Last month',
                }}
            />
            <MetricCard
                title="Visitors"
                value={data.visitors.value}
                icon={Users}
                iconColor="text-red-600 bg-red-50"
                trend={{
                    value: data.visitors.trendValue,
                    isPositive: data.visitors.trendPositive,
                    label: 'vs Last month',
                }}
            />
            <MetricCard
                title="Click"
                value={data.clicks.value}
                icon={MousePointerClick}
                iconColor="text-red-600 bg-red-50"
                trend={{
                    value: data.clicks.trendValue,
                    isPositive: data.clicks.trendPositive,
                    label: 'vs Last month',
                }}
            />
            <MetricCard
                title="Orders"
                value={data.orders.value}
                icon={ShoppingCart}
                iconColor="text-red-600 bg-red-50"
                trend={{
                    value: data.orders.trendValue,
                    isPositive: data.orders.trendPositive,
                    label: 'vs Last month',
                }}
            />
        </div>
    );
}

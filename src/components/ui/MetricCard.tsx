import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number; // percentage
        label: string;
        isPositive: boolean;
    };
    className?: string;
    iconColor?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, className, iconColor }: MetricCardProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{title}</p>
                    <div className={cn("p-1.5 rounded-full bg-blue-50/50", iconColor || "text-blue-500")}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2 mt-auto">
                    <h2 className="text-[28px] font-bold tracking-tight text-gray-900 leading-none">
                        {value}
                    </h2>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">vs Last month</span>
                        {trend && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 inline-flex px-1.5 py-0.5 rounded text-xs font-semibold',
                                    trend.isPositive
                                        ? 'bg-green-50 text-green-600'
                                        : 'bg-red-50 text-red-600'
                                )}
                            >
                                {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(trend.value)}%
                            </div>
                        )}
                        {/* If there's a custom label, we could use trend.label instead of "vs Last month" */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

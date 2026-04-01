import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { AreaChartData } from '../../lib/agents/AnalyticsAgent';

interface AnalyticsChartProps {
    data: AreaChartData[];
}

const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return '0k';
    return `${tickItem / 1000}k`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[200px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900">{label}</span>
                {/* A fake generic trend mimicking UI reference tooltip */}
                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    +8.24% <span className="text-gray-400 font-medium">vs Last month</span>
                </span>
            </div>
            <div className="space-y-2">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            ></div>
                            <span className="text-sm text-gray-600 capitalize">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function AnalyticsChart({ data }: AnalyticsChartProps) {
    return (
        <Card className="w-full shadow-sm border border-gray-100/80 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0 space-y-0">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        All Impressions & Conversions
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </h2>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        Views
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        Conversions
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Buy
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 pb-1 pl-2 pr-6">
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                tickFormatter={formatYAxis}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="buy" stroke="#9CA3AF" strokeWidth={2} fill="url(#colorBuy)" />
                            <Area type="monotone" dataKey="conversions" stroke="#A78BFA" strokeWidth={2} fill="url(#colorConversions)" />
                            <Area type="monotone" dataKey="views" stroke="#60A5FA" strokeWidth={2} fill="url(#colorViews)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

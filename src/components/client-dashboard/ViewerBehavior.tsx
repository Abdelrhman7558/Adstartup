import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ViewerBehaviorData } from '../../lib/agents/AnalyticsAgent';
import { MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ViewerBehaviorProps {
    data: ViewerBehaviorData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
            <div className="font-bold text-gray-900 mb-2">{label}</div>
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex justify-between gap-4">
                    <span className="text-gray-500 capitalize">{entry.name}</span>
                    <span className="font-bold text-gray-900">{entry.value}%</span>
                </div>
            ))}
        </div>
    );
};

export function ViewerBehavior({ data }: ViewerBehaviorProps) {
    // Find index of 'Apr' to highlight it
    const activeIndex = data.metrics.findIndex(m => m.month === 'Apr');

    return (
        <Card className="shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border-gray-100/80 rounded-2xl h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6">
                <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                    Viewer Behavior
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </h2>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </CardHeader>

            <CardContent className="pt-2 flex flex-col flex-1">
                <div className="mb-6">
                    <h3 className="text-[32px] font-bold tracking-tight leading-none text-gray-900">
                        $ {data.revenue.toLocaleString()}
                    </h3>

                    <div className="flex items-center gap-4 text-xs font-semibold mt-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            CTR
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-blue-200"></div>
                            Reactions
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                            Interaction Rate
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[180px] mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.metrics} margin={{ top: 0, right: 0, left: 0, bottom: -10 }}>
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 500 }}
                                dy={10}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            {/* Stacked bar illusion for visual match to reference image */}
                            <Bar dataKey="interaction_rate" radius={[4, 4, 4, 4]} barSize={16}>
                                {data.metrics.map((entry, index) => (
                                    <Cell key={`cell-interaction-${index}`} fill={index === activeIndex ? '#E5E7EB' : '#F3F4F6'} />
                                ))}
                            </Bar>
                            <Bar dataKey="reactions" radius={[0, 0, 4, 4]} barSize={16} shape={(props: any) => {
                                const { x, y, width, height, index } = props;
                                return <rect x={x} y={y + (height * 0.4)} width={width} height={height * 0.6} fill={index === activeIndex ? '#BFDBFE' : '#E5E7EB'} rx={2} />;
                            }} />
                            <Bar dataKey="ctr" radius={[0, 0, 4, 4]} barSize={16} shape={(props: any) => {
                                const { x, y, width, height, index } = props;
                                return <rect x={x} y={y + (height * 0.7)} width={width} height={height * 0.3} fill={index === activeIndex ? '#2563EB' : '#D1D5DB'} rx={2} />;
                            }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

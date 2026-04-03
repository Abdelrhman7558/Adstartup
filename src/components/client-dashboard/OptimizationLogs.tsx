import { useEffect, useState } from 'react';
import { Activity, Copy, TrendingUp, AlertCircle, Bot } from 'lucide-react';

export interface OptimizationLog {
    id: string;
    action: string;
    timestamp: Date;
    details?: string;
    type: 'scaling' | 'duplicate' | 'profit' | 'alert' | 'general';
}

interface OptimizationLogsProps {
    logs: OptimizationLog[];
    isDropdown?: boolean;
}

export function OptimizationLogs({ logs, isDropdown = false }: OptimizationLogsProps) {
    const [animatedLogs, setAnimatedLogs] = useState<OptimizationLog[]>([]);

    useEffect(() => {
        setAnimatedLogs(logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50));
    }, [logs]);

    const getIconInfo = (type: string) => {
        switch (type) {
            case 'scaling':
                return { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-100' };
            case 'duplicate':
                return { icon: Copy, color: 'text-purple-500', bg: 'bg-purple-100' };
            case 'profit':
                return { icon: Activity, color: 'text-green-500', bg: 'bg-green-100' };
            case 'alert':
                return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' };
            default:
                return { icon: Bot, color: 'text-gray-500', bg: 'bg-gray-100' };
        }
    };

    if (animatedLogs.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 bg-white h-full ${!isDropdown ? 'border border-gray-100 shadow-sm rounded-2xl' : ''}`}>
                <Bot className="w-12 h-12 text-gray-300 mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No Optimization Activity</h4>
                <p className="text-xs text-gray-500 mt-1 text-center max-w-[200px]">
                    Turn on the Optimize & Scale toggle to see automated activities appearing here.
                </p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-6 h-full overflow-hidden flex flex-col ${!isDropdown ? 'border border-gray-100 shadow-sm rounded-2xl' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex flex-shrink-0 items-center justify-center border border-blue-100">
                    <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">AI Activity Feed</h3>
                    <p className="text-xs text-gray-500 font-medium">Real-time optimization logs</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                {animatedLogs.map((log, index) => {
                    const { icon: Icon, color, bg } = getIconInfo(log.type);
                    return (
                        <div key={log.id} className="relative pl-6">
                            {/* Vertical timeline line */}
                            {index !== animatedLogs.length - 1 && (
                                <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-gray-100" />
                            )}
                            
                            {/* Timeline dot */}
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${bg}`}>
                                <Icon className={`w-3 h-3 ${color}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl ml-2">
                                <p className="text-sm font-bold text-gray-900">{log.action}</p>
                                {log.details && (
                                    <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
                                        {log.details}
                                    </p>
                                )}
                                <span className="text-[10px] text-gray-400 font-semibold uppercase mt-2 block">
                                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.timestamp.toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default OptimizationLogs;

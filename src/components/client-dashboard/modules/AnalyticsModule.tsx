import React from 'react';

export default function AnalyticsModule() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
                <p className="text-gray-500 text-sm mt-1">Deep dive into your performance data</p>
            </div>

            <div className="h-64 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                Analytics Content
            </div>
        </div>
    );
}

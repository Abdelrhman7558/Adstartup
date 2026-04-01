import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';

export function OverviewMetricsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                    <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>

                        <div className="space-y-3 mt-auto">
                            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
                                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

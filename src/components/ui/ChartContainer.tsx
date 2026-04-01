import React from 'react';
import { cn } from '../../lib/utils';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactElement;
    minHeight?: number | string;
}

export function ChartContainer({ children, minHeight = 300, className, ...props }: ChartContainerProps) {
    return (
        <div className={cn('w-full', className)} style={{ minHeight }} {...props}>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );
}

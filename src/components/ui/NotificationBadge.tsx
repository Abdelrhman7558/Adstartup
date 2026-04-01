import React from 'react';
import { cn } from '../../lib/utils';

interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    count: number;
    max?: number;
}

export function NotificationBadge({ count, max = 99, className, ...props }: NotificationBadgeProps) {
    if (count <= 0) return null;

    const displayCount = count > max ? `${max}+` : count;

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white leading-none',
                className
            )}
            {...props}
        >
            {displayCount}
        </span>
    );
}

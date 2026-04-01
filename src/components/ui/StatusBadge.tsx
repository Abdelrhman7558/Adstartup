import React from 'react';
import { cn } from '../../lib/utils';

export type StatusBadgeVariant = 'active' | 'draft' | 'paused' | 'error';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: StatusBadgeVariant;
    children: React.ReactNode;
}

export function StatusBadge({ variant = 'active', className, children, ...props }: StatusBadgeProps) {
    const variants = {
        active: 'bg-blue-50 text-blue-600 border border-blue-200',
        draft: 'bg-gray-100 text-gray-600 border border-gray-200',
        paused: 'bg-orange-50 text-orange-600 border border-orange-200',
        error: 'bg-red-50 text-red-600 border border-red-200',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

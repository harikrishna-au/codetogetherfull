
import React from 'react';

interface BadgeProps {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    size?: 'sm' | 'md';
    children: React.ReactNode;
}

export default function Badge({
    variant = 'default',
    size = 'md',
    children
}: BadgeProps) {
    const variantStyles = {
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        danger: 'bg-red-50 text-red-700 border border-red-100',
        info: 'bg-blue-50 text-blue-700 border border-blue-100',
        default: 'bg-gray-50 text-gray-700 border border-gray-100'
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs font-medium',
        md: 'px-2.5 py-0.5 text-sm font-medium'
    };

    return (
        <span className={`inline-flex items-center rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}>
            {children}
        </span>
    );
}

import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
    const variantStyles = {
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        default: 'bg-gray-100 text-gray-800'
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm'
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}>
            {children}
        </span>
    );
}

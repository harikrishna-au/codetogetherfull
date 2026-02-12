
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variantStyles = {
        primary: 'bg-black text-white hover:bg-zinc-800 focus:ring-zinc-900 border border-transparent shadow-sm',
        secondary: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 focus:ring-gray-200 shadow-sm',
        danger: 'bg-white text-red-600 hover:bg-red-50 border border-red-200 focus:ring-red-200 shadow-sm',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200',
        success: 'bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200 focus:ring-emerald-200 shadow-sm'
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base'
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}


import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick
}: CardProps) {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    return (
        <div
            className={`
                bg-white border border-gray-200 rounded-lg
                ${hover ? 'transition-all duration-200 hover:border-gray-300' : ''}
                ${paddingStyles[padding]}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

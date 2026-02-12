
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: string;
}

export default function Input({
    label,
    error,
    helpText,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <input
                className={`
                    w-full px-3 py-2 bg-white border border-gray-200 rounded-md
                    text-gray-900 placeholder-gray-400
                    transition-all duration-200
                    focus:outline-none focus:ring-1 focus:ring-black focus:border-black
                    disabled:bg-gray-50 disabled:text-gray-500
                    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {helpText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helpText}</p>
            )}
        </div>
    );
}

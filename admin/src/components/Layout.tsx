import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (page: 'dashboard' | 'view-questions' | 'add-question' | 'clear-queues') => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const pageTitle = {
        'dashboard': 'Dashboard',
        'view-questions': 'View Questions',
        'add-question': 'Add Question',
        'clear-queues': 'Clear Queues'
    }[currentPage] || 'Admin Panel';

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                currentPage={currentPage}
                onNavigate={onNavigate}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
                        </div>

                        {/* Header actions */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}


import React from 'react';
import { LayoutDashboard, List, Plus, Eraser, X } from 'lucide-react';

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: 'dashboard' | 'view-questions' | 'add-question' | 'clear-queues') => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

export default function Sidebar({ currentPage, onNavigate, isMobileOpen, onMobileClose }: SidebarProps) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'view-questions', label: 'View Questions', icon: <List size={20} /> },
        { id: 'add-question', label: 'New Question', icon: <Plus size={20} /> },
        { id: 'clear-queues', label: 'Clear Queues', icon: <Eraser size={20} /> }
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo/Header */}
                <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                    <div className="flex items-center justify-center w-8 h-8 bg-black rounded-md text-white font-bold text-sm">
                        CT
                    </div>
                    <span className="font-semibold text-gray-900 tracking-tight">CodeTogether</span>
                    <button
                        onClick={onMobileClose}
                        className="ml-auto lg:hidden text-gray-400 hover:text-gray-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id as any);
                                    onMobileClose();
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${isActive
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className={isActive ? 'text-black' : 'text-gray-400'}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-gray-400 text-center font-medium">
                        Admin Command Center
                    </p>
                </div>
            </aside>
        </>
    );
}

import React from 'react';

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: 'dashboard' | 'view-questions' | 'add-question' | 'clear-queues') => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

export default function Sidebar({ currentPage, onNavigate, isMobileOpen, onMobileClose }: SidebarProps) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'view-questions', label: 'View Questions', icon: '📝' },
        { id: 'add-question', label: 'Add Question', icon: '➕' },
        { id: 'clear-queues', label: 'Clear Queues', icon: '🧹' }
    ];

    const handleNavClick = (page: any) => {
        onNavigate(page);
        onMobileClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo/Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-xl">
                            CT
                        </span>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">CodeTogether</h1>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    </div>
                    <button
                        onClick={onMobileClose}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === item.id
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        © {new Date().getFullYear()} CodeTogether
                    </div>
                </div>
            </aside>
        </>
    );
}

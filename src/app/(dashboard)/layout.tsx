'use client';

import React from 'react';
import Sidebar from './_components/Sidebar';

type DashboardLayoutProps = {
    children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {/* デスクトップ/タブレット表示時のみCMS Dashboardヘッダーを表示 */}
                <header className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        CMS Dashboard
                    </h1>
                    <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}

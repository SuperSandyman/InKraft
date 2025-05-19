'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiHome, FiFileText, FiBookmark, FiUsers, FiBarChart2, FiSettings } from 'react-icons/fi';

const sidebarItems = [
    { name: 'ホーム', href: '/', icon: FiHome },
    { name: '投稿一覧', href: '/posts', icon: FiFileText },
    { name: 'スクラップ', href: '/scraps', icon: FiBookmark },
    { name: 'ユーザー管理', href: '/users', icon: FiUsers },
    { name: 'アクセス解析', href: '/analytics', icon: FiBarChart2 }
] as const;

type SidebarItem = (typeof sidebarItems)[number];

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            <div className="md:hidden">
                <header className="flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setOpen(!open)}>
                        <FiMenu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="text-lg font-medium text-gray-800 dark:text-gray-200">サイト名 / ホーム</div>
                    <div className="w-6 h-6" />
                </header>

                {open && (
                    <div className="fixed inset-0 z-40">
                        <div className="absolute inset-0 bg-black/50 dark:bg-white/10" onClick={() => setOpen(false)} />
                        <aside className="relative z-50 w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-200">
                            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </div>
                            <nav className="flex-1 overflow-y-auto py-4">
                                {sidebarItems.map((item: SidebarItem) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center px-4 py-3 space-x-3 rounded-lg transition-colors duration-200 ${
                                                isActive
                                                    ? 'bg-gray-100 dark:bg-gray-800'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => setOpen(false)}
                                        >
                                            <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                            <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <Link
                                    href="/settings"
                                    className="flex items-center px-3 py-2 space-x-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                    onClick={() => setOpen(false)}
                                >
                                    <FiSettings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-800 dark:text-gray-200">設定</span>
                                </Link>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            <aside className="hidden md:flex flex-col w-16 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center h-16">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" title="ユーザー" />
                </div>
                <nav className="flex-1 flex flex-col items-center py-2 space-y-1">
                    {sidebarItems.map((item: SidebarItem) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.name}
                                className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200 ${
                                    isActive
                                        ? 'bg-gray-200 dark:bg-gray-800'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </Link>
                        );
                    })}
                </nav>
                <div className="flex items-center justify-center h-16 mb-4">
                    <Link
                        href="/settings"
                        title="設定"
                        className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <FiSettings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </Link>
                </div>
            </aside>
        </>
    );
}

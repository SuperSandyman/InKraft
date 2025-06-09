'use client';

import * as React from 'react';
import {
    AudioWaveform,
    BookOpen,
    Command,
    GalleryVerticalEnd,
    MessageSquare,
    Settings2,
    Users,
    LogOut
} from 'lucide-react';

import { NavMain } from '@/components/sidebar/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';

// This is sample data.
const data = {
    user: {
        name: 'Admin User',
        email: 'admin@cms.local',
        avatar: '/avatars/shadcn.jpg'
    },
    teams: [
        {
            name: 'CMS管理',
            logo: GalleryVerticalEnd,
            plan: 'Enterprise'
        },
        {
            name: '記事編集',
            logo: AudioWaveform,
            plan: 'Professional'
        },
        {
            name: 'コンテンツ',
            logo: Command,
            plan: 'Standard'
        }
    ],
    navMain: [
        {
            title: '記事一覧',
            url: '/articles',
            icon: BookOpen,
            isActive: true,
            items: [
                {
                    title: '公開中',
                    url: '/articles/published'
                },
                {
                    title: '下書き',
                    url: '/articles/drafts'
                },
                {
                    title: '新規作成',
                    url: '/articles/new'
                }
            ]
        },
        {
            title: 'ユーザー',
            url: '/users',
            icon: Users,
            items: [
                {
                    title: '管理者',
                    url: '/users/admins'
                },
                {
                    title: '編集者',
                    url: '/users/editors'
                },
                {
                    title: '閲覧者',
                    url: '/users/viewers'
                }
            ]
        },
        {
            title: 'AIチャット',
            url: '/chat',
            icon: MessageSquare,
            items: [
                {
                    title: '記事作成支援',
                    url: '/chat/writing'
                },
                {
                    title: '校正・推敲',
                    url: '/chat/editing'
                },
                {
                    title: 'SEO最適化',
                    url: '/chat/seo'
                }
            ]
        },
        {
            title: '設定',
            url: '/settings',
            icon: Settings2,
            items: [
                {
                    title: '一般設定',
                    url: '/settings/general'
                },
                {
                    title: 'GitHub連携',
                    url: '/settings/github'
                },
                {
                    title: 'テーマ設定',
                    url: '/settings/theme'
                },
                {
                    title: 'ユーザー管理',
                    url: '/settings/users'
                }
            ]
        }
    ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                {/* シンプルなユーザーアイコン＋ユーザー名表示 */}
                <div className="flex items-center gap-3 px-2 py-3">
                    <img
                        src={data.user.avatar}
                        alt={data.user.name}
                        className="w-9 h-9 rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
                    />
                    <span className="font-medium text-base text-gray-900 dark:text-gray-100 truncate">
                        {data.user.name}
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <form action="/api/auth/signout" method="post" className="w-full">
                    <button
                        type="submit"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>ログアウト</span>
                    </button>
                </form>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

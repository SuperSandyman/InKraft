'use client';

import * as React from 'react';
import { AudioWaveform, BookOpen, Command, GalleryVerticalEnd, Settings2, LogOut } from 'lucide-react';
import { NavMain } from '@/components/sidebar/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { logoutAction } from '@/app/actions/logout';
import { UserInfoClient } from '@/components/sidebar/user-info-client';

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
            url: '/contents',
            icon: BookOpen,
            isActive: true,
            items: [
                {
                    title: '公開中',
                    url: '/contents?status=published'
                },
                {
                    title: '下書き',
                    url: '/contents?status=draft'
                },
                {
                    title: '新規作成',
                    url: '/contents/new'
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

interface AppSidebarClientProps extends React.ComponentProps<typeof Sidebar> {
    user?: {
        name?: string | null;
        image?: string | null;
    };
}

export function AppSidebarClient({ user, ...props }: AppSidebarClientProps) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <UserInfoClient user={user} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <form action={logoutAction} className="w-full">
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

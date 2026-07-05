'use client';

import * as React from 'react';
import { BarChart3, BookOpen, Home, Settings, Users } from 'lucide-react';
import { NavMain } from '@/components/sidebar/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { logoutAction } from '@/app/actions/logout';
import { UserInfoClient } from '@/components/sidebar/user-info-client';
import { SidebarLogoutButton } from './sidebar-logout-button';

// This is sample data.
const data = {
    navMain: [
        {
            title: 'ホーム',
            url: '/',
            icon: Home,
            isActive: true
        },
        {
            title: '記事一覧',
            url: '/contents',
            icon: BookOpen,
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
            title: 'コミュニティ',
            url: '/',
            icon: Users
        },
        {
            title: '分析',
            url: '/',
            icon: BarChart3
        },
        {
            title: '設定',
            url: '/',
            icon: Settings
        }
    ]
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user?: {
        name?: string | null;
        image?: string | null;
    };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="px-3 py-5">
                <UserInfoClient user={user} />
            </SidebarHeader>
            <SidebarContent className="px-3">
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter className="px-3 py-5">
                <form action={logoutAction} className="w-full">
                    <SidebarLogoutButton />
                </form>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

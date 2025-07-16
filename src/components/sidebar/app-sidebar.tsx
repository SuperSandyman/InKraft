'use client';

import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { NavMain } from '@/components/sidebar/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { logoutAction } from '@/app/actions/logout';
import { UserInfoClient } from '@/components/sidebar/user-info-client';
import { SidebarLogoutButton } from './sidebar-logout-button';

// This is sample data.
const data = {
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
        }
        // {
        //     title: '設定',
        //     url: '/settings',
        //     icon: Settings2,
        //     items: [
        //         {
        //             title: '一般設定',
        //             url: '/settings/general'
        //         },
        //         {
        //             title: 'GitHub連携',
        //             url: '/settings/github'
        //         },
        //         {
        //             title: 'テーマ設定',
        //             url: '/settings/theme'
        //         },
        //         {
        //             title: 'ユーザー管理',
        //             url: '/settings/users'
        //         }
        //     ]
        // }
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
            <SidebarHeader>
                <UserInfoClient user={user} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <form action={logoutAction} className="w-full">
                    <SidebarLogoutButton />
                </form>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

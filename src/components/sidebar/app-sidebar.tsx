'use client';

import * as React from 'react';
import { BookOpen, FilePlus2, FileText, Home, PencilLine } from 'lucide-react';
import { NavMain } from '@/components/sidebar/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { logoutAction } from '@/app/actions/logout';
import { UserInfoClient } from '@/components/sidebar/user-info-client';
import { SidebarLogoutButton } from './sidebar-logout-button';

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
            icon: BookOpen
        },
        {
            title: '公開中',
            url: '/contents?status=published',
            icon: FileText
        },
        {
            title: '下書き',
            url: '/contents?status=draft',
            icon: PencilLine
        },
        {
            title: '新規作成',
            url: '/contents/new',
            icon: FilePlus2
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
            <SidebarHeader className="px-3 py-4 md:items-center">
                <UserInfoClient user={user} />
            </SidebarHeader>
            <SidebarContent className="px-3 md:items-center">
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter className="px-3 py-4 md:items-center">
                <form action={logoutAction} className="w-full">
                    <SidebarLogoutButton />
                </form>
            </SidebarFooter>
            <SidebarRail className="md:hidden" />
        </Sidebar>
    );
}

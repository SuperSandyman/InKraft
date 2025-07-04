import { auth } from '@/auth';
import { AppSidebarClient } from '@/components/sidebar/app-sidebar-client';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';

type DashboardLayoutProps = {
    children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const session = await auth();
    
    return (
        <SidebarProvider>
            <AppSidebarClient user={session?.user} />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}

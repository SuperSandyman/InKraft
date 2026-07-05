'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar';

export function NavMain({
    items
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
    }[];
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isMobile } = useSidebar();

    return (
        <SidebarGroup className="p-0 md:items-center">
            <SidebarMenu className="gap-2 md:items-center">
                {items.map((item) => {
                    const [itemPath, itemQuery] = item.url.split('?');
                    const itemStatus = new URLSearchParams(itemQuery).get('status');
                    const currentStatus = searchParams.get('status');
                    const isActive =
                        item.url === '/'
                            ? pathname === '/'
                            : itemStatus
                              ? pathname === itemPath && currentStatus === itemStatus
                              : pathname === item.url && !currentStatus;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                isActive={isActive}
                                size="lg"
                                className="h-12 justify-start gap-3 rounded-lg text-[13px] font-bold md:size-12 md:justify-center md:p-0"
                            >
                                <Link href={item.url} aria-label={item.title}>
                                    {item.icon && <item.icon className="size-5" />}
                                    {isMobile && <span>{item.title}</span>}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

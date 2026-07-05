'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from '@/components/ui/sidebar';

export function NavMain({
    items
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
}) {
    const pathname = usePathname();

    return (
        <SidebarGroup className="p-0">
            <SidebarMenu className="gap-3">
                {items.map((item) => {
                    const isActive = item.url === '/' ? pathname === '/' : pathname.startsWith(item.url);
                    const isParentActive = item.items?.some((subItem) => pathname.startsWith(subItem.url)) ?? false;

                    return (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive || isActive || isParentActive}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            {item.items?.length ? (
                                <>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={isActive || isParentActive}
                                            size="lg"
                                            className="h-14 justify-center gap-3 rounded-lg text-[13px] font-bold group-data-[collapsible=icon]:size-12!"
                                        >
                                            {item.icon && <item.icon className="size-5" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="ml-5 mt-2 gap-1 border-l border-sidebar-border/70">
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild>
                                                        <Link href={subItem.url}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={isActive}
                                    size="lg"
                                    className="h-14 justify-center gap-3 rounded-lg text-[13px] font-bold group-data-[collapsible=icon]:size-12!"
                                >
                                    <Link href={item.url}>
                                        {item.icon && <item.icon className="size-5" />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    </Collapsible>
                );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

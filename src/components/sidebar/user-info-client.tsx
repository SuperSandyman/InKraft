'use client';

import * as React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UserInfoClientProps {
    user?: {
        name?: string | null;
        image?: string | null;
    };
}

export const UserInfoClient: React.FC<UserInfoClientProps> = ({ user }) => {
    const { isMobile } = useSidebar();
    const name = user?.name || 'User';
    const avatar = (
        <div
            className={
                isMobile ? 'flex items-center gap-3 px-1 py-1' : 'flex size-12 items-center justify-center'
            }
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={user?.image || '/user-solid.svg'}
                alt={name}
                className={
                    isMobile
                        ? 'size-11 rounded-full object-cover bg-blue-100 ring-2 ring-blue-200/80'
                        : 'size-10 rounded-full object-cover bg-blue-100 ring-2 ring-blue-200/80'
                }
            />
            {isMobile && (
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {name}
                </span>
            )}
        </div>
    );

    if (isMobile) {
        return avatar;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{avatar}</TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={10}>
                {name}
            </TooltipContent>
        </Tooltip>
    );
};

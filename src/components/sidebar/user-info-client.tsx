'use client';

import * as React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

interface UserInfoClientProps {
    user?: {
        name?: string | null;
        image?: string | null;
    };
}

export const UserInfoClient: React.FC<UserInfoClientProps> = ({ user }) => {
    const { state } = useSidebar();
    return (
        <div
            className={
                state === 'collapsed' ? 'flex flex-col items-center px-0 py-0' : 'flex items-center gap-3 px-1 py-1'
            }
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={user?.image || '/user-solid.svg'}
                alt={user?.name || 'User'}
                style={
                    state === 'collapsed'
                        ? {
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '9999px',
                              objectFit: 'cover',
                              aspectRatio: '1 / 1'
                          }
                        : undefined
                }
                className={
                    state === 'collapsed'
                        ? 'rounded-full object-cover bg-blue-100 ring-2 ring-blue-200/80 aspect-square'
                        : 'w-11 h-11 rounded-full object-cover bg-blue-100 ring-2 ring-blue-200/80'
                }
            />
            {state !== 'collapsed' && (
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {user?.name || 'User'}
                </span>
            )}
        </div>
    );
};

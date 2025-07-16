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
                state === 'collapsed' ? 'flex flex-col items-center px-0 py-2' : 'flex items-center gap-3 px-2 py-3'
            }
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={user?.image || '/user-solid.svg'}
                alt={user?.name || 'User'}
                style={
                    state === 'collapsed'
                        ? {
                              width: '2.25rem',
                              height: '2.25rem',
                              borderRadius: '0.5rem',
                              objectFit: 'cover',
                              backgroundColor: 'var(--tw-bg-opacity)',
                              aspectRatio: '1 / 1'
                          }
                        : undefined
                }
                className={
                    state === 'collapsed'
                        ? 'rounded-lg object-cover bg-gray-200 dark:bg-gray-700 aspect-square'
                        : 'w-9 h-9 rounded-lg object-cover bg-gray-200 dark:bg-gray-700'
                }
            />
            {state !== 'collapsed' && (
                <span className="font-medium text-base text-gray-900 dark:text-gray-100 truncate">
                    {user?.name || 'User'}
                </span>
            )}
        </div>
    );
};

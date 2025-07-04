'use client';

import * as React from 'react';

interface UserInfoClientProps {
    user?: {
        name?: string | null;
        image?: string | null;
    };
}

export const UserInfoClient: React.FC<UserInfoClientProps> = ({ user }) => {
    return (
        <div className="flex items-center gap-3 px-2 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={user?.image || '/user-solid.svg'}
                alt={user?.name || 'User'}
                className="w-9 h-9 rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
            />
            <span className="font-medium text-base text-gray-900 dark:text-gray-100 truncate">
                {user?.name || 'User'}
            </span>
        </div>
    );
};

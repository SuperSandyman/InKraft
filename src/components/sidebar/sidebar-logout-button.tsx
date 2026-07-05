import * as React from 'react';
import { LogOut } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const SidebarLogoutButton: React.FC = () => {
    const { state } = useSidebar();
    return (
        <button
            type="submit"
            className={
                state === 'collapsed'
                    ? 'flex h-12 items-center justify-center w-full px-0 rounded-lg text-sm font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors'
                    : 'flex h-12 items-center gap-2 w-full px-3 rounded-lg text-sm font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors'
            }
        >
            <LogOut className="w-4 h-4" />
            {state !== 'collapsed' && <span>ログアウト</span>}
        </button>
    );
};

export { SidebarLogoutButton };

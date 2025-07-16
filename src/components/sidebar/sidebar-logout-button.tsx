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
                    ? 'flex items-center justify-center w-full px-0 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                    : 'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
            }
        >
            <LogOut className="w-4 h-4" />
            {state !== 'collapsed' && <span>ログアウト</span>}
        </button>
    );
};

export { SidebarLogoutButton };

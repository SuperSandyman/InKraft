import * as React from 'react';
import { LogOut } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SidebarLogoutButton: React.FC = () => {
    const { isMobile } = useSidebar();
    const button = (
        <button
            type="submit"
            className={
                isMobile
                    ? 'flex h-12 items-center gap-2 w-full px-3 rounded-lg text-sm font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors'
                    : 'flex size-12 items-center justify-center rounded-lg text-sm font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors'
            }
            aria-label="ログアウト"
        >
            <LogOut className="size-5" />
            {isMobile && <span>ログアウト</span>}
        </button>
    );

    if (isMobile) {
        return button;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={10}>
                ログアウト
            </TooltipContent>
        </Tooltip>
    );
};

export { SidebarLogoutButton };

import { auth } from '@/auth';
import type { AppSession } from '@/types/auth';
import { isUserAllowed } from './allowed-users';

export const requireAllowedSession = async (): Promise<AppSession> => {
    const session = await auth();

    if (!session) {
        throw new Error('認証が必要です');
    }

    if (!isUserAllowed(session)) {
        throw new Error('操作権限がありません');
    }

    return session;
};

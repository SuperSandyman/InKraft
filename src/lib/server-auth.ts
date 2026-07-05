import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { isUserAllowed } from './allowed-users';

export const requireAllowedSession = async (): Promise<Session> => {
    const session = await auth();

    if (!session) {
        throw new Error('認証が必要です');
    }

    if (!isUserAllowed(session)) {
        throw new Error('操作権限がありません');
    }

    return session;
};

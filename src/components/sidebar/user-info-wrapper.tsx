import { auth } from '@/auth';
import { UserInfoClient } from './user-info-client';

export default async function UserInfoWrapper() {
    const session = await auth();
    return <UserInfoClient user={session?.user} />;
}

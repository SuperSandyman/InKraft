import { Octokit } from '@octokit/rest';

import { auth } from '@/auth';

export const getOctokitWithAuth = async (): Promise<Octokit> => {
    const session = await auth();
    const token = session?.accessToken as string | undefined;
    if (!token) {
        throw new Error('GitHub access token is missing');
    }
    return new Octokit({ auth: token });
};

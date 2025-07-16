import { Octokit } from '@octokit/rest';

import { auth } from '@/auth';

export const getOctokitWithAuth = async (): Promise<Octokit> => {
    const session = await auth();
    const token = session?.accessToken as string | undefined;
    return new Octokit(token ? { auth: token } : {});
};

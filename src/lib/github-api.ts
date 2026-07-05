import { Octokit } from '@octokit/rest';

import { getGitHubAccessToken } from '@/auth';

export const getOctokitWithAuth = async (): Promise<Octokit> => {
    const token = await getGitHubAccessToken();
    if (!token) {
        throw new Error('GitHub access token is missing');
    }
    return new Octokit({ auth: token });
};

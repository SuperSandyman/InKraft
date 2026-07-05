import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AppSession } from '@/types/auth';

const githubClientId = process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID || '';
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET || '';
const authBaseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL;

export const betterAuthInstance = betterAuth({
    ...(authBaseURL ? { baseURL: authBaseURL } : {}),
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    socialProviders: {
        github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
            scope: ['repo'],
            mapProfileToUser(profile) {
                return {
                    githubId: String(profile.id),
                    githubLogin: profile.login
                };
            }
        }
    },
    user: {
        additionalFields: {
            githubId: {
                type: 'string',
                required: false,
                input: false
            },
            githubLogin: {
                type: 'string',
                required: false,
                input: false
            }
        }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7,
            strategy: 'jwe',
            refreshCache: true
        }
    },
    account: {
        storeStateStrategy: 'cookie',
        storeAccountCookie: true,
        encryptOAuthTokens: true
    },
    telemetry: {
        enabled: false
    },
    plugins: [nextCookies()]
});

export const handlers = betterAuthInstance.handler;

type BetterAuthSession = Awaited<ReturnType<typeof betterAuthInstance.api.getSession>>;

const toAppSession = (session: BetterAuthSession): AppSession | null => {
    if (!session?.user) {
        return null;
    }

    const user = session.user;

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            githubId: user.githubId ?? user.id ?? undefined,
            githubLogin: user.githubLogin ?? undefined
        }
    };
};

export const getSessionFromHeaders = async (requestHeaders: Headers): Promise<AppSession | null> => {
    const session = await betterAuthInstance.api.getSession({
        headers: requestHeaders
    });

    return toAppSession(session);
};

export const auth = async (): Promise<AppSession | null> => {
    return getSessionFromHeaders(await headers());
};

export const getGitHubAccessToken = async (): Promise<string | undefined> => {
    const token = await betterAuthInstance.api.getAccessToken({
        headers: await headers(),
        body: {
            providerId: 'github'
        }
    });

    return token.accessToken;
};

type SignInProvider = 'github';

interface SignInOptions {
    callbackUrl?: string;
    redirect?: boolean;
}

export const signIn = async (provider: SignInProvider, options: SignInOptions = {}) => {
    const result = await betterAuthInstance.api.signInSocial({
        body: {
            provider,
            callbackURL: options.callbackUrl ?? '/'
        }
    });

    if (options.redirect !== false && result.url) {
        redirect(result.url);
    }

    return result;
};

export const signOut = async () => {
    await betterAuthInstance.api.signOut({
        headers: await headers()
    });

    redirect('/login');
};

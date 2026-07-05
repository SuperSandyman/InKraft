import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AppSession } from '@/types/auth';

const githubClientId = process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID || '';
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET || '';
const isProduction = process.env.NODE_ENV === 'production';
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';

const resolveAuthBaseURL = () => {
    const explicitURL =
        process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
        process.env.AUTH_URL ||
        process.env.NEXTAUTH_URL;

    if (explicitURL) {
        return explicitURL;
    }

    const vercelURL = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercelURL) {
        return vercelURL.startsWith('http') ? vercelURL : `https://${vercelURL}`;
    }

    const allowedHosts = process.env.BETTER_AUTH_ALLOWED_HOSTS?.split(',')
        .map((host) => host.trim())
        .filter(Boolean);
    if (allowedHosts?.length) {
        return {
            allowedHosts,
            protocol: 'auto' as const
        };
    }

    if (!isProduction || isBuildPhase) {
        return {
            allowedHosts: ['localhost', 'localhost:*', '127.0.0.1', '127.0.0.1:*', '0.0.0.0', '0.0.0.0:*'],
            protocol: 'http' as const
        };
    }

    throw new Error('BETTER_AUTH_URL, NEXTAUTH_URL, VERCEL_URL, or BETTER_AUTH_ALLOWED_HOSTS must be set in production.');
};

const resolveAuthSecret = (): string => {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

    if (secret && secret.length >= 32) {
        return secret;
    }

    if (isProduction && !isBuildPhase) {
        throw new Error('BETTER_AUTH_SECRET must be set to a random value with at least 32 characters in production.');
    }

    return 'inkraft-local-dev-auth-secret-at-least-32-chars';
};

const authBaseURL = resolveAuthBaseURL();
const authSecret = resolveAuthSecret();

export const betterAuthInstance = betterAuth({
    ...(authBaseURL ? { baseURL: authBaseURL } : {}),
    secret: authSecret,
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
        headers: await headers(),
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

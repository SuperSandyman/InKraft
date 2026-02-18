import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

// 型拡張のためだけに必要。直接は使っていないが、拡張対象として明示。
import { JWT } from 'next-auth/jwt'; // eslint-disable-line @typescript-eslint/no-unused-vars

declare module 'next-auth' {
    interface User {
        githubId?: string;
        githubLogin?: string;
    }

    interface Session {
        accessToken?: string;
        user: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            githubId?: string;
            githubLogin?: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        githubId?: string;
        githubLogin?: string;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET || '',
            authorization: {
                params: {
                    scope: 'repo'
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token;
                token.githubId = account.providerAccountId;
            }
            if (profile && typeof profile === 'object' && 'login' in profile && typeof profile.login === 'string') {
                token.githubLogin = profile.login;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            if (session.user) {
                session.user.githubId = token.githubId;
                session.user.githubLogin = token.githubLogin;
            }
            return session;
        },
        async redirect() {
            return '/';
        }
    }
});

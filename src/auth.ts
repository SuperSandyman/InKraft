import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

// 型拡張のためだけに必要。直接は使っていないが、拡張対象として明示。
import { JWT } from 'next-auth/jwt'; // eslint-disable-line @typescript-eslint/no-unused-vars

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'repo read:user'
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            return session;
        },
        async redirect() {
            return '/';
        }
    }
});

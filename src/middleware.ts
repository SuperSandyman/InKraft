import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const allowedUsernamesEnv = process.env.ALLOWED_USERS ?? '';
const allowedUsernames = new Set(
    allowedUsernamesEnv
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
);

export default auth((req) => {
    const session = req.auth;
    const url = req.nextUrl.clone();
    const path = url.pathname;

    if (!session && path !== '/login') {
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (session && path === '/login') {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    const username = session?.user?.name ?? '';
    const isAllowed = username && allowedUsernames.has(username);

    if (session && !isAllowed && path !== '/unauthorized') {
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

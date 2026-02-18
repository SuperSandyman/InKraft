import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isUserAllowed } from '@/lib/allowed-users';

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

    const isAllowed = isUserAllowed(session);

    if (session && !isAllowed && path !== '/unauthorized') {
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

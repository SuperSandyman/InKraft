import { NextResponse, type NextRequest } from 'next/server';

import { getSessionFromHeaders } from '@/auth';
import { isUserAllowed } from '@/lib/allowed-users';

const buildContentSecurityPolicy = (): string => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const directives = [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
    ];

    const shouldUpgradeInsecureRequests =
        !isDevelopment &&
        (process.env.VERCEL === '1' ||
            process.env.BETTER_AUTH_URL?.startsWith('https://') ||
            process.env.NEXTAUTH_URL?.startsWith('https://'));

    if (shouldUpgradeInsecureRequests) {
        directives.push('upgrade-insecure-requests');
    }

    return directives.join('; ');
};

export async function proxy(req: NextRequest) {
    const session = await getSessionFromHeaders(req.headers);
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

    const contentSecurityPolicy = buildContentSecurityPolicy();
    const response = NextResponse.next();
    response.headers.set('content-security-policy', contentSecurityPolicy);

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

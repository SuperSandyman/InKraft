import type { NextConfig } from 'next';

const securityHeaders = [
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY'
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()'
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin'
    },
    {
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    }
];

const nextConfig: NextConfig = {
    poweredByHeader: false,
    turbopack: {},
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    ...securityHeaders,
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
                    }
                ]
            }
        ];
    }
};

export default nextConfig;

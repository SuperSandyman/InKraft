import type { NextConfig } from 'next';
import removeImports from 'next-remove-imports';

const nextConfig: NextConfig = {
    /* config options here */
    turbopack: {},
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
                    }
                ]
            }
        ];
    }
};

const withRemoveImports = removeImports();

export default withRemoveImports(nextConfig);

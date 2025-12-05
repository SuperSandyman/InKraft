import type { NextConfig } from 'next';
import removeImports from 'next-remove-imports';

const nextConfig: NextConfig = {
    /* config options here */
    turbopack: {}
};

const withRemoveImports = removeImports();

export default withRemoveImports(nextConfig);

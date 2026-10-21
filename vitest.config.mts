import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    cacheDir: 'node_modules/.vitest-cache',
    plugins: [react()],
    resolve: {
        tsconfigPaths: true
    },
    test: {
        environment: 'jsdom',
        fsModuleCachePath: 'node_modules/.vitest-cache'
    }
});

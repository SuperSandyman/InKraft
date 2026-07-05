import { toNextJsHandler } from 'better-auth/next-js';

import { betterAuthInstance } from '@/auth';

export const { GET, POST } = toNextJsHandler(betterAuthInstance);

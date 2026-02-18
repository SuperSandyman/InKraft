interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

const entries = new Map<string, RateLimitEntry>();

const cleanupExpiredEntries = (now: number) => {
    if (entries.size < 2000) {
        return;
    }

    for (const [key, entry] of entries.entries()) {
        if (entry.resetAt <= now) {
            entries.delete(key);
        }
    }
};

export const checkRateLimit = (key: string, config: RateLimitConfig): RateLimitResult => {
    const now = Date.now();
    cleanupExpiredEntries(now);

    const current = entries.get(key);
    if (!current || current.resetAt <= now) {
        entries.set(key, { count: 1, resetAt: now + config.windowMs });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            retryAfterSeconds: Math.ceil(config.windowMs / 1000)
        };
    }

    current.count += 1;
    entries.set(key, current);

    const remaining = Math.max(config.maxRequests - current.count, 0);
    return {
        allowed: current.count <= config.maxRequests,
        remaining,
        retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1)
    };
};

const isPrivateHostname = (hostname: string): boolean => {
    const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
        return true;
    }

    if (normalized === '::1' || normalized === '0.0.0.0') {
        return true;
    }

    if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized)) {
        return true;
    }

    if (/^169\.254\./.test(normalized) || /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)) {
        return true;
    }

    return /^f[cd][0-9a-f]{2}:/.test(normalized) || /^fe[89ab][0-9a-f]:/.test(normalized);
};

export const isSafeWebhookUrl = (value: string, isProduction = process.env.NODE_ENV === 'production'): boolean => {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return false;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
    }

    if (url.username || url.password) {
        return false;
    }

    if (isProduction && isPrivateHostname(url.hostname)) {
        return false;
    }

    return true;
};

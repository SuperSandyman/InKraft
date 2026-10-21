import { describe, expect, it } from 'vitest';

import { isSafeWebhookUrl } from '@/lib/webhook-url';

describe('isSafeWebhookUrl', () => {
    it('accepts public http(s) URLs', () => {
        expect(isSafeWebhookUrl('https://example.com/webhook')).toBe(true);
        expect(isSafeWebhookUrl('http://example.com/webhook', true)).toBe(true);
    });

    it('rejects non-http protocols', () => {
        expect(isSafeWebhookUrl('file:///etc/passwd')).toBe(false);
        expect(isSafeWebhookUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects credentials in URLs', () => {
        expect(isSafeWebhookUrl('https://user:pass@example.com/webhook')).toBe(false);
    });

    it('rejects private hosts in production', () => {
        expect(isSafeWebhookUrl('http://localhost:3000/webhook', true)).toBe(false);
        expect(isSafeWebhookUrl('http://127.0.0.1/webhook', true)).toBe(false);
        expect(isSafeWebhookUrl('http://192.168.1.10/webhook', true)).toBe(false);
        expect(isSafeWebhookUrl('http://169.254.169.254/latest/meta-data', true)).toBe(false);
        expect(isSafeWebhookUrl('http://[::1]/webhook', true)).toBe(false);
    });

    it('allows localhost outside production for development', () => {
        expect(isSafeWebhookUrl('http://localhost:3000/webhook', false)).toBe(true);
    });
});

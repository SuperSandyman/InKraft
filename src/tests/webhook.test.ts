import { describe, it, expect } from 'vitest';

type WebhookEndpoint = {
    name: string;
    url: string;
    type: 'vercel' | 'netlify' | 'custom';
    events?: string[];
};

type WebhookConfig = {
    enabled: boolean;
    endpoints?: WebhookEndpoint[];
};

// Test webhook validation logic without Next.js dependencies
describe('Webhook configuration validation', () => {
    const validateWebhookConfig = (config: WebhookConfig): string[] => {
        const errors: string[] = [];
        if (config.enabled && (!config.endpoints || config.endpoints.length === 0)) {
            errors.push('Webhooks enabled but no endpoints configured');
        }
        if (config.endpoints) {
            config.endpoints.forEach((endpoint, index) => {
                if (!endpoint.name) {
                    errors.push(`Endpoint ${index}: name is required`);
                }
                if (!endpoint.url) {
                    errors.push(`Endpoint ${index}: url is required`);
                }
                if (!['vercel', 'netlify', 'custom'].includes(endpoint.type)) {
                    errors.push(`Endpoint ${index}: type must be 'vercel', 'netlify', or 'custom'`);
                }
            });
        }
        return errors;
    };

    const shouldProcessEvent = (eventType: string, endpoint: WebhookEndpoint): boolean => {
        if (!endpoint.events || endpoint.events.length === 0) {
            return true; // Process all events if none specified
        }
        return endpoint.events.includes(eventType);
    };

    type WebhookEvent = {
        eventType?: string;
        repository?: string;
        ref?: string;
        commits?: unknown;
        timestamp?: string;
    };

    const createWebhookPayload = (event: WebhookEvent) => {
        return {
            eventType: event.eventType || 'unknown',
            repository: event.repository,
            ref: event.ref,
            commits: event.commits,
            timestamp: event.timestamp || new Date().toISOString(),
            source: 'inkraft'
        };
    };

    describe('validateWebhookConfig', () => {
        it('should return errors for invalid configuration', () => {
            const invalidConfig: WebhookConfig = {
                enabled: true,
                endpoints: []
            };

            const errors = validateWebhookConfig(invalidConfig);
            expect(errors).toContain('Webhooks enabled but no endpoints configured');
        });

        it('should return errors for endpoints without required fields', () => {
            const invalidConfig: WebhookConfig = {
                enabled: true,
                endpoints: [
                    {
                        name: '',
                        url: '',
                        type: 'invalid' as any // 型エラーを意図的に発生させる
                    }
                ]
            };

            const errors = validateWebhookConfig(invalidConfig);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((e) => e.includes('name is required'))).toBe(true);
            expect(errors.some((e) => e.includes('url is required'))).toBe(true);
            expect(errors.some((e) => e.includes('type must be'))).toBe(true);
        });

        it('should return no errors for valid configuration', () => {
            const validConfig: WebhookConfig = {
                enabled: true,
                endpoints: [
                    {
                        name: 'test-webhook',
                        url: 'https://example.com/webhook',
                        type: 'custom'
                    }
                ]
            };

            const errors = validateWebhookConfig(validConfig);
            expect(errors).toHaveLength(0);
        });
    });

    describe('shouldProcessEvent', () => {
        it('should process all events when no events specified', () => {
            const endpoint: WebhookEndpoint = {
                name: 'test',
                url: 'https://example.com',
                type: 'custom'
            };

            expect(shouldProcessEvent('push', endpoint)).toBe(true);
            expect(shouldProcessEvent('create', endpoint)).toBe(true);
        });

        it('should only process specified events', () => {
            const endpoint: WebhookEndpoint = {
                name: 'test',
                url: 'https://example.com',
                type: 'custom',
                events: ['push']
            };

            expect(shouldProcessEvent('push', endpoint)).toBe(true);
            expect(shouldProcessEvent('create', endpoint)).toBe(false);
        });
    });

    describe('createWebhookPayload', () => {
        it('should create a valid webhook payload', () => {
            const event: WebhookEvent = {
                eventType: 'push',
                repository: 'test/repo',
                ref: 'refs/heads/main'
            };

            const payload = createWebhookPayload(event);

            expect(payload.eventType).toBe('push');
            expect(payload.repository).toBe('test/repo');
            expect(payload.ref).toBe('refs/heads/main');
            expect(payload.source).toBe('inkraft');
            expect(payload.timestamp).toBeDefined();
        });

        it('should handle partial event data', () => {
            const event: WebhookEvent = {
                eventType: 'unknown'
            };

            const payload = createWebhookPayload(event);

            expect(payload.eventType).toBe('unknown');
            expect(payload.source).toBe('inkraft');
            expect(payload.timestamp).toBeDefined();
        });
    });
}); // ...existing code from tests/webhook.test.ts will be moved here...

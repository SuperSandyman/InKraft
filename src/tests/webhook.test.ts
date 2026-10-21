import { describe, expect, it } from 'vitest';

import {
    createWebhookPayload,
    shouldProcessEvent,
    validateWebhookConfig
} from '@/lib/webhook-validation';
import type { WebhookConfig, WebhookEndpoint } from '@/lib/webhook-validation';

describe('Webhook configuration validation', () => {
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
                        url: ''
                    }
                ]
            };

            const errors = validateWebhookConfig(invalidConfig);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((e) => e.includes('name is required'))).toBe(true);
            expect(errors.some((e) => e.includes('url is required'))).toBe(true);
        });

        it('should reject non-http and private webhook URLs', () => {
            const config: WebhookConfig = {
                enabled: true,
                endpoints: [{ name: 'bad', url: 'file:///etc/passwd' }]
            };

            expect(validateWebhookConfig(config)).toContain('Endpoint 0: url must be a safe http(s) URL');
        });

        it('should return no errors for valid configuration', () => {
            const validConfig: WebhookConfig = {
                enabled: true,
                endpoints: [
                    {
                        name: 'test-webhook',
                        url: 'https://example.com/webhook'
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
                url: 'https://example.com'
            };

            expect(shouldProcessEvent('push', endpoint)).toBe(true);
            expect(shouldProcessEvent('create', endpoint)).toBe(true);
        });

        it('should only process specified events', () => {
            const endpoint: WebhookEndpoint = {
                name: 'test',
                url: 'https://example.com',
                events: ['push']
            };

            expect(shouldProcessEvent('push', endpoint)).toBe(true);
            expect(shouldProcessEvent('create', endpoint)).toBe(false);
        });
    });

    describe('createWebhookPayload', () => {
        it('should create a valid webhook payload', () => {
            const payload = createWebhookPayload({
                eventType: 'push',
                repository: 'test/repo',
                ref: 'refs/heads/main'
            });

            expect(payload.eventType).toBe('push');
            expect(payload.repository).toBe('test/repo');
            expect(payload.ref).toBe('refs/heads/main');
            expect(payload.source).toBe('inkraft');
            expect(payload.timestamp).toBeDefined();
        });

        it('should handle partial event data', () => {
            const payload = createWebhookPayload({
                eventType: 'unknown'
            });

            expect(payload.eventType).toBe('unknown');
            expect(payload.source).toBe('inkraft');
            expect(payload.timestamp).toBeDefined();
        });
    });
});

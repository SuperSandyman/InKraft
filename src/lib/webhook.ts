import { getCmsConfig } from './content';
import { createWebhookPayload, shouldProcessEvent } from './webhook-validation';
import type { WebhookConfig, WebhookEndpoint } from './webhook-validation';
import { isSafeWebhookUrl } from './webhook-url';

export type { WebhookConfig, WebhookEndpoint, WebhookEvent, GitHubCommit } from './webhook-validation';
export { createWebhookPayload, shouldProcessEvent, validateWebhookConfig } from './webhook-validation';

export const getWebhookConfig = async (): Promise<WebhookConfig | null> => {
    try {
        const config = await getCmsConfig();
        const webhooks = config.webhooks || null;
        if (!webhooks) return null;
        // secretは環境変数優先
        return {
            ...webhooks,
            secret: process.env.WEBHOOK_SECRET || webhooks.secret || undefined
        };
    } catch (error) {
        console.error('Failed to get webhook config:', error);
        return null;
    }
};

/**
 * CMSアクション（create/update/delete）時にWebhookを発火
 */
export const triggerCmsWebhook = async (
    eventType: 'create' | 'update' | 'delete',
    data: {
        slug: string;
        directory: string;
        repository?: string;
    }
): Promise<void> => {
    try {
        const config = await getWebhookConfig();

        if (!config?.enabled || !config.endpoints) {
            return;
        }

        const webhookEvent = createWebhookPayload({
            eventType,
            repository: data.repository,
            timestamp: new Date().toISOString()
        });

        const filteredEndpoints = config.endpoints.filter(
            (endpoint) => isSafeWebhookUrl(endpoint.url) && shouldProcessEvent(eventType, endpoint)
        );
        const promises = filteredEndpoints.map(async (endpoint: WebhookEndpoint) => {
            try {
                const response = await fetch(endpoint.url, {
                    method: 'POST',
                    redirect: 'error',
                    signal: AbortSignal.timeout(5000),
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'InKraft-CMS/1.0'
                    },
                    body: JSON.stringify({
                        ...webhookEvent,
                        cms: {
                            slug: data.slug,
                            directory: data.directory,
                            action: eventType
                        }
                    })
                });
                if (!response.ok) {
                    console.error(`Webhook endpoint failed: ${endpoint.name} ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error(`Webhook endpoint error: ${endpoint.name}`, error);
            }
        });
        await Promise.allSettled(promises);
    } catch (error) {
        console.error('Webhook発火に失敗:', error);
    }
};

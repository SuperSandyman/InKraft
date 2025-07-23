import { getCmsConfig } from './content';

export interface WebhookEndpoint {
    name: string;
    url: string;
    events?: string[];
}

export interface WebhookConfig {
    enabled: boolean;
    secret?: string;
    endpoints?: WebhookEndpoint[];
}

export interface WebhookEvent {
    eventType: string;
    repository?: string;
    ref?: string;
    commits?: GitHubCommit[];
    timestamp: string;
    source: string;
}

export interface GitHubCommit {
    id: string;
    message: string;
    url: string;
    added: string[];
    modified: string[];
    removed: string[];
}

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

export const createWebhookPayload = (event: Partial<WebhookEvent>): WebhookEvent => {
    return {
        eventType: event.eventType || 'unknown',
        repository: event.repository,
        ref: event.ref,
        commits: event.commits,
        timestamp: event.timestamp || new Date().toISOString(),
        source: 'inkraft'
    };
};

export const shouldProcessEvent = (eventType: string, endpoint: WebhookEndpoint): boolean => {
    if (!endpoint.events || endpoint.events.length === 0) {
        return true; // Process all events if none specified
    }
    return endpoint.events.includes(eventType);
};

export const validateWebhookConfig = (config: WebhookConfig): string[] => {
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
        });
    }

    return errors;
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

        const filteredEndpoints = config.endpoints.filter((endpoint) => shouldProcessEvent(eventType, endpoint));
        const promises = filteredEndpoints.map(async (endpoint: WebhookEndpoint) => {
            try {
                await fetch(endpoint.url, {
                    method: 'POST',
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
            } catch {
                // ignore error
            }
        });
        await Promise.allSettled(promises);
    } catch {
        // ignore error
    }
};

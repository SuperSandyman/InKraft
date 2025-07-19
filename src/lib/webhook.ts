import { getCmsConfig } from './content';

export interface WebhookEndpoint {
    name: string;
    url: string;
    type: 'vercel' | 'netlify' | 'custom';
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
        return config.webhooks || null;
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
            if (!['vercel', 'netlify', 'custom'].includes(endpoint.type)) {
                errors.push(`Endpoint ${index}: type must be 'vercel', 'netlify', or 'custom'`);
            }
        });
    }

    return errors;
};
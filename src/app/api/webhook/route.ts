import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

import { 
    getWebhookConfig, 
    createWebhookPayload, 
    shouldProcessEvent,
    validateWebhookConfig,
    type WebhookEndpoint,
    type GitHubCommit
} from '@/lib/webhook';

interface GitHubRepository {
    full_name: string;
    default_branch: string;
}

interface GitHubWebhookPayload {
    ref?: string;
    repository?: GitHubRepository;
    commits?: GitHubCommit[];
    ref_type?: string;
}

// Webhook signature verification
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const computedSignature = `sha256=${hmac.digest('hex')}`;
    return computedSignature === signature;
};

// Trigger external webhooks
const triggerExternalWebhooks = async (eventType: string, payload: GitHubWebhookPayload) => {
    const config = await getWebhookConfig();
    
    if (!config?.enabled || !config.endpoints) {
        return;
    }

    const webhookEvent = createWebhookPayload({
        eventType,
        repository: payload.repository?.full_name,
        ref: payload.ref,
        commits: payload.commits,
    });

    const promises = config.endpoints
        .filter(endpoint => shouldProcessEvent(eventType, endpoint))
        .map(async (endpoint: WebhookEndpoint) => {
            try {
                const response = await fetch(endpoint.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'InKraft-Webhook/1.0'
                    },
                    body: JSON.stringify(webhookEvent)
                });

                if (!response.ok) {
                    console.error(`Webhook ${endpoint.name} failed:`, response.status, response.statusText);
                } else {
                    console.log(`Webhook ${endpoint.name} triggered successfully`);
                }
            } catch (error) {
                console.error(`Failed to trigger webhook ${endpoint.name}:`, error);
            }
        });

    await Promise.allSettled(promises);
};

export async function POST(req: NextRequest) {
    try {
        const config = await getWebhookConfig();
        
        if (!config?.enabled) {
            return NextResponse.json({ message: 'Webhooks not enabled' }, { status: 404 });
        }

        // Validate webhook configuration
        const configErrors = validateWebhookConfig(config);
        if (configErrors.length > 0) {
            console.error('Webhook configuration errors:', configErrors);
            return NextResponse.json({ errors: configErrors }, { status: 400 });
        }

        const body = await req.text();
        const signature = req.headers.get('x-hub-signature-256');
        const githubEvent = req.headers.get('x-github-event');

        // Verify webhook signature if secret is configured
        if (config.secret && signature) {
            if (!verifyWebhookSignature(body, signature, config.secret)) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const payload = JSON.parse(body);

        // Process different types of GitHub events
        let shouldTriggerWebhooks = false;

        switch (githubEvent) {
            case 'push':
                // Check if this is a push to content directories or main branch
                if (payload.ref === `refs/heads/${payload.repository.default_branch}`) {
                    shouldTriggerWebhooks = true;
                }
                break;

            case 'create':
            case 'delete':
                // Branch or tag creation/deletion
                shouldTriggerWebhooks = true;
                break;

            default:
                console.log(`Unhandled webhook event: ${githubEvent}`);
        }

        if (shouldTriggerWebhooks && githubEvent) {
            await triggerExternalWebhooks(githubEvent, payload);
        }

        return NextResponse.json({ 
            message: 'Webhook processed successfully',
            event: githubEvent,
            processed: shouldTriggerWebhooks
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle GET requests for webhook verification
export async function GET() {
    return NextResponse.json({ 
        message: 'InKraft Webhook Endpoint',
        version: '1.0',
        timestamp: new Date().toISOString()
    });
}
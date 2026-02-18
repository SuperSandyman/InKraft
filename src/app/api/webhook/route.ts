import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

import { getWebhookConfig, createWebhookPayload, shouldProcessEvent, validateWebhookConfig } from '@/lib/webhook';
import type { WebhookEndpoint, GitHubCommit } from '@/lib/webhook';

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
    if (!signature.startsWith('sha256=')) {
        return false;
    }

    const signatureHex = signature.slice('sha256='.length);
    if (!/^[a-f0-9]{64}$/i.test(signatureHex)) {
        return false;
    }

    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const computedSignature = Buffer.from(hmac.digest('hex'), 'hex');
    const receivedSignature = Buffer.from(signatureHex, 'hex');

    if (computedSignature.length !== receivedSignature.length) {
        return false;
    }

    return timingSafeEqual(computedSignature, receivedSignature);
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
        commits: payload.commits
    });
    const filteredEndpoints = config.endpoints.filter((endpoint) => shouldProcessEvent(eventType, endpoint));
    const promises = filteredEndpoints.map(async (endpoint: WebhookEndpoint) => {
        try {
            await fetch(endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'InKraft-Webhook/1.0'
                },
                body: JSON.stringify(webhookEvent)
            });
        } catch {
            // ignore error
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
            return NextResponse.json({ errors: configErrors }, { status: 400 });
        }
        const body = await req.text();
        const signature = req.headers.get('x-hub-signature-256');
        const githubEvent = req.headers.get('x-github-event');

        if (!config.secret) {
            return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
        }
        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }
        if (!verifyWebhookSignature(body, signature, config.secret)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        if (!githubEvent) {
            return NextResponse.json({ error: 'Missing event header' }, { status: 400 });
        }

        const payload = JSON.parse(body) as GitHubWebhookPayload;
        // Process different types of GitHub events
        let shouldTriggerWebhooks = false;
        switch (githubEvent) {
            case 'push':
                // Check if this is a push to content directories or main branch
                if (payload.ref === `refs/heads/${payload.repository?.default_branch}`) {
                    shouldTriggerWebhooks = true;
                }
                break;
            case 'create':
            case 'delete':
                // Branch or tag creation/deletion
                shouldTriggerWebhooks = true;
                break;
            default:
                break;
        }
        if (shouldTriggerWebhooks && githubEvent) {
            await triggerExternalWebhooks(githubEvent, payload);
        }
        const response = {
            message: 'Webhook processed successfully',
            event: githubEvent,
            processed: shouldTriggerWebhooks
        };
        return NextResponse.json(response);
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Handle GET requests for webhook verification
export async function GET() {
    const response = {
        message: 'InKraft Webhook Endpoint',
        version: '1.0',
        timestamp: new Date().toISOString()
    };
    return NextResponse.json(response);
}

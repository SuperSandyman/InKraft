import { createVertex } from '@ai-sdk/google-vertex';
import { createOpenAI } from '@ai-sdk/openai';

type AiProvider = 'google-vertex' | 'openai';

const resolveProvider = (): AiProvider => {
    const provider = (process.env.AI_PROVIDER || process.env.CONTENT_TEMPLATE_AI_PROVIDER || 'google-vertex')
        .trim()
        .toLowerCase();

    if (provider === 'google-vertex' || provider === 'openai') {
        return provider;
    }

    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
};

const parseGoogleCredentials = (): Record<string, unknown> => {
    const raw = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!raw) {
        throw new Error('GOOGLE_CREDENTIALS_JSON is required when AI_PROVIDER=google-vertex');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error('GOOGLE_CREDENTIALS_JSON is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('GOOGLE_CREDENTIALS_JSON must be a JSON object');
    }

    return parsed as Record<string, unknown>;
};

const getModel = (vertexModel: string, openAiModel: string) => {
    const provider = resolveProvider();

    if (provider === 'openai') {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
        }

        const openai = createOpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        return openai(openAiModel);
    }

    const vertex = createVertex({
        project: process.env.GOOGLE_VERTEX_PROJECT_ID,
        location: process.env.GOOGLE_VERTEX_LOCATION,
        googleAuthOptions: { credentials: parseGoogleCredentials() }
    });

    return vertex(vertexModel);
};

export const getTemplateModel = () =>
    getModel(
        process.env.GOOGLE_VERTEX_MODEL || 'gemini-2.5-flash',
        process.env.OPENAI_MODEL || 'gpt-4.1-mini'
    );

export const getTranslationModel = () =>
    getModel(
        process.env.GOOGLE_VERTEX_TRANSLATION_MODEL || process.env.GOOGLE_VERTEX_MODEL || 'gemini-2.5-flash',
        process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini'
    );

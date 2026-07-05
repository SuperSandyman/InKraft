import { NextRequest } from 'next/server';

import { createVertex } from '@ai-sdk/google-vertex';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { isUserAllowed } from '@/lib/allowed-users';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const aiProvider = process.env.AI_PROVIDER || process.env.CONTENT_TEMPLATE_AI_PROVIDER || 'google-vertex';

// 記事テンプレ生成用プロンプト
const templatePrompt = `
あなたは技術ブログの編集者です。以下のテーマに沿った記事の構成テンプレート（見出し・導入文・アウトライン）をMarkdown形式で生成してください。

# 指示
- 必ず導入文、h2見出し2つ以上を含めてください。
- 例:
  導入文
  ## 見出し1
  ### 小見出し1-1
  ### 小見出し1-2
  ## 見出し2
  ...
- 文章量は全体で1000文字程度を目安にしてください。
`;

const getTemplateModel = () => {
    if (aiProvider === 'openai') {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
        }
        const openai = createOpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        return openai(process.env.OPENAI_MODEL || 'gpt-4.1-mini');
    }

    if (aiProvider === 'google-vertex') {
        if (!process.env.GOOGLE_CREDENTIALS_JSON) {
            throw new Error('GOOGLE_CREDENTIALS_JSON is required when AI_PROVIDER=google-vertex');
        }
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        const vertex = createVertex({
            project: process.env.GOOGLE_VERTEX_PROJECT_ID,
            location: process.env.GOOGLE_VERTEX_LOCATION,
            googleAuthOptions: { credentials }
        });
        return vertex(process.env.GOOGLE_VERTEX_MODEL || 'gemini-2.5-flash');
    }

    throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}`);
};

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        if (!isUserAllowed(session)) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const requestKey = session.user.githubId || session.user.githubLogin || session.user.email || 'unknown-user';
        const limit = checkRateLimit(`ai:${requestKey}`, { windowMs: 10 * 60 * 1000, maxRequests: 30 });
        if (!limit.allowed) {
            return new Response(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Retry-After': String(limit.retryAfterSeconds) }
            });
        }

        const { theme } = await req.json();
        if (!theme || typeof theme !== 'string') {
            return new Response(JSON.stringify({ error: 'テーマを指定してください。' }), { status: 400 });
        }
        if (theme.length > 500) {
            return new Response(JSON.stringify({ error: 'テーマが長すぎます。500文字以内で指定してください。' }), {
                status: 400
            });
        }

        const result = await streamText({
            model: getTemplateModel(),
            messages: [
                { role: 'system', content: templatePrompt },
                { role: 'user', content: `テーマ: ${theme}` }
            ]
        });
        return new Response(result.textStream, {
            headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
    } catch (error) {
        console.error('AI template generation failed:', error);
        return new Response(JSON.stringify({ error: 'テンプレ生成に失敗しました。' }), { status: 500 });
    }
}

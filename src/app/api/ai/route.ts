import { NextRequest } from 'next/server';

import { streamText } from 'ai';
import { auth } from '@/auth';
import { getTemplateModel } from '@/lib/ai-provider';
import { isUserAllowed } from '@/lib/allowed-users';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

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

        const contentLength = Number(req.headers.get('content-length') ?? '0');
        if (!Number.isFinite(contentLength) || contentLength > 10_000) {
            return new Response(JSON.stringify({ error: 'リクエストが大きすぎます。' }), { status: 413 });
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: 'JSON形式が不正です。' }), { status: 400 });
        }

        const theme = typeof body === 'object' && body !== null && 'theme' in body ? body.theme : undefined;
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

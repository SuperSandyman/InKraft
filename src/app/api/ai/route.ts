import { NextRequest } from 'next/server';

import { createVertex } from '@ai-sdk/google-vertex';
import { streamText } from 'ai';

export const runtime = 'nodejs';

// 環境変数から認証情報を取得
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON!);
const project = process.env.GOOGLE_VERTEX_PROJECT_ID;
const location = process.env.GOOGLE_VERTEX_LOCATION;

const vertex = createVertex({
    project,
    location,
    googleAuthOptions: { credentials }
});

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
        const { theme } = await req.json();
        if (!theme || typeof theme !== 'string') {
            return new Response(JSON.stringify({ error: 'テーマを指定してください。' }), { status: 400 });
        }

        const result = await streamText({
            model: vertex('gemini-2.5-flash'),
            messages: [
                { role: 'system', content: templatePrompt },
                { role: 'user', content: `テーマ: ${theme}` }
            ]
        });
        return new Response(result.textStream, {
            headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'テンプレ生成に失敗しました。', detail: String(error) }), {
            status: 500
        });
    }
}

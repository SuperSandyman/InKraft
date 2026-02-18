import { NextRequest, NextResponse } from 'next/server';

import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import { auth } from '@/auth';
import { isUserAllowed } from '@/lib/allowed-users';
import { checkRateLimit } from '@/lib/rate-limit';

const HN_API = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HN_ITEM_API = 'https://hacker-news.firebaseio.com/v0/item';
const CACHE_TTL = 60 * 60 * 24; // 24時間

interface NewsItem {
    title: string;
    url: string;
    author: string;
    translated: string;
}

// Vercel Edgeキャッシュを利用（Node.jsならグローバル変数で簡易キャッシュ）
let memoryCache: { data: NewsItem[]; expires: number } | null = null;

// Vertex AIの初期化（api/ai/route.tsと同じ方式）
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON!);
const project = process.env.GOOGLE_VERTEX_PROJECT_ID;
const location = process.env.GOOGLE_VERTEX_LOCATION;
const vertex = createVertex({
    project,
    location,
    googleAuthOptions: { credentials }
});

async function fetchHackerNewsTopStories(limit = 15) {
    const idsRes = await fetch(HN_API);
    const ids: number[] = await idsRes.json();
    const topIds = ids.slice(0, limit);
    const items = await Promise.all(
        topIds.map(async (id) => {
            const res = await fetch(`${HN_ITEM_API}/${id}.json`);
            return res.json();
        })
    );
    return items.filter((item) => item && item.title && item.url && item.by);
}

async function translateTitle(title: string): Promise<string> {
    // タイトル翻訳（日本語論文タイトルとして自然で簡潔な表現にしてください。複数案は不要です）
    const { text: translated } = await generateText({
        model: vertex('gemini-2.0-flash-lite-001'),
        prompt: `次の英文タイトルを日本語の論文タイトルとして自然で簡潔な表現に翻訳してください。複数案は不要です。\n\n${title}`
    });
    return translated;
}

export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isUserAllowed(session)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestKey = session.user.githubId || session.user.githubLogin || session.user.email || 'unknown-user';
    const limit = checkRateLimit(`hackernews:${requestKey}`, { windowMs: 10 * 60 * 1000, maxRequests: 60 });
    if (!limit.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // メモリキャッシュ
    if (memoryCache && memoryCache.expires > Date.now()) {
        return NextResponse.json(memoryCache.data);
    }
    const items = await fetchHackerNewsTopStories(15);
    const results: NewsItem[] = await Promise.all(
        items.map(async (item) => {
            const translated = await translateTitle(item.title);
            return {
                title: item.title,
                url: item.url,
                author: item.by,
                translated
            };
        })
    );
    memoryCache = { data: results, expires: Date.now() + CACHE_TTL * 1000 };
    return NextResponse.json(results);
}

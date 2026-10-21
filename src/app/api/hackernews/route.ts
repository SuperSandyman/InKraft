import { NextResponse } from 'next/server';

import { generateText } from 'ai';
import { auth } from '@/auth';
import { getTranslationModel } from '@/lib/ai-provider';
import { isUserAllowed } from '@/lib/allowed-users';
import { checkRateLimit } from '@/lib/rate-limit';

const HN_API = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HN_ITEM_API = 'https://hacker-news.firebaseio.com/v0/item';
const CACHE_TTL = 60 * 60 * 24; // 24時間
const FETCH_TIMEOUT_MS = 8000;

interface NewsItem {
    title: string;
    url: string;
    author: string;
    translated: string;
}

interface HackerNewsItem {
    id?: number;
    title?: string;
    url?: string;
    by?: string;
}

interface HackerNewsStory {
    title: string;
    url: string;
    by: string;
}

// Vercel Edgeキャッシュを利用（Node.jsならグローバル変数で簡易キャッシュ）
let memoryCache: { data: NewsItem[]; expires: number } | null = null;

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!response.ok) {
        throw new Error(`Hacker News API returned ${response.status}`);
    }
    return (await response.json()) as T;
};

async function fetchHackerNewsTopStories(limit = 15): Promise<HackerNewsStory[]> {
    const ids = await fetchJson<number[]>(HN_API);
    const topIds = Array.isArray(ids) ? ids.slice(0, limit) : [];
    const items = await Promise.all(
        topIds.map(async (id) => {
            try {
                return await fetchJson<HackerNewsItem>(`${HN_ITEM_API}/${id}.json`);
            } catch {
                return null;
            }
        })
    );
    return items.flatMap<HackerNewsStory>((item) => {
        if (!item || !item.title || !item.url || !item.by || !isHttpUrl(item.url)) {
            return [];
        }

        return [{ title: item.title, url: item.url, by: item.by }];
    });
}

async function translateTitle(title: string): Promise<string> {
    try {
        const { text: translated } = await generateText({
            model: getTranslationModel(),
            prompt: `次の英文タイトルを日本語の論文タイトルとして自然で簡潔な表現に翻訳してください。複数案は不要です。\n\n${title}`
        });
        return translated.trim() || title;
    } catch (error) {
        console.error('Hacker News title translation failed:', error);
        return title;
    }
}

export async function GET() {
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
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
        );
    }

    // メモリキャッシュ
    if (memoryCache && memoryCache.expires > Date.now()) {
        return NextResponse.json(memoryCache.data);
    }

    try {
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
    } catch (error) {
        console.error('Hacker News fetch failed:', error);
        return NextResponse.json({ error: 'Hacker Newsの取得に失敗しました。' }, { status: 502 });
    }
}

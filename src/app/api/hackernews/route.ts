import { NextResponse } from 'next/server';

import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';

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
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
const project = process.env.GOOGLE_VERTEX_PROJECT_ID;
const location = process.env.GOOGLE_VERTEX_LOCATION;

let vertex: ReturnType<typeof createVertex> | null = null;

if (credentialsJson && project && location) {
    try {
        const credentials = JSON.parse(credentialsJson);
        vertex = createVertex({
            project,
            location,
            googleAuthOptions: { credentials }
        });
    } catch (error) {
        console.warn('Failed to initialize Google Vertex AI for hackernews:', error);
    }
}

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
    if (!vertex) {
        return title; // Return original title if AI is not available
    }
    // タイトル翻訳（日本語論文タイトルとして自然で簡潔な表現にしてください。複数案は不要です）
    try {
        const { text: translated } = await generateText({
            model: vertex('gemini-2.0-flash-lite-001'),
            prompt: `次の英文タイトルを日本語の論文タイトルとして自然で簡潔な表現に翻訳してください。複数案は不要です。\n\n${title}`
        });
        return translated;
    } catch (error) {
        console.warn('Translation failed:', error);
        return title; // Return original title on error
    }
}

export async function GET() {
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

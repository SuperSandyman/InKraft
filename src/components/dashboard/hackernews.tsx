'use client';

import * as React from 'react';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NewsItem {
    title: string;
    url: string;
    author: string;
    translated: string;
}

const fetchHackerNews = async (): Promise<NewsItem[]> => {
    const res = await fetch('/api/hackernews', { cache: 'force-cache' });
    if (!res.ok) return [];
    return res.json();
};

const PAGE_SIZE = 3;

const HackerNewsCard: React.FC = () => {
    const [newsList, setNewsList] = React.useState<NewsItem[]>([]);
    const [page, setPage] = React.useState<number>(0);
    const [loading, setLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
        let ignore = false;
        setLoading(true);
        fetchHackerNews().then((data) => {
            if (!ignore) {
                setNewsList(data);
                setLoading(false);
            }
        });
        return () => {
            ignore = true;
        };
    }, []);

    const maxPage = Math.max(0, Math.ceil(newsList.length / PAGE_SIZE) - 1);
    const pageItems = newsList.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <Card className="sm:h-full h-auto flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">ニュース（HackerNewsより）</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-2 min-h-0">
                {loading ? (
                    <div className="text-sm text-muted-foreground">読み込み中...</div>
                ) : newsList.length === 0 ? (
                    <div className="text-sm text-muted-foreground">記事が見つかりませんでした。</div>
                ) : (
                    <ul className="space-y-2">
                        {pageItems.map((news) => (
                            <li key={news.url}>
                                <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base font-medium text-foreground hover:underline break-words"
                                >
                                    {news.translated || news.title}
                                </a>
                                <div className="text-xs text-muted-foreground mt-0.5 ml-1">by {news.author}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
            {!loading && newsList.length > 0 && (
                <CardFooter className="px-4 py-2 flex justify-between">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(p - 1, 0))}
                        disabled={page === 0}
                    >
                        前へ
                    </Button>
                    <div className="text-xs text-muted-foreground">
                        {page + 1} / {maxPage + 1}
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(p + 1, maxPage))}
                        disabled={page === maxPage}
                    >
                        次へ
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default HackerNewsCard;

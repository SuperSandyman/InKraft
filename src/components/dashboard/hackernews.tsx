import * as React from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface NewsItem {
    title: string;
    url: string;
    author: string;
}

const newsList: NewsItem[] = [
    {
        title: 'Next.js 14.0 リリース、新機能多数追加',
        url: 'https://nextjs.org/blog/next-14',
        author: 'vercel'
    },
    {
        title: 'GitHub Copilot、AI コーディングの新時代へ',
        url: 'https://github.blog/copilot',
        author: 'github'
    },
    {
        title: 'Vercel、Edge Functions の無料枠拡大',
        url: 'https://vercel.com/changelog',
        author: 'vercel'
    }
];

const HackerNewsCard: React.FC = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">ニュース（HackerNewsより）</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2 gap-2 justify-start">
                <ul className="flex flex-col gap-3">
                    {newsList.map((news) => (
                        <li key={news.url} className="">
                            <a
                                href={news.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base font-medium text-foreground hover:underline focus:underline transition-colors"
                            >
                                {news.title}
                            </a>
                            <div className="text-xs text-muted-foreground mt-0.5 ml-1">by {news.author}</div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export default HackerNewsCard;

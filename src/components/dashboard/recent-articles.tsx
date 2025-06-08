import * as React from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Article {
    id: string;
    title: string;
    date: string; // YYYY/MM/DD
    category: string;
    tags: string[];
}

const dummyArticles: Article[] = [
    {
        id: '1',
        title: 'Next.jsで作るモダンCMSの設計',
        date: '2025/06/08',
        category: '技術解説',
        tags: ['Next.js', 'CMS', '設計']
    },
    {
        id: '2',
        title: 'GitHub Actionsで自動デプロイ',
        date: '2025/06/05',
        category: 'CI/CD',
        tags: ['GitHub', 'CI/CD']
    },
    {
        id: '3',
        title: 'Tailwind CSSでダッシュボードUI',
        date: '2025/06/01',
        category: 'UI/デザイン',
        tags: ['Tailwind CSS', 'UI']
    }
];

const RecentArticles: React.FC = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">最近の記事</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-sm rounded-xl">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                                    タイトル
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                                    カテゴリ
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                                    日付
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                                    タグ
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dummyArticles.map((a, i) => (
                                <tr
                                    key={a.id}
                                    className={`border-b dark:border-gray-700 ${
                                        i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                                    }`}
                                >
                                    <td className="px-5 py-3 whitespace-nowrap font-semibold text-gray-900 dark:text-gray-100">
                                        {a.title}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                                        {a.category}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                        {a.date}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            {a.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded text-xs font-medium"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentArticles;

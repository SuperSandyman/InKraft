import * as React from 'react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Content } from '@/lib/content';

interface RecentArticlesProps {
    articles: Content[];
}

const getStringField = (content: Content, fieldName: string): string => {
    const field = content[fieldName];
    return typeof field === 'string' ? field : '';
};

const getArrayField = (content: Content, fieldName: string): string[] => {
    const field = content[fieldName];
    if (Array.isArray(field)) return field.filter((item) => typeof item === 'string');
    if (typeof field === 'string') return [field];
    return [];
};

const RecentArticles: React.FC<RecentArticlesProps> = ({ articles }) => {
    return (
        <Card className="h-auto w-full min-w-0">
            <CardHeader className="pb-0">
                <CardTitle className="text-base font-bold">最近の記事</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-gray-200 whitespace-nowrap">
                                    タイトル
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-gray-200 whitespace-nowrap">
                                    カテゴリ
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-gray-200 whitespace-nowrap">
                                    日付
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-gray-200 whitespace-nowrap">
                                    タグ
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map((a) => {
                                const title = getStringField(a, 'title') || a.slug;
                                const categories = getArrayField(a, 'categories');
                                const date = getStringField(a, 'date');
                                const tags = getArrayField(a, 'tags');
                                return (
                                    <tr key={a.slug} className="border-b border-slate-100 last:border-0 dark:border-gray-700">
                                        <td className="max-w-[420px] px-4 py-3 whitespace-nowrap font-bold text-slate-800 dark:text-gray-100">
                                            <Link
                                                href={`/contents/${a.slug}/edit`}
                                                className="block truncate transition-colors hover:text-blue-600"
                                            >
                                                {title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                                            <div className="flex gap-2">
                                                {categories.map((cat) => (
                                                    <span
                                                        key={cat}
                                                        className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:bg-gray-800 dark:text-gray-200"
                                                    >
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600 dark:text-gray-300">
                                            {date}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                {tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-block rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:bg-gray-700 dark:text-gray-200"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center">
                    <a href="/contents" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                        すべての記事を見る →
                    </a>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentArticles;

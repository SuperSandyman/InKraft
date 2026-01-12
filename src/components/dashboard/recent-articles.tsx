import * as React from 'react';

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
        <Card className="sm:h-full h-auto flex flex-col w-full min-w-0">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">最近の記事</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-sm rounded-xl">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                    タイトル
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                    カテゴリ
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                    日付
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
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
                                    <tr key={a.slug} className="border-b dark:border-gray-700">
                                        <td className="px-5 py-3 whitespace-nowrap font-semibold text-gray-900 dark:text-gray-100">
                                            {title}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                                            <div className="flex gap-2">
                                                {categories.map((cat) => (
                                                    <span
                                                        key={cat}
                                                        className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded text-xs font-medium"
                                                    >
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            {date}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                {tags.map((tag) => (
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentArticles;

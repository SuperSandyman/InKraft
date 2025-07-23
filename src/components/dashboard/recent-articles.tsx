import * as React from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/lib/content';
import { useIsMobile } from '@/hooks/use-mobile';

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
    const isMobile = useIsMobile();

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">最近の記事</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2">
                {isMobile ? (
                    // モバイル用のリストレイアウト
                    <div className="space-y-3">
                        {articles.map((a) => {
                            const title = getStringField(a, 'title') || a.slug;
                            const categories = getArrayField(a, 'categories');
                            const date = getStringField(a, 'date');
                            const tags = getArrayField(a, 'tags');
                            return (
                                <div key={a.slug} className="border-b pb-3 last:border-b-0 last:pb-0">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm line-clamp-2 leading-5">
                                            {title}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{date}</span>
                                            {categories.length > 0 && (
                                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                                    {categories[0]}
                                                </Badge>
                                            )}
                                        </div>
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {tags.slice(0, 3).map((tag) => (
                                                    <Badge 
                                                        key={tag} 
                                                        variant="outline" 
                                                        className="text-xs px-1.5 py-0.5"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {tags.length > 3 && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-xs px-1.5 py-0.5"
                                                    >
                                                        +{tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // デスクトップ用のテーブルレイアウト（既存のコード）
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
                                                <div className="flex flex-wrap gap-2">
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
                                                <div className="flex flex-wrap gap-2">
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
                )}
            </CardContent>
        </Card>
    );
};

export default RecentArticles;

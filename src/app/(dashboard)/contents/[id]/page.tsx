'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Article {
    id: string;
    title: string;
    slug: string;
    status: 'published' | 'draft';
    category: string;
    tags: string[];
    author: string;
    publishedAt: string | null;
    updatedAt: string;
    excerpt: string;
    readTime: number;
}

// ダミーデータ（実際のAPIから取得する想定）
const mockArticles: Article[] = [
    {
        id: '1',
        title: 'Next.js 15の新機能について詳しく解説',
        slug: 'nextjs-15-new-features',
        status: 'published',
        category: 'Technology',
        tags: ['Next.js', 'React', 'Web Development'],
        author: '田中太郎',
        publishedAt: '2024-12-10T09:00:00Z',
        updatedAt: '2024-12-10T09:00:00Z',
        excerpt: 'Next.js 15がリリースされました。新しい機能や改善点について詳しく見ていきましょう。',
        readTime: 8
    },
    {
        id: '2',
        title: 'TypeScriptでの型安全な開発手法',
        slug: 'typescript-type-safe-development',
        status: 'published',
        category: 'Programming',
        tags: ['TypeScript', 'Type Safety', 'Development'],
        author: '山田花子',
        publishedAt: '2024-12-08T14:30:00Z',
        updatedAt: '2024-12-08T14:30:00Z',
        excerpt: 'TypeScriptを使った型安全な開発について、実践的な手法を紹介します。',
        readTime: 12
    },
    {
        id: '3',
        title: 'React Server Componentsの基礎',
        slug: 'react-server-components-basics',
        status: 'draft',
        category: 'React',
        tags: ['React', 'Server Components', 'SSR'],
        author: '佐藤一郎',
        publishedAt: null,
        updatedAt: '2024-12-07T16:45:00Z',
        excerpt: 'React Server Componentsの基本概念と使い方について解説します。',
        readTime: 10
    },
    {
        id: '4',
        title: 'Tailwind CSSで効率的なスタイリング',
        slug: 'efficient-styling-with-tailwind',
        status: 'published',
        category: 'CSS',
        tags: ['Tailwind CSS', 'Styling', 'Design'],
        author: '鈴木美咲',
        publishedAt: '2024-12-05T11:20:00Z',
        updatedAt: '2024-12-05T11:20:00Z',
        excerpt: 'Tailwind CSSを使った効率的なスタイリング手法について説明します。',
        readTime: 6
    },
    {
        id: '5',
        title: 'GraphQLとREST APIの比較検討',
        slug: 'graphql-vs-rest-api-comparison',
        status: 'draft',
        category: 'API',
        tags: ['GraphQL', 'REST', 'API Design'],
        author: '高橋健太',
        publishedAt: null,
        updatedAt: '2024-12-03T13:15:00Z',
        excerpt: 'GraphQLとREST APIの特徴を比較し、適切な選択について考察します。',
        readTime: 15
    },
    {
        id: '6',
        title: 'Dockerコンテナでの開発環境構築',
        slug: 'docker-development-environment',
        status: 'published',
        category: 'DevOps',
        tags: ['Docker', 'Development', 'Environment'],
        author: '田中太郎',
        publishedAt: '2024-12-01T08:00:00Z',
        updatedAt: '2024-12-01T08:00:00Z',
        excerpt: 'Dockerを使った効率的な開発環境の構築方法について詳しく解説します。',
        readTime: 9
    }
];

const ITEMS_PER_PAGE = 3;

export default function ArticlesPaginatedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const status = (searchParams.get('status') as 'published' | 'draft' | 'all') || 'all';

    // ステータスでフィルタリング
    const filteredArticles =
        status === 'all' ? mockArticles : mockArticles.filter((article) => article.status === status);

    // ページネーション計算
    const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`?${params.toString()}`);
    };

    const handleStatusChange = (newStatus: 'published' | 'draft' | 'all') => {
        const params = new URLSearchParams(searchParams);
        params.set('status', newStatus);
        params.delete('page'); // ステータス変更時はページをリセット
        router.push(`?${params.toString()}`);
    };

    const getStatusBadgeVariant = (articleStatus: 'published' | 'draft') => {
        return articleStatus === 'published' ? 'default' : 'secondary';
    };

    const getStatusText = (articleStatus: 'published' | 'draft') => {
        return articleStatus === 'published' ? '公開中' : '下書き';
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* ヘッダー部分 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">記事一覧（ページネーション）</h1>
                    <p className="text-muted-foreground">
                        {status === 'all' && `全ての記事 (${filteredArticles.length}件)`}
                        {status === 'published' && `公開中の記事 (${filteredArticles.length}件)`}
                        {status === 'draft' && `下書きの記事 (${filteredArticles.length}件)`}
                        {' • '}
                        ページ {currentPage} / {totalPages}
                    </p>
                </div>
                <Button>新規記事作成</Button>
            </div>

            {/* フィルタボタン */}
            <div className="flex gap-2">
                <Button variant={status === 'all' ? 'default' : 'secondary'} onClick={() => handleStatusChange('all')}>
                    全て
                </Button>
                <Button
                    variant={status === 'published' ? 'default' : 'secondary'}
                    onClick={() => handleStatusChange('published')}
                >
                    公開中
                </Button>
                <Button
                    variant={status === 'draft' ? 'default' : 'secondary'}
                    onClick={() => handleStatusChange('draft')}
                >
                    下書き
                </Button>
            </div>

            {/* 記事一覧カード */}
            <div className="grid gap-6">
                {paginatedArticles.map((article) => (
                    <Card key={article.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusBadgeVariant(article.status)}>
                                            {getStatusText(article.status)}
                                        </Badge>
                                        <Badge variant="secondary">{article.category}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            読了時間: {article.readTime}分
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        編集
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        削除
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {article.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>著者: {article.author}</span>
                                <div className="flex gap-4">
                                    <span>公開: {formatDate(article.publishedAt)}</span>
                                    <span>更新: {formatDate(article.updatedAt)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ページネーション */}
            <div className="flex items-center justify-center gap-2">
                <Button variant="outline" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
                    前のページ
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                    >
                        {page}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    次のページ
                </Button>
            </div>

            {paginatedArticles.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">記事が見つかりませんでした</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

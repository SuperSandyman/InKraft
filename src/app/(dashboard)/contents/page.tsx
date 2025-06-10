import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import React from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getArticles } from '@/lib/articles';

interface ArticlesPageProps {
    searchParams: Promise<{
        status?: 'published' | 'draft' | 'all';
    }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
    const { status = 'all' } = await searchParams;
    const { articles, totalCount } = await getArticles({ status });

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
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/">ダッシュボード</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>記事一覧</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="space-y-6">
                        {/* ヘッダー部分 */}
                        <div className="flex items-center justify-between px-2 md:px-4 mt-8 mb-6">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight mb-2">記事一覧</h1>
                                <p className="text-base text-muted-foreground">
                                    {status === 'all' && `全ての記事 (${totalCount}件)`}
                                    {status === 'published' && `公開中の記事 (${totalCount}件)`}
                                    {status === 'draft' && `下書きの記事 (${totalCount}件)`}
                                </p>
                            </div>
                            <Button size="default" className="h-10 px-6 text-sm font-semibold">
                                新規記事作成
                            </Button>
                        </div>

                        {/* フィルタボタン */}
                        <div className="flex gap-2 px-2 md:px-4 mb-6">
                            <Link
                                href="/contents"
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    status === 'all'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                            >
                                全て
                            </Link>
                            <Link
                                href="/contents?status=published"
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    status === 'published'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                            >
                                公開中
                            </Link>
                            <Link
                                href="/contents?status=draft"
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    status === 'draft'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                            >
                                下書き
                            </Link>
                        </div>

                        {/* 記事一覧テーブル */}
                        <Card>
                            <CardHeader>
                                <CardTitle>記事リスト</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">タイトル</th>
                                                <th className="text-left py-3 px-4 font-medium">ステータス</th>
                                                <th className="text-left py-3 px-4 font-medium">カテゴリ</th>
                                                <th className="text-left py-3 px-4 font-medium">著者</th>
                                                <th className="text-left py-3 px-4 font-medium">公開日</th>
                                                <th className="text-left py-3 px-4 font-medium">更新日</th>
                                                <th className="text-left py-3 px-4 font-medium">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {articles.map((article) => (
                                                <tr key={article.id} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <div className="font-medium line-clamp-1">
                                                                {article.title}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                                {article.excerpt}
                                                            </div>
                                                            <div className="flex gap-1 mt-2">
                                                                {article.tags.slice(0, 3).map((tag) => (
                                                                    <Badge
                                                                        key={tag}
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                                {article.tags.length > 3 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        +{article.tags.length - 3}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant={getStatusBadgeVariant(article.status)}>
                                                            {getStatusText(article.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="secondary">{article.category}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">{article.author}</td>
                                                    <td className="py-3 px-4 text-sm">
                                                        {formatDate(article.publishedAt)}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        {formatDate(article.updatedAt)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm">
                                                                編集
                                                            </Button>
                                                            <Button variant="outline" size="sm">
                                                                削除
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {articles.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">記事が見つかりませんでした</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

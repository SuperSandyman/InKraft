'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Content } from '@/lib/content';
import { deleteArticle } from '@/app/actions/delete-article';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface ContentsTableProps {
    contents: Content[];
}

const getStatusBadgeVariant = (status: 'published' | 'draft') => (status === 'published' ? 'default' : 'secondary');

const getStatusText = (status: 'published' | 'draft') => (status === 'published' ? '公開中' : '下書き');

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// 安全にフィールドを取得するヘルパー関数
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

const ContentsTable = ({ contents }: ContentsTableProps) => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = (slug: string, directory: string) => {
        if (!confirm('本当に削除しますか？')) return;
        startTransition(async () => {
            await deleteArticle({ slug, directory });
            router.refresh();
            window.location.reload(); // 強制リロードで最新情報を取得
        });
    };

    return (
        <div className="rounded-lg border border-border/70 bg-white p-3 shadow-[0_12px_32px_rgba(27,42,71,0.07)] sm:p-4">
            <div className="space-y-2">
                {contents.map((content) => {
                    const tags = getArrayField(content, 'tags');
                    const status: 'published' | 'draft' = content.isDraft ? 'draft' : 'published';
                    const title = getStringField(content, 'title') || content.slug;
                    const author = getStringField(content, 'author');
                    const categories = getArrayField(content, 'categories');
                    const publishedAt = getStringField(content, 'date');
                    const updatedAt = getStringField(content, 'updateDate') || publishedAt;
                    const excerpt = content.excerpt || '';

                    return (
                        <article
                            key={content.slug}
                            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50/80 sm:p-4"
                        >
                            <Link href={`/contents/${content.slug}/edit`} className="min-w-0">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <h2 className="min-w-0 truncate text-base font-extrabold text-slate-800">
                                        {title}
                                    </h2>
                                    <Badge variant={getStatusBadgeVariant(status)} className="shrink-0">
                                        {getStatusText(status)}
                                    </Badge>
                                </div>
                                <p className="mt-2 line-clamp-2 max-w-full break-words text-sm leading-6 text-muted-foreground">
                                    {excerpt || '説明文はありません'}
                                </p>
                                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                                    <span className="shrink-0">{formatDate(publishedAt)}</span>
                                    <span className="hidden text-slate-300 sm:inline">/</span>
                                    <span className="hidden shrink-0 sm:inline">更新 {formatDate(updatedAt)}</span>
                                    {author && (
                                        <>
                                            <span className="hidden text-slate-300 sm:inline">/</span>
                                            <span className="max-w-[140px] truncate">{author}</span>
                                        </>
                                    )}
                                </div>
                                <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
                                    {categories.slice(0, 2).map((category) => (
                                        <Badge key={category} variant="secondary" className="max-w-[140px] truncate">
                                            {category}
                                        </Badge>
                                    ))}
                                    {tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="outline" className="max-w-[140px] truncate text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </Link>
                            <div className="flex items-start justify-end">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={isPending}
                                    onClick={() => handleDelete(content.slug, content.directory)}
                                    className="size-9 rounded-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    aria-label={`${title}を削除`}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </article>
                    );
                })}
            </div>
            {contents.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">記事が見つかりませんでした</p>
                </div>
            )}
        </div>
    );
};

export default ContentsTable;

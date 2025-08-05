'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Content } from '@/lib/content';
import { deleteArticle } from '@/app/actions/delete-article';
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
        <div className="overflow-x-auto bg-background border border-muted rounded-xl px-4 py-6">
            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">タイトル</th>
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">ステータス</th>
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">カテゴリ</th>
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">著者</th>
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">公開日</th>
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">更新日</th>
                        <th className="text-left py-3 px-4 font-medium whitespace-nowrap">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {contents.map((content) => {
                        const tags = getArrayField(content, 'tags');
                        // isDraftプロパティ優先で判定
                        const status: 'published' | 'draft' = content.isDraft ? 'draft' : 'published';
                        const title = getStringField(content, 'title');
                        const author = getStringField(content, 'author');
                        const categories = getArrayField(content, 'categories').join(', ');
                        const publishedAt = getStringField(content, 'date');
                        const updatedAt = getStringField(content, 'updateDate') || publishedAt;

                        return (
                            <tr key={content.slug} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div>
                                        <div className="font-medium line-clamp-1">{title}</div>
                                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            <span className="block sm:hidden">
                                                {content.excerpt && content.excerpt.length > 10
                                                    ? `${content.excerpt.slice(0, 30)}…`
                                                    : content.excerpt}
                                            </span>
                                            <span className="hidden sm:block">{content.excerpt}</span>
                                        </div>
                                        <div className="flex gap-1 mt-2">
                                            {tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {tags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{tags.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <Badge variant={getStatusBadgeVariant(status)}>{getStatusText(status)}</Badge>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <Badge variant="secondary">{categories || '-'}</Badge>
                                </td>
                                <td className="py-3 px-4 text-sm whitespace-nowrap">{author || '-'}</td>
                                <td className="py-3 px-4 text-sm whitespace-nowrap">
                                    {formatDate(publishedAt) || '-'}
                                </td>
                                <td className="py-3 px-4 text-sm whitespace-nowrap">{formatDate(updatedAt) || '-'}</td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex gap-2">
                                        <a href={`/contents/${content.slug}/edit`}>
                                            <Button variant="outline" size="sm">
                                                編集
                                            </Button>
                                        </a>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={() => handleDelete(content.slug, content.directory)}
                                        >
                                            削除
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {contents.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">記事が見つかりませんでした</p>
                </div>
            )}
        </div>
    );
};

export default ContentsTable;

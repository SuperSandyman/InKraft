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

const getStatusField = (content: Content, fieldName: string): 'published' | 'draft' => {
    const field = content[fieldName];
    if (field === true || field === 'draft') return 'draft';
    return 'published';
};

const ContentsTable = ({ contents }: ContentsTableProps) => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = (slug: string, directory: string, articleFile: string) => {
        if (!confirm('本当に削除しますか？')) return;
        startTransition(async () => {
            await deleteArticle({ slug, directory, articleFile });
            router.refresh();
        });
    };

    return (
        <div className="overflow-x-auto bg-background border border-muted rounded-xl px-4 py-6">
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
                    {contents.map((content) => {
                        const tags = getArrayField(content, 'tags');
                        const status = getStatusField(content, 'draft');
                        const title = getStringField(content, 'title');
                        const author = getStringField(content, 'author');
                        const categories = getArrayField(content, 'categories').join(', ');
                        const publishedAt = getStringField(content, 'date');
                        const updatedAt = getStringField(content, 'updateDate') || publishedAt;

                        return (
                            <tr key={content.slug} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">
                                    <div>
                                        <div className="font-medium line-clamp-1">{title}</div>
                                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            {content.excerpt}
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
                                <td className="py-3 px-4">
                                    <Badge variant={getStatusBadgeVariant(status)}>{getStatusText(status)}</Badge>
                                </td>
                                <td className="py-3 px-4">
                                    <Badge variant="secondary">{categories}</Badge>
                                </td>
                                <td className="py-3 px-4 text-sm">{author}</td>
                                <td className="py-3 px-4 text-sm">{formatDate(publishedAt)}</td>
                                <td className="py-3 px-4 text-sm">{formatDate(updatedAt)}</td>
                                <td className="py-3 px-4">
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
                                            onClick={() => handleDelete(content.slug, content.directory, 'index.md')}
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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Content } from '@/lib/content';

interface ContentsTableProps {
    contents: Content[];
}

const getStatusBadgeVariant = (status: 'published' | 'draft') => (status === 'published' ? 'default' : 'secondary');

const getStatusText = (status: 'published' | 'draft') => (status === 'published' ? '公開中' : '下書き');

const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const ContentsTable = ({ contents }: ContentsTableProps) => (
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
                {contents.map((content) => (
                    <tr key={content.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                            <div>
                                <div className="font-medium line-clamp-1">{content.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{content.excerpt}</div>
                                <div className="flex gap-1 mt-2">
                                    {content.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {content.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{content.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="py-3 px-4">
                            <Badge variant={getStatusBadgeVariant(content.status)}>
                                {getStatusText(content.status)}
                            </Badge>
                        </td>
                        <td className="py-3 px-4">
                            <Badge variant="secondary">{content.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{content.author}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(content.publishedAt)}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(content.updatedAt)}</td>
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
        {contents.length === 0 && (
            <div className="text-center py-8">
                <p className="text-muted-foreground">記事が見つかりませんでした</p>
            </div>
        )}
    </div>
);

export default ContentsTable;

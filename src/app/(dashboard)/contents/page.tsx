import Link from 'next/link';
import { fetchAllContentsFromGitHub, Content } from '@/lib/content';
import ContentsTable from '@/components/contents-list/contents-table';
import Pagination from '@/components/contents-list/pagination';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NewArticleButton from '@/components/contents-list/new-article-button';
import cmsConfig from '../../../../cms.config.json';

interface ContentsPageProps {
    searchParams: Promise<{
        status?: 'published' | 'draft' | 'all';
        page?: string;
    }>;
}

export default async function ContentsPage({ searchParams }: ContentsPageProps) {
    const { status = 'all', page = '1' } = await searchParams;
    const pageNumber = Number(page) || 1;
    const limit = 10;
    // GitHubから全記事取得
    const allContents: Content[] = await fetchAllContentsFromGitHub();
    // 投稿日（date）降順でソート
    allContents.sort((a, b) => {
        const dateA = typeof a.date === 'string' ? new Date(a.date).getTime() : 0;
        const dateB = typeof b.date === 'string' ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
    // draftDirectoryを取得
    const draftDirectory = cmsConfig.draftDirectory || 'draft';
    // ステータスでフィルタリング
    let filteredContents = allContents;
    if (status === 'published') {
        filteredContents = allContents.filter(
            (content) => content.draft !== true && content.directory !== draftDirectory
        );
    } else if (status === 'draft') {
        filteredContents = allContents.filter(
            (content) => content.draft === true || content.directory === draftDirectory
        );
    }
    // ページネーション
    const totalCount = filteredContents.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (pageNumber - 1) * limit;
    const endIndex = startIndex + limit;
    // isDraftプロパティを付与
    const paginatedContents = filteredContents.slice(startIndex, endIndex).map((content) => ({
        ...content,
        isDraft: content.draft === true || content.directory === draftDirectory
    }));

    return (
        <>
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
                            <h1 className="text-2xl font-bold tracking-tight mb-2">記事一覧</h1>
                            <p className="text-base text-muted-foreground">
                                {status === 'all' && `全ての記事 (${totalCount}件)`}
                                {status === 'published' && `公開中の記事 (${totalCount}件)`}
                                {status === 'draft' && `下書きの記事 (${totalCount}件)`}
                            </p>
                        </div>
                        <NewArticleButton />
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

                    <ContentsTable contents={paginatedContents} />
                    <Pagination totalPages={totalPages} currentPage={pageNumber} status={status} />
                </div>
            </div>
        </>
    );
}

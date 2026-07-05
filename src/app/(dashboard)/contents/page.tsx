import Link from 'next/link';
import { fetchAllContentsFromGitHub, Content } from '@/lib/content';
import ContentsTable from '@/components/contents-list/contents-table';
import Pagination from '@/components/contents-list/pagination';
import Breadcrumbs from '@/components/common/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NewArticleButton from '@/components/contents-list/new-article-button';
import { getCmsConfig } from '@/lib/content';
import { Input } from '@/components/ui/input';
import { Bell, Search, UserRound } from 'lucide-react';

interface ContentsPageProps {
    searchParams: Promise<{
        status?: 'published' | 'draft' | 'all';
        page?: string;
    }>;
}

// 60秒間キャッシュして高速化
export const revalidate = 60;

export default async function ContentsPage({ searchParams }: ContentsPageProps) {
    const { status = 'all', page = '1' } = await searchParams;
    const pageNumber = Number(page) || 1;
    const limit = 10;
    const cmsConfig = await getCmsConfig();
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
            <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-white/88 px-4 backdrop-blur-md transition-[width,height] ease-linear md:px-8 group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
                <div className="flex min-w-0 items-center gap-3">
                    <SidebarTrigger className="size-9 rounded-lg md:hidden" />
                    <Breadcrumbs
                        items={[
                            { label: 'ダッシュボード', href: '/' },
                            { label: '記事一覧', isCurrent: true }
                        ]}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden w-[260px] md:block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="h-10 pl-9 text-sm" placeholder="検索..." />
                    </div>
                    <button
                        type="button"
                        aria-label="通知"
                        className="flex size-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-accent hover:text-primary"
                    >
                        <Bell className="size-5" />
                    </button>
                    <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound className="size-5" />
                    </div>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-extrabold tracking-normal text-slate-950">記事一覧</h1>
                            <p className="text-sm font-bold text-muted-foreground">
                                {status === 'all' && `全ての記事 (${totalCount}件)`}
                                {status === 'published' && `公開中の記事 (${totalCount}件)`}
                                {status === 'draft' && `下書きの記事 (${totalCount}件)`}
                            </p>
                        </div>
                        <NewArticleButton />
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="/contents"
                            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                status === 'all'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-white text-slate-600 ring-1 ring-border hover:bg-accent hover:text-primary'
                            }`}
                        >
                            全て
                        </Link>
                        <Link
                            href="/contents?status=published"
                            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                status === 'published'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-white text-slate-600 ring-1 ring-border hover:bg-accent hover:text-primary'
                            }`}
                        >
                            公開中
                        </Link>
                        <Link
                            href="/contents?status=draft"
                            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                status === 'draft'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-white text-slate-600 ring-1 ring-border hover:bg-accent hover:text-primary'
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

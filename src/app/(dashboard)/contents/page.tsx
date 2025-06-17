import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getContents } from '@/lib/content';
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

interface ContentsPageProps {
    searchParams: Promise<{
        status?: 'published' | 'draft' | 'all';
        page?: string;
    }>;
}

export default async function ContentsPage({ searchParams }: ContentsPageProps) {
    const { status = 'all', page = '1' } = await searchParams;
    const pageNumber = Number(page) || 1;
    const { contents, totalCount, totalPages } = await getContents({ status, page: pageNumber });

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

                    <ContentsTable contents={contents} />
                    <Pagination totalPages={totalPages} currentPage={pageNumber} status={status} />
                </div>
            </div>
        </>
    );
}

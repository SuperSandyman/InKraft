import { fetchContentTypeCounts } from '@/lib/content-stats';
import { fetchAllContentsFromGitHub } from '@/lib/content';
import { ChartPieDonutText } from '@/components/dashboard/pie-chart';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';
import GitHubHeatmap from '@/components/dashboard/github-heatmap';
import HackerNewsCard from '@/components/dashboard/hackernews';
import RecentArticles from '@/components/dashboard/recent-articles';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default async function Page() {
    const chartData = await fetchContentTypeCounts();
    const allArticles = await fetchAllContentsFromGitHub();
    // 日付降順で5件だけ渡す（frontmatter.dateがあればそれを使う）
    const recentArticles = allArticles
        .filter((a) => typeof a.date === 'string' && a.date)
        .sort((a, b) => ((a.date as string) > (b.date as string) ? -1 : 1))
        .slice(0, 5);
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <GitHubHeatmap articles={allArticles} />
                    <ChartPieDonutText data={chartData} />
                    <HackerNewsCard />
                </div>
                <RecentArticles articles={recentArticles} />
            </div>
        </>
    );
}

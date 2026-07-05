import { fetchContentTypeCounts } from '@/lib/content-stats';
import { fetchAllContentsFromGitHub } from '@/lib/content';
import { ChartPieDonutText } from '@/components/dashboard/pie-chart';
import Breadcrumbs from '@/components/common/breadcrumbs';
import GitHubHeatmap from '@/components/dashboard/github-heatmap';
import RecentArticles from '@/components/dashboard/recent-articles';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bell, Search, TrendingUp, UserRound } from 'lucide-react';

const DashboardInsight = ({ monthlyCount, activeDays }: { monthlyCount: number; activeDays: number }) => {
    return (
        <Card className="min-h-0 py-4 sm:min-h-[210px]">
            <CardHeader className="flex-row items-center justify-between gap-3 px-4 pb-0">
                <CardTitle className="text-base font-bold">更新状況</CardTitle>
                <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    <TrendingUp className="size-5" />
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 px-4 sm:flex sm:flex-1 sm:flex-col sm:justify-center">
                <div className="rounded-lg bg-slate-50 px-3 py-3">
                    <div className="text-xs font-bold text-muted-foreground">今月の更新</div>
                    <div className="mt-1 text-2xl font-extrabold text-slate-950">{monthlyCount}</div>
                </div>
                <div className="rounded-lg bg-blue-50 px-3 py-3">
                    <div className="text-xs font-bold text-blue-500">稼働日数</div>
                    <div className="mt-1 text-2xl font-extrabold text-blue-700">{activeDays}</div>
                </div>
                <a
                    href="/contents/new"
                    className="col-span-2 rounded-lg bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    新規作成
                </a>
            </CardContent>
        </Card>
    );
};

export default async function Page() {
    const chartData = await fetchContentTypeCounts();
    const allArticles = await fetchAllContentsFromGitHub();
    // 日付降順で5件だけ渡す（frontmatter.dateがあればそれを使う）
    const recentArticles = allArticles
        .filter((a) => typeof a.date === 'string' && a.date)
        .sort((a, b) => ((a.date as string) > (b.date as string) ? -1 : 1))
        .slice(0, 5);

    const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);
    const now = new Date();
    const monthlyCount = allArticles.filter((article) => {
        if (typeof article.date !== 'string') return false;
        const date = new Date(article.date);
        return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
    const activeDays = new Set(allArticles.filter((article) => typeof article.date === 'string').map((article) => article.date as string)).size;

    return (
        <>
            <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-white/88 px-4 backdrop-blur-md transition-[width,height] ease-linear md:px-8 group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
                <div className="flex min-w-0 items-center gap-3">
                    <SidebarTrigger className="size-9 rounded-lg md:hidden" />
                    <Breadcrumbs items={[{ label: 'ホーム', href: '/' }]} />
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
                <div className="grid auto-rows-min gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.55fr)_minmax(220px,0.55fr)]">
                    <div className="lg:row-span-1">
                        <GitHubHeatmap articles={allArticles} />
                    </div>
                    <ChartPieDonutText data={chartData} totalCount={totalCount} />
                    <DashboardInsight monthlyCount={monthlyCount} activeDays={activeDays} />
                </div>
                <RecentArticles articles={recentArticles} />
            </div>
        </>
    );
}

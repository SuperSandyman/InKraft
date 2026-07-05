import { fetchContentTypeCounts } from '@/lib/content-stats';
import { fetchAllContentsFromGitHub } from '@/lib/content';
import { ChartPieDonutText } from '@/components/dashboard/pie-chart';
import Breadcrumbs from '@/components/common/breadcrumbs';
import GitHubHeatmap from '@/components/dashboard/github-heatmap';
import RecentArticles from '@/components/dashboard/recent-articles';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bell, Bookmark, FileText, Search, UserRound } from 'lucide-react';

interface DashboardMetricProps {
    title: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    tone: 'blue' | 'cyan';
}

const DashboardMetric = ({ title, value, unit, icon, tone }: DashboardMetricProps) => {
    const toneClass =
        tone === 'blue'
            ? 'bg-blue-100 text-blue-700 ring-blue-200/70'
            : 'bg-cyan-100 text-cyan-700 ring-cyan-200/70';

    return (
        <Card className="min-h-[180px] justify-between py-5 sm:min-h-[210px]">
            <CardHeader className="items-center gap-4 px-4 text-center">
                <CardTitle className="text-base font-bold">{title}</CardTitle>
                <div className={`flex size-14 items-center justify-center rounded-lg ring-1 ${toneClass}`}>{icon}</div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 px-4 text-center">
                <div>
                    <div className="text-4xl font-extrabold leading-none text-slate-950">{value.toLocaleString()}</div>
                    <div className="mt-2 text-sm font-bold text-muted-foreground">{unit}</div>
                </div>
                <a href="/contents" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                    一覧を見る →
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
    const postsCount = chartData.find((item) => item.label.toLowerCase() === 'posts')?.count ?? chartData[0]?.count ?? 0;
    const scrapsCount =
        chartData.find((item) => item.label.toLowerCase() === 'scraps')?.count ?? chartData[1]?.count ?? 0;

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
                <div className="grid auto-rows-min gap-4 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.9fr)_minmax(150px,0.5fr)_minmax(150px,0.5fr)_minmax(170px,0.58fr)]">
                    <div className="lg:col-span-3 xl:col-span-1">
                        <GitHubHeatmap articles={allArticles} />
                    </div>
                    <DashboardMetric
                        title="Posts"
                        value={postsCount}
                        unit="記事"
                        tone="blue"
                        icon={<FileText className="size-7" />}
                    />
                    <DashboardMetric
                        title="Scraps"
                        value={scrapsCount}
                        unit="記事"
                        tone="cyan"
                        icon={<Bookmark className="size-7" />}
                    />
                    <ChartPieDonutText data={chartData} totalCount={totalCount} />
                </div>
                <RecentArticles articles={recentArticles} />
            </div>
        </>
    );
}

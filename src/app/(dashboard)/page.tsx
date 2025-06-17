import { ChartPieDonutText } from '@/components/dashboard/pie-chart';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import GitHubHeatmap from '@/components/dashboard/github-heatmap';
import HackerNewsCard from '@/components/dashboard/hackernews';
import RecentArticles from '@/components/dashboard/recent-articles';

export default function Page() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="bg-muted/50 aspect-video rounded-xl">
                        <GitHubHeatmap />
                    </div>
                    <div className="bg-muted/50 aspect-video rounded-xl">
                        <ChartPieDonutText />
                    </div>
                    <div className="bg-muted/50 aspect-video rounded-xl">
                        <HackerNewsCard />
                    </div>
                </div>
                <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
                    <RecentArticles />
                </div>
            </div>
        </>
    );
}

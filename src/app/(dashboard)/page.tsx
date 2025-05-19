import { Metadata } from 'next';
import GitHubHeatmap, { HeatmapValue } from './_components/GitHubHeatmap';
import RecentArticles, { Article } from './_components/RecentArticles';
import { ArticleStatsDonut } from './_components/ArticleStatsDonut';

export const metadata: Metadata = {
    title: 'Dashboard'
};

async function getDashboardData() {
    // ────────── ダミーデータ ──────────
    const posts = 128;
    const scraps = 37;

    const articles: Article[] = [
        { id: '1', title: 'Next.js 13 の新機能まとめ', date: '2025/05/10', tags: ['Next.js', 'AppRouter'] },
        { id: '2', title: 'Tailwind CSS カスタムテーマ', date: '2025/05/08', tags: ['Tailwind', 'Theme'] },
        { id: '3', title: 'Supabase で簡単認証', date: '2025/05/05', tags: ['Supabase', 'Auth'] },
        { id: '4', title: 'React コンポーネント最適化', date: '2025/05/02', tags: ['React', 'Performance'] },
        { id: '5', title: 'GitHub Actions 入門', date: '2025/04/30', tags: ['CI/CD', 'GitHub'] }
    ];

    const today = new Date();
    const values: HeatmapValue[] = Array.from({ length: 365 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        return {
            date: d.toISOString().slice(0, 10),
            count: Math.floor(Math.random() * 5)
        };
    });
    // ────────────────────────────────────

    return { posts, scraps, articles, values };
}

export default async function DashboardPage() {
    const { posts, scraps, articles, values } = await getDashboardData();

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* 上段：ヒートマップ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
                <div className="lg:col-span-2 min-h-[180px] sm:min-h-[200px] md:min-h-[240px]">
                    <GitHubHeatmap values={values} />
                </div>
                {/* 統計ドーナツグラフ */}
                <div className="flex justify-center items-center w-full">
                    <div className="max-w-xs w-full">
                        <ArticleStatsDonut posts={posts} scraps={scraps} />
                    </div>
                </div>
            </div>

            {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-3 sm:p-4 md:p-5 w-full">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 md:mb-4">
                        下書き一覧
                    </h3>
                    <table className="min-w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                                    タイトル
                                </th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                                    最終更新日
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">ドラフト記事サンプル1</td>
                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">2025/05/15</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">ドラフト記事サンプル2</td>
                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">2025/05/12</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div> */}

            {/* 下段：最新の記事 */}
            <div>
                <RecentArticles articles={articles} />
            </div>
        </div>
    );
}

export type Article = {
    id: string;
    title: string;
    date: string; // "YYYY/MM/DD"
    tags: string[];
};

interface Props {
    articles: Article[];
}

export default function RecentArticles({ articles }: Props) {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-3 sm:p-4 md:p-5 w-full">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 md:mb-4">
                最新の記事
            </h3>
            <table className="min-w-full table-auto text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">タイトル</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">日付</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">タグ</th>
                    </tr>
                </thead>
                <tbody>
                    {articles.map((a, i) => (
                        <tr
                            key={a.id}
                            className={`border-b dark:border-gray-700 ${
                                i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                            }`}
                        >
                            <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                                {a.title}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{a.date}</td>
                            <td className="px-6 py-3 whitespace-nowrap">
                                <div className="flex flex-wrap gap-2">
                                    {a.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded text-xs font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

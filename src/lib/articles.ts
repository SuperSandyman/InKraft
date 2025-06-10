// 記事の型定義とダミーデータ

export interface Article {
    id: string;
    title: string;
    slug: string;
    status: 'published' | 'draft';
    category: string;
    tags: string[];
    author: string;
    publishedAt: string | null;
    updatedAt: string;
    excerpt: string;
    readTime: number;
}

// ダミーデータ
export const mockArticles: Article[] = [
    {
        id: '1',
        title: 'Next.js 15の新機能について詳しく解説',
        slug: 'nextjs-15-new-features',
        status: 'published',
        category: 'Technology',
        tags: ['Next.js', 'React', 'Web Development'],
        author: '田中太郎',
        publishedAt: '2024-12-10T09:00:00Z',
        updatedAt: '2024-12-10T09:00:00Z',
        excerpt: 'Next.js 15がリリースされました。新しい機能や改善点について詳しく見ていきましょう。',
        readTime: 8
    },
    {
        id: '2',
        title: 'TypeScriptでの型安全な開発手法',
        slug: 'typescript-type-safe-development',
        status: 'published',
        category: 'Programming',
        tags: ['TypeScript', 'Type Safety', 'Development'],
        author: '山田花子',
        publishedAt: '2024-12-08T14:30:00Z',
        updatedAt: '2024-12-08T14:30:00Z',
        excerpt: 'TypeScriptを使った型安全な開発について、実践的な手法を紹介します。',
        readTime: 12
    },
    {
        id: '3',
        title: 'React Server Componentsの基礎',
        slug: 'react-server-components-basics',
        status: 'draft',
        category: 'React',
        tags: ['React', 'Server Components', 'SSR'],
        author: '佐藤一郎',
        publishedAt: null,
        updatedAt: '2024-12-07T16:45:00Z',
        excerpt: 'React Server Componentsの基本概念と使い方について解説します。',
        readTime: 10
    },
    {
        id: '4',
        title: 'Tailwind CSSで効率的なスタイリング',
        slug: 'efficient-styling-with-tailwind',
        status: 'published',
        category: 'CSS',
        tags: ['Tailwind CSS', 'Styling', 'Design'],
        author: '鈴木美咲',
        publishedAt: '2024-12-05T11:20:00Z',
        updatedAt: '2024-12-05T11:20:00Z',
        excerpt: 'Tailwind CSSを使った効率的なスタイリング手法について説明します。',
        readTime: 6
    },
    {
        id: '5',
        title: 'GraphQLとREST APIの比較検討',
        slug: 'graphql-vs-rest-api-comparison',
        status: 'draft',
        category: 'API',
        tags: ['GraphQL', 'REST', 'API Design'],
        author: '高橋健太',
        publishedAt: null,
        updatedAt: '2024-12-03T13:15:00Z',
        excerpt: 'GraphQLとREST APIの特徴を比較し、適切な選択について考察します。',
        readTime: 15
    },
    {
        id: '6',
        title: 'Dockerコンテナでの開発環境構築',
        slug: 'docker-development-environment',
        status: 'published',
        category: 'DevOps',
        tags: ['Docker', 'Development', 'Environment'],
        author: '田中太郎',
        publishedAt: '2024-12-01T08:00:00Z',
        updatedAt: '2024-12-01T08:00:00Z',
        excerpt: 'Dockerを使った効率的な開発環境の構築方法について詳しく解説します。',
        readTime: 9
    },
    {
        id: '7',
        title: 'パフォーマンス最適化のベストプラクティス',
        slug: 'performance-optimization-best-practices',
        status: 'draft',
        category: 'Performance',
        tags: ['Performance', 'Optimization', 'Web'],
        author: '山田花子',
        publishedAt: null,
        updatedAt: '2024-11-28T15:30:00Z',
        excerpt: 'Webアプリケーションのパフォーマンス最適化について、実践的な手法を紹介します。',
        readTime: 11
    },
    {
        id: '8',
        title: 'セキュリティ対策の重要性と実装',
        slug: 'security-measures-implementation',
        status: 'published',
        category: 'Security',
        tags: ['Security', 'Web Security', 'Implementation'],
        author: '佐藤一郎',
        publishedAt: '2024-11-25T10:45:00Z',
        updatedAt: '2024-11-25T10:45:00Z',
        excerpt: 'Webアプリケーションにおけるセキュリティ対策の重要性と具体的な実装方法について説明します。',
        readTime: 13
    }
];

// 記事データを取得する関数（実際の実装ではAPIやDBから取得）
export const getArticles = async (params: {
    status?: 'published' | 'draft' | 'all';
    page?: number;
    limit?: number;
}): Promise<{ articles: Article[]; totalPages: number; totalCount: number }> => {
    const { status = 'all', page = 1, limit = 10 } = params;

    // ステータスでフィルタリング
    let filteredArticles = mockArticles;
    if (status !== 'all') {
        filteredArticles = mockArticles.filter((article) => article.status === status);
    }

    // ページネーション
    const totalCount = filteredArticles.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    // 疑似的な遅延を追加（実際のAPI呼び出しをシミュレート）
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
        articles: paginatedArticles,
        totalPages,
        totalCount
    };
};

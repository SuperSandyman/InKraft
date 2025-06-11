// 記事の型定義とダミーデータ

export interface Content {
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
export const mockContents: Content[] = [
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
    },
    {
        id: '9',
        title: 'Jamstack時代のCMS選定ポイント',
        slug: 'jamstack-cms-selection',
        status: 'published',
        category: 'CMS',
        tags: ['Jamstack', 'CMS', 'Headless'],
        author: '田中太郎',
        publishedAt: '2024-11-20T09:00:00Z',
        updatedAt: '2024-11-20T09:00:00Z',
        excerpt: 'Jamstack構成におけるCMS選定のポイントと最新トレンドを解説します。',
        readTime: 7
    },
    {
        id: '10',
        title: 'ZennとQiitaの使い分け戦略',
        slug: 'zenn-qiita-strategy',
        status: 'draft',
        category: 'Writing',
        tags: ['Zenn', 'Qiita', 'Blog'],
        author: '鈴木美咲',
        publishedAt: null,
        updatedAt: '2024-11-18T12:00:00Z',
        excerpt: '技術記事投稿プラットフォームの使い分け方と運用ノウハウを紹介します。',
        readTime: 8
    },
    {
        id: '11',
        title: 'アクセシビリティ対応の基本',
        slug: 'accessibility-basics',
        status: 'published',
        category: 'Accessibility',
        tags: ['Accessibility', 'Web', 'A11y'],
        author: '高橋健太',
        publishedAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-11-15T10:00:00Z',
        excerpt: 'Webアクセシビリティの基本と実践的な対応方法をまとめました。',
        readTime: 6
    },
    {
        id: '12',
        title: 'AI時代のフロントエンド開発',
        slug: 'frontend-development-in-ai-era',
        status: 'published',
        category: 'AI',
        tags: ['AI', 'Frontend', 'Trends'],
        author: '佐藤一郎',
        publishedAt: '2024-11-10T15:30:00Z',
        updatedAt: '2024-11-10T15:30:00Z',
        excerpt: 'AI技術の進化がフロントエンド開発にもたらす影響を考察します。',
        readTime: 9
    },
    {
        id: '13',
        title: 'Markdown拡張記法まとめ',
        slug: 'markdown-extensions-summary',
        status: 'draft',
        category: 'Markdown',
        tags: ['Markdown', 'Docs', 'Writing'],
        author: '山田花子',
        publishedAt: null,
        updatedAt: '2024-11-08T09:00:00Z',
        excerpt: 'Markdownの便利な拡張記法やツールをまとめて紹介します。',
        readTime: 5
    },
    {
        id: '14',
        title: 'Vercelデプロイ自動化入門',
        slug: 'vercel-deploy-automation',
        status: 'published',
        category: 'DevOps',
        tags: ['Vercel', 'CI/CD', 'Automation'],
        author: '田中太郎',
        publishedAt: '2024-11-05T18:00:00Z',
        updatedAt: '2024-11-05T18:00:00Z',
        excerpt: 'Vercelを使ったデプロイ自動化の基本と実践例を解説します。',
        readTime: 7
    },
    {
        id: '15',
        title: 'shadcn/uiで作る美しいUI',
        slug: 'beautiful-ui-with-shadcn',
        status: 'draft',
        category: 'UI',
        tags: ['shadcn/ui', 'UI', 'Design'],
        author: '鈴木美咲',
        publishedAt: null,
        updatedAt: '2024-11-03T14:00:00Z',
        excerpt: 'shadcn/uiを活用したモダンなUIデザインのコツを紹介します。',
        readTime: 8
    },
    {
        id: '16',
        title: 'GitHub Actionsでindex.jsonを自動更新',
        slug: 'github-actions-indexjson',
        status: 'published',
        category: 'Automation',
        tags: ['GitHub Actions', 'Automation', 'JSON'],
        author: '高橋健太',
        publishedAt: '2024-11-01T11:00:00Z',
        updatedAt: '2024-11-01T11:00:00Z',
        excerpt: 'GitHub Actionsを使ってindex.jsonを自動で更新する方法を解説します。',
        readTime: 6
    },
    {
        id: '17',
        title: 'スマホ対応のUI設計パターン',
        slug: 'mobile-ui-design-patterns',
        status: 'draft',
        category: 'UI',
        tags: ['Mobile', 'UI', 'Design'],
        author: '佐藤一郎',
        publishedAt: null,
        updatedAt: '2024-10-29T16:00:00Z',
        excerpt: 'スマートフォン向けUI設計のポイントとパターンを解説します。',
        readTime: 7
    },
    {
        id: '18',
        title: 'OSS活動の始め方と心構え',
        slug: 'how-to-start-oss',
        status: 'published',
        category: 'Community',
        tags: ['OSS', 'Community', 'Contribution'],
        author: '山田花子',
        publishedAt: '2024-10-25T13:00:00Z',
        updatedAt: '2024-10-25T13:00:00Z',
        excerpt: 'OSS活動を始める際の心構えや実践的なアドバイスをまとめました。',
        readTime: 10
    }
];

// 記事データを取得する関数（実際の実装ではAPIやDBから取得）
export const getContents = async (params: {
    status?: 'published' | 'draft' | 'all';
    page?: number;
    limit?: number;
}): Promise<{ contents: Content[]; totalPages: number; totalCount: number }> => {
    const { status = 'all', page = 1, limit = 10 } = params;

    // ステータスでフィルタリング
    let filteredContents = mockContents;
    if (status !== 'all') {
        filteredContents = mockContents.filter((content) => content.status === status);
    }

    // ページネーション
    const totalCount = filteredContents.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContents = filteredContents.slice(startIndex, endIndex);

    // 疑似的な遅延を追加（実際のAPI呼び出しをシミュレート）
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
        contents: paginatedContents,
        totalPages,
        totalCount
    };
};

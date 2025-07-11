import { getCmsConfig } from './content';

/**
 * ローカルパス（posts/foo/bar.png等）→raw.githubusercontent.comのURLに変換
 * @param filePath 例: posts/foo/bar.png
 * @param branch 任意。省略時はcms.config.jsonのbranchまたは'main'
 */
export const getRawGitHubUrl = async (filePath: string, branch?: string): Promise<string> => {
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const branchName = branch || config.branch || 'main';
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${filePath}`;
};

/**
 * raw.githubusercontent.comのURL→ローカルパス（posts/foo/bar.png等）に変換
 * @param url 例: https://raw.githubusercontent.com/owner/repo/branch/posts/foo/bar.png
 * @returns ローカルパス or null
 */
export const getLocalPathFromRawUrl = (url: string): string | null => {
    const match = url.match(/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
};

/**
 * 記事画像のraw URLを生成
 * @param directory 記事ディレクトリ（例: posts, scraps, draft）
 * @param slug 記事のslug
 * @param fileName 画像ファイル名（例: hogehoge.png）
 * @param branch 任意
 */
export const getRawGitHubUrlForArticleImage = async (
    directory: string,
    slug: string,
    fileName: string,
    branch?: string
): Promise<string> => {
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const branchName = branch || config.branch || 'main';
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${directory}/${slug}/${fileName}`;
};

/**
 * 記事画像のraw URLを生成（同期版）
 */
export const getRawGitHubUrlForArticleImageSync = (
    directory: string,
    slug: string,
    fileName: string,
    owner: string,
    repo: string,
    branch: string
): string => {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${directory}/${slug}/${fileName}`;
};

/**
 * raw.githubusercontent.comのURLやGitHubパスからMarkdown用画像パス（ファイル名のみ）を抽出
 * @param url 例: https://raw.githubusercontent.com/owner/repo/branch/posts/slug/hogehoge.png
 * @returns hogehoge.png など
 */
export const getMarkdownImagePathFromRawUrl = (url: string): string | null => {
    const match = url.match(/\/([^\/]+\.(png|jpg|jpeg|gif|webp|svg))$/i);
    return match ? match[1] : null;
};

/**
 * Markdown本文中の画像raw URLをファイル名だけに一括変換
 * @param markdown Markdown本文
 * @returns 変換後のMarkdown
 */
export const replaceRawUrlWithFileNameInMarkdown = (markdown: string): string => {
    return markdown.replace(/!\[(.*?)\]\((https:\/\/raw\.githubusercontent\.com\/[^)]+)\)/g, (match, alt, url) => {
        const fileName = getMarkdownImagePathFromRawUrl(url);
        return fileName ? `![${alt}](${fileName})` : match;
    });
};

/**
 * Markdown本文中の画像ファイル名をraw URLに一括変換（owner/repo/branch指定版）
 * @param markdown Markdown本文
 * @param directory 記事ディレクトリ
 * @param slug 記事slug
 * @param owner GitHubリポジトリオーナー
 * @param repo リポジトリ名
 * @param branch ブランチ名
 * @returns 変換後のMarkdown
 */
export const replaceFileNameWithRawUrlInMarkdown = (
    markdown: string,
    directory: string,
    slug: string,
    owner: string,
    repo: string,
    branch: string
): string => {
    const imagePattern = /!\[(.*?)\]\(([^)]+\.(png|jpg|jpeg|gif|webp|svg))\)/gi;
    return markdown.replace(imagePattern, (full, alt, fileName) => {
        const url = getRawGitHubUrlForArticleImageSync(directory, slug, fileName, owner, repo, branch);
        return `![${alt}](${url})`;
    });
};

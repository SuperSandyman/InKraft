'use server';

import matter from 'gray-matter';
import { revalidatePath } from 'next/cache';

import { getAllContentTypes, getCmsConfig, updateCacheForContent } from '@/lib/content';
import { assertValidSlug, resolveArticleFile, resolveContentType, sanitizeSlug } from '@/lib/content-path';
import { convertDatesToSchemaFormat } from '@/lib/date-format';
import { getOctokitWithAuth } from '@/lib/github-api';
import { requireAllowedSession } from '@/lib/server-auth';
import { triggerCmsWebhook } from '@/lib/webhook';

interface CreateArticleParams {
    slug: string;
    directory: string;
    frontmatter: Record<string, unknown>;
    content: string;
    articleFile?: string;
}

const applyDraftFrontmatter = (
    frontmatter: Record<string, unknown>,
    directory: string,
    draftDirectory?: string
): Record<string, unknown> => {
    const draftDir = draftDirectory || 'draft';
    const isDraft = draftDir ? directory === draftDir : false;
    return { ...frontmatter, draft: isDraft };
};

export const createArticle = async ({
    slug,
    directory,
    frontmatter,
    content,
    articleFile
}: CreateArticleParams): Promise<{ success: boolean; error?: string }> => {
    try {
        await requireAllowedSession();
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();
        const contentType = resolveContentType(await getAllContentTypes(), directory);
        const resolvedArticleFile = resolveArticleFile(contentType, articleFile);

        // slugをファイル名として適切な形式にサニタイズ
        const sanitizedSlug = sanitizeSlug(slug);
        assertValidSlug(sanitizedSlug);
        const filePath = `${contentType.directory}/${sanitizedSlug}/${resolvedArticleFile}`;

        const frontmatterWithDraft = applyDraftFrontmatter(frontmatter, contentType.directory, config.draftDirectory);

        // 日付をスキーマ指定フォーマットに変換
        const formattedFrontmatter = await convertDatesToSchemaFormat(frontmatterWithDraft);

        // frontmatterとcontentを結合してMarkdownファイルを生成
        const markdownContent = matter.stringify(content, formattedFrontmatter);

        // ファイルが既に存在するかチェック
        try {
            await octokit.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: branch
            });
            return { success: false, error: '同名の記事が既に存在します' };
        } catch (error: unknown) {
            const isNotFound =
                typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                (error as { status?: number }).status === 404;
            if (!isNotFound) {
                throw error;
            }
        }

        // 新規ファイルを作成
        const encodedContent = Buffer.from(markdownContent, 'utf-8').toString('base64');

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `Create new article: ${sanitizedSlug}`,
            content: encodedContent,
            branch
        });

        await updateCacheForContent(contentType.directory, sanitizedSlug, formattedFrontmatter, content, 'create');

        await triggerCmsWebhook('create', {
            slug: sanitizedSlug,
            directory: contentType.directory,
            repository: config.targetRepository
        });

        // 記事一覧の再検証をトリガー
        revalidatePath('/contents');

        return { success: true };
    } catch (error) {
        console.error('記事作成に失敗:', error);
        return { success: false, error: '記事の作成に失敗しました' };
    }
};

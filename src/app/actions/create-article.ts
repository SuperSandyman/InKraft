'use server';

import matter from 'gray-matter';
import { revalidatePath } from 'next/cache';

import { getCmsConfig, updateCacheForContent } from '@/lib/content';
import { convertDatesToSchemaFormat } from '@/lib/date-format';
import { getOctokitWithAuth } from '@/lib/github-api';
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
    articleFile = 'index.md'
}: CreateArticleParams): Promise<{ success: boolean; error?: string }> => {
    try {
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();

        // slugをファイル名として適切な形式にサニタイズ
        const sanitizedSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        const filePath = `${directory}/${sanitizedSlug}/${articleFile}`;

        const frontmatterWithDraft = applyDraftFrontmatter(frontmatter, directory, config.draftDirectory);

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
        } catch {
            // ファイルが存在しない場合は正常（新規作成可能）
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

        // index.json キャッシュを更新（非同期・fire-and-forget）
        updateCacheForContent(directory, sanitizedSlug, formattedFrontmatter, content, 'create').catch((err) =>
            console.error('キャッシュ更新に失敗（記事は保存済み）:', err)
        );

        // Webhookを発火（非同期・fire-and-forget）
        triggerCmsWebhook('create', {
            slug: sanitizedSlug,
            directory,
            repository: config.targetRepository
        }).catch((err) => console.error('Webhook発火に失敗（記事は保存済み）:', err));

        // 記事一覧の再検証をトリガー
        revalidatePath('/contents');

        return { success: true };
    } catch (error) {
        console.error('記事作成に失敗:', error);
        return { success: false, error: '記事の作成に失敗しました' };
    }
};

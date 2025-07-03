'use server';

import matter from 'gray-matter';

import { getCmsConfig, updateCacheForContent } from '@/lib/content';
import { getOctokitWithAuth } from '@/lib/github-api';

interface UpdateArticleParams {
    slug: string;
    directory: string;
    frontmatter: Record<string, unknown>;
    content: string;
    articleFile?: string;
    originalSlug?: string; // 元のslugを追加
}

export const updateArticle = async ({
    slug,
    directory,
    frontmatter,
    content,
    articleFile = 'index.md',
    originalSlug
}: UpdateArticleParams): Promise<{ success: boolean; error?: string }> => {
    try {
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();

        const currentSlug = originalSlug || slug;
        const currentFilePath = `${directory}/${currentSlug}/${articleFile}`;
        const newFilePath = `${directory}/${slug}/${articleFile}`;

        // 既存ファイルのSHAを取得
        const { data: existingFile } = await octokit.repos.getContent({
            owner,
            repo,
            path: currentFilePath,
            ref: branch
        });

        if (!('sha' in existingFile)) {
            return { success: false, error: 'ファイルが見つかりません' };
        }

        // frontmatterとcontentを結合してMarkdownファイルを生成
        const markdownContent = matter.stringify(content, frontmatter);
        const encodedContent = Buffer.from(markdownContent, 'utf-8').toString('base64');

        if (currentSlug !== slug) {
            // slugが変更された場合は、古いファイルを削除して新しいファイルを作成

            // 新しいファイルが既に存在するかチェック
            try {
                await octokit.repos.getContent({
                    owner,
                    repo,
                    path: newFilePath,
                    ref: branch
                });
                return { success: false, error: '同名の記事が既に存在します' };
            } catch {
                // ファイルが存在しない場合は正常（新規作成可能）
            }

            // 新しいファイルを作成
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: newFilePath,
                message: `Update article: rename ${currentSlug} to ${slug}`,
                content: encodedContent,
                branch
            });

            // 古いファイルを削除
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: currentFilePath,
                message: `Delete old article file: ${currentFilePath}`,
                sha: existingFile.sha,
                branch
            });

            // キャッシュを更新（削除してから作成）
            await updateCacheForContent(directory, currentSlug, {}, '', 'delete');
            await updateCacheForContent(directory, slug, frontmatter, content, 'create');
        } else {
            // slugが変更されていない場合は通常の更新
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: currentFilePath,
                message: `Update article: ${slug}`,
                content: encodedContent,
                sha: existingFile.sha,
                branch
            });

            // index.json キャッシュを更新
            await updateCacheForContent(directory, slug, frontmatter, content, 'update');
        }

        return { success: true };
    } catch (error) {
        console.error('記事更新に失敗:', error);
        return { success: false, error: '記事の更新に失敗しました' };
    }
};

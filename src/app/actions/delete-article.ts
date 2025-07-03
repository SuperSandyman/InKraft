'use server';

import { getCmsConfig, updateCacheForContent } from '@/lib/content';
import { getOctokitWithAuth } from '@/lib/github-api';

interface DeleteArticleParams {
    slug: string;
    directory: string;
    articleFile: string;
}

export const deleteArticle = async ({ slug, directory, articleFile }: DeleteArticleParams): Promise<boolean> => {
    try {
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();
        const filePath = `${directory}/${slug}/${articleFile}`;

        // ファイルのSHAを取得
        const { data: file } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch
        });
        if (!('sha' in file)) return false;

        // ファイル削除
        await octokit.repos.deleteFile({
            owner,
            repo,
            path: filePath,
            message: `Delete article: ${filePath}`,
            sha: file.sha,
            branch
        });

        // index.json キャッシュを更新
        await updateCacheForContent(directory, slug, {}, '', 'delete');

        return true;
    } catch (error) {
        console.error('記事削除に失敗', error);
        return false;
    }
};

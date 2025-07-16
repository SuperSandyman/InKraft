'use server';

import { getCmsConfig, updateCacheForContent, getAllContentTypes } from '@/lib/content';
import { getOctokitWithAuth } from '@/lib/github-api';

interface DeleteArticleParams {
    slug: string;
    directory: string;
}

export const deleteArticle = async ({ slug, directory }: DeleteArticleParams): Promise<boolean> => {
    try {
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();
        const dirPath = `${directory}/${slug}`;

        // index.jsonのキャッシュパス取得（draftディレクトリも含む）
        const allContentTypes = await getAllContentTypes();
        const contentType = allContentTypes.find((c) => c.directory === directory);
        let isLastArticle = false;
        let cachePath = '';
        let cacheSha = '';

        if (contentType?.metaCache?.path) {
            cachePath = contentType.metaCache.path;
            // index.jsonの中身を取得
            try {
                const { data: cacheFile } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: cachePath,
                    ref: branch
                });
                let cacheContent: string = '';
                if ('content' in cacheFile && cacheFile.content) {
                    cacheContent = Buffer.from(cacheFile.content, 'base64').toString('utf-8');
                }
                const arr = cacheContent ? JSON.parse(cacheContent) : [];
                if (Array.isArray(arr) && arr.length === 1 && 'sha' in cacheFile) {
                    isLastArticle = true;
                    cacheSha = cacheFile.sha;
                }
            } catch {
                // index.jsonが存在しないか取得に失敗
            }
        }

        // ディレクトリ内の全ファイルを取得
        const { data: files } = await octokit.repos.getContent({
            owner,
            repo,
            path: dirPath,
            ref: branch
        });
        // filesは配列（ディレクトリ内の全ファイル）
        if (Array.isArray(files)) {
            for (const file of files) {
                if ('sha' in file && file.type === 'file') {
                    await octokit.repos.deleteFile({
                        owner,
                        repo,
                        path: file.path,
                        message: `Delete article: ${file.path}`,
                        sha: file.sha,
                        branch
                    });
                }
            }
        } else if ('sha' in files && files.type === 'file') {
            // 1ファイルのみの場合
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: files.path,
                message: `Delete article: ${files.path}`,
                sha: files.sha,
                branch
            });
        }

        if (isLastArticle && cachePath && cacheSha) {
            // 最後の1件だった場合はindex.jsonも削除
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: cachePath,
                message: `Delete empty index.json for ${directory}`,
                sha: cacheSha,
                branch
            });
        } else {
            // それ以外はindex.jsonを更新
            await updateCacheForContent(directory, slug, {}, '', 'delete');
        }

        return true;
    } catch {
        return false;
    }
};

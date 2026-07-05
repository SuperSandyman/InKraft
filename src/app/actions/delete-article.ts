'use server';

import type { Octokit } from '@octokit/rest';
import { revalidatePath } from 'next/cache';

import { getAllContentTypes, getCmsConfig, getIndexJsonPath, updateCacheForContent } from '@/lib/content';
import { assertSafeRepositoryPathSegment, resolveContentType } from '@/lib/content-path';
import { getOctokitWithAuth } from '@/lib/github-api';
import { requireAllowedSession } from '@/lib/server-auth';
import { triggerCmsWebhook } from '@/lib/webhook';

interface DeleteArticleParams {
    slug: string;
    directory: string;
}

const collectFilesRecursively = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    targetPath: string,
    branch: string
): Promise<Array<{ path: string; sha: string }>> => {
    const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: targetPath,
        ref: branch
    });

    if (!Array.isArray(data)) {
        return 'sha' in data && data.type === 'file' ? [{ path: data.path, sha: data.sha }] : [];
    }

    const files: Array<{ path: string; sha: string }> = [];
    for (const item of data) {
        if (item.type === 'file') {
            files.push({ path: item.path, sha: item.sha });
        } else if (item.type === 'dir') {
            files.push(...(await collectFilesRecursively(octokit, owner, repo, item.path, branch)));
        }
    }

    return files;
};

export const deleteArticle = async ({ slug, directory }: DeleteArticleParams): Promise<boolean> => {
    try {
        await requireAllowedSession();
        assertSafeRepositoryPathSegment(slug, 'slug');
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();

        // index.jsonのキャッシュパス取得（draftディレクトリも含む）
        const allContentTypes = await getAllContentTypes();
        const contentType = resolveContentType(allContentTypes, directory);
        const dirPath = `${contentType.directory}/${slug}`;
        let isLastArticle = false;
        let cachePath = '';
        let cacheSha = '';

        cachePath = getIndexJsonPath(contentType.directory);
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
            if (Array.isArray(arr) && arr.length === 1 && arr[0]?.slug === slug && 'sha' in cacheFile) {
                isLastArticle = true;
                cacheSha = cacheFile.sha;
            }
        } catch {
            // index.jsonが存在しないか取得に失敗
        }

        // ディレクトリ内の全ファイルを取得
        const files = await collectFilesRecursively(octokit, owner, repo, dirPath, branch);
        for (const file of files) {
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: file.path,
                message: `Delete article: ${file.path}`,
                sha: file.sha,
                branch
            });
        }

        if (isLastArticle && cachePath && cacheSha) {
            // 最後の1件だった場合はindex.jsonも削除
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: cachePath,
                message: `Delete empty index.json for ${contentType.directory}`,
                sha: cacheSha,
                branch
            });
        } else {
            await updateCacheForContent(contentType.directory, slug, {}, '', 'delete');
        }

        await triggerCmsWebhook('delete', {
            slug,
            directory: contentType.directory,
            repository: config.targetRepository
        });

        // 記事一覧の再検証をトリガー
        revalidatePath('/contents');

        return true;
    } catch (error) {
        console.error('記事削除に失敗:', error);
        return false;
    }
};

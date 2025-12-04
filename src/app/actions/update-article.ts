'use server';

import matter from 'gray-matter';
import type { Octokit } from '@octokit/rest';

import { getCmsConfig, updateCacheForContent } from '@/lib/content';
import { convertDatesToSchemaFormat } from '@/lib/date-format';
import { getOctokitWithAuth } from '@/lib/github-api';
import { replaceRawUrlWithFileNameInMarkdown } from '@/lib/github-path';
import { triggerCmsWebhook } from '@/lib/webhook';

interface UpdateArticleParams {
    slug: string;
    directory: string;
    frontmatter: Record<string, unknown>;
    content: string;
    articleFile?: string;
    originalSlug?: string; // 元のslugを追加
    originalDirectory?: string;
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

const collectFilesRecursively = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    directoryPath: string,
    branch: string
): Promise<Array<{ path: string; sha: string }>> => {
    const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: directoryPath,
        ref: branch
    });
    if (!Array.isArray(data)) {
        return [];
    }

    const files: Array<{ path: string; sha: string }> = [];
    for (const item of data) {
        if (item.type === 'file') {
            files.push({ path: item.path, sha: item.sha });
        } else if (item.type === 'dir') {
            const childFiles = await collectFilesRecursively(octokit, owner, repo, item.path, branch);
            files.push(...childFiles);
        }
    }
    return files;
};

const pathExists = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    targetPath: string,
    branch: string
): Promise<boolean> => {
    try {
        await octokit.repos.getContent({
            owner,
            repo,
            path: targetPath,
            ref: branch
        });
        return true;
    } catch (error: unknown) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            (error as { status?: number }).status === 404
        ) {
            return false;
        }
        throw error;
    }
};

export const updateArticle = async ({
    slug,
    directory,
    frontmatter,
    content,
    articleFile = 'index.md',
    originalSlug,
    originalDirectory
}: UpdateArticleParams): Promise<{ success: boolean; error?: string }> => {
    try {
        // 保存前にraw URLが含まれている場合のみ変換
        let contentForSave = content;
        if (/https:\/\/raw\.githubusercontent\.com\//.test(content)) {
            contentForSave = replaceRawUrlWithFileNameInMarkdown(content);
        }

        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();

        const currentSlug = originalSlug || slug;
        const currentDirectory = originalDirectory || directory;
        const sourceBasePath = `${currentDirectory}/${currentSlug}`;
        const targetBasePath = `${directory}/${slug}`;
        const sourceFilePath = `${sourceBasePath}/${articleFile}`;
        const targetFilePath = `${targetBasePath}/${articleFile}`;

        // 既存ファイルのSHAを取得
        const { data: existingFile } = await octokit.repos.getContent({
            owner,
            repo,
            path: sourceFilePath,
            ref: branch
        });

        if (Array.isArray(existingFile) || !('sha' in existingFile)) {
            return { success: false, error: 'ファイルが見つかりません' };
        }

        const frontmatterWithDraft = applyDraftFrontmatter(frontmatter, directory, config.draftDirectory);

        // 日付をスキーマ指定フォーマットに変換
        const formattedFrontmatter = await convertDatesToSchemaFormat(frontmatterWithDraft);

        // frontmatterとcontentを結合してMarkdownファイルを生成
        const markdownContent = matter.stringify(contentForSave, formattedFrontmatter);
        const encodedContent = Buffer.from(markdownContent, 'utf-8').toString('base64');

        const pathChanged = sourceBasePath !== targetBasePath;

        if (pathChanged) {
            const targetExists = await pathExists(octokit, owner, repo, targetBasePath, branch);
            if (targetExists) {
                return { success: false, error: '同名の記事が既に存在します' };
            }

            const filesInSource = await collectFilesRecursively(octokit, owner, repo, sourceBasePath, branch);
            if (!filesInSource.length) {
                return { success: false, error: 'コピー対象のファイルが見つかりません' };
            }

            const assetFiles = filesInSource.filter((file) => file.path !== sourceFilePath);

            const { data: refData } = await octokit.git.getRef({
                owner,
                repo,
                ref: `heads/${branch}`
            });
            const currentCommitSha = refData.object.sha;

            const { data: baseCommit } = await octokit.git.getCommit({
                owner,
                repo,
                commit_sha: currentCommitSha
            });
            const baseTreeSha = baseCommit.tree.sha;

            const treeChanges: Array<{
                path: string;
                mode: '100644';
                type: 'blob';
                sha: string | null;
            }> = [];

            for (const asset of assetFiles) {
                const targetPath = asset.path.replace(sourceBasePath, targetBasePath);
                treeChanges.push({
                    path: targetPath,
                    mode: '100644',
                    type: 'blob',
                    sha: asset.sha
                });
            }

            const { data: newArticleBlob } = await octokit.git.createBlob({
                owner,
                repo,
                content: encodedContent,
                encoding: 'base64'
            });
            treeChanges.push({
                path: targetFilePath,
                mode: '100644',
                type: 'blob',
                sha: newArticleBlob.sha
            });

            for (const file of filesInSource) {
                treeChanges.push({
                    path: file.path,
                    mode: '100644',
                    type: 'blob',
                    sha: null
                });
            }

            const { data: newTree } = await octokit.git.createTree({
                owner,
                repo,
                base_tree: baseTreeSha,
                tree: treeChanges
            });

            const { data: newCommit } = await octokit.git.createCommit({
                owner,
                repo,
                message: `Update article: move ${sourceBasePath} to ${targetBasePath}`,
                tree: newTree.sha,
                parents: [currentCommitSha]
            });

            await octokit.git.updateRef({
                owner,
                repo,
                ref: `heads/${branch}`,
                sha: newCommit.sha
            });

            // キャッシュ更新（非同期・fire-and-forget）
            updateCacheForContent(currentDirectory, currentSlug, {}, '', 'delete').catch(console.error);
            updateCacheForContent(directory, slug, formattedFrontmatter, contentForSave, 'create').catch(console.error);
        } else {
            // slugが変更されていない場合は通常の更新
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: sourceFilePath,
                message: `Update article: ${slug}`,
                content: encodedContent,
                sha: existingFile.sha,
                branch
            });

            // index.json キャッシュを更新（非同期・fire-and-forget）
            updateCacheForContent(directory, slug, formattedFrontmatter, contentForSave, 'update').catch(console.error);
        }

        // Webhookを発火（非同期・fire-and-forget）
        triggerCmsWebhook('update', {
            slug,
            directory,
            repository: config.targetRepository
        }).catch((err) => console.error('Webhook発火に失敗（記事は保存済み）:', err));

        return { success: true };
    } catch (error) {
        console.error('記事更新に失敗:', error);
        return { success: false, error: '記事の更新に失敗しました' };
    }
};

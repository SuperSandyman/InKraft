import { promises as fs } from 'fs';
import path from 'path';

import matter from 'gray-matter';
import type { Octokit } from '@octokit/rest';

import { getOctokitWithAuth } from './github-api';

interface CmsConfig {
    targetRepository: string;
    branch?: string;
    content: Array<{
        directory: string;
        articleFile: string;
        metaCache?: {
            type: string;
            path: string;
        };
    }>;
}

// サーバーサイドでローカルの cms.config.json を読み込む
const getCmsConfig = async (): Promise<CmsConfig & { draftDirectory?: string }> => {
    const configPath = path.join(process.cwd(), 'cms.config.json');
    const file = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(file);
};

// draftDirectoryも含めたcontentTypeリストを返す
const getAllContentTypes = async () => {
    const config = await getCmsConfig();
    const contentTypes = [...config.content];
    if (config.draftDirectory) {
        // 既にcontentにdraftDirectoryが含まれていない場合のみ追加
        const exists = contentTypes.some((c) => c.directory === config.draftDirectory);
        if (!exists) {
            contentTypes.push({
                directory: config.draftDirectory,
                articleFile: 'index.md',
                metaCache: {
                    type: 'json',
                    path: `${config.draftDirectory}/index.json`
                }
            });
        }
    }
    return contentTypes;
};

export { getCmsConfig };

export interface Content {
    slug: string;
    excerpt: string;
    directory: string;
    [key: string]: unknown; // frontmatter の動的なフィールド
}

// キャッシュファイルの存在確認
const checkCacheExists = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    cachePath: string,
    branch: string
): Promise<boolean> => {
    try {
        await octokit.repos.getContent({
            owner,
            repo,
            path: cachePath,
            ref: branch
        });
        return true;
    } catch {
        return false;
    }
};

// キャッシュファイルの読み込み
const readCacheFile = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    cachePath: string,
    branch: string
): Promise<Content[]> => {
    try {
        const { data: file } = await octokit.repos.getContent({
            owner,
            repo,
            path: cachePath,
            ref: branch
        });
        if (!('content' in file) || !file.content) return [];
        const cacheContent = Buffer.from(file.content, 'base64').toString('utf-8');
        return JSON.parse(cacheContent);
    } catch {
        return [];
    }
};

// キャッシュファイルの作成
const createCacheFile = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    cachePath: string,
    branch: string,
    contents: Content[]
): Promise<void> => {
    try {
        const cacheContent = JSON.stringify(contents, null, 2);
        const encodedContent = Buffer.from(cacheContent, 'utf-8').toString('base64');

        // 既存ファイルのSHAを取得（存在しない場合はundefined）
        let sha: string | undefined = undefined;
        try {
            const { data: existingFile } = await octokit.repos.getContent({
                owner,
                repo,
                path: cachePath,
                ref: branch
            });
            if ('sha' in existingFile) {
                sha = existingFile.sha;
            }
        } catch {
            // ファイルが存在しない場合はshaは不要
        }

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: cachePath,
            message: `Update cache: ${cachePath}`,
            content: encodedContent,
            branch,
            ...(sha ? { sha } : {})
        });
    } catch (error) {
        console.error(`キャッシュファイル作成に失敗: ${cachePath}`, error);
    }
};

// 特定のディレクトリから記事データを収集
const fetchContentsFromDirectory = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    directory: string,
    articleFile: string,
    branch: string
): Promise<Content[]> => {
    const contents: Content[] = [];

    try {
        const { data: dirs } = await octokit.repos.getContent({
            owner,
            repo,
            path: directory,
            ref: branch
        });

        if (!Array.isArray(dirs)) return contents;

        for (const dir of dirs) {
            if (dir.type !== 'dir' || !dir.name) continue;

            try {
                const { data: file } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: `${directory}/${dir.name}/${articleFile}`,
                    ref: branch
                });

                if (!('content' in file) || !file.content) continue;

                const md = Buffer.from(file.content, 'base64').toString('utf-8');
                const { data: fm, content: body } = matter(md);

                // 本文の冒頭75文字を取得
                const excerpt = body.split('\n').find((line) => line.trim()) || '';
                const shortExcerpt = excerpt.length > 75 ? `${excerpt.substring(0, 75)}...` : excerpt;

                contents.push({
                    slug: dir.name,
                    excerpt: shortExcerpt,
                    directory,
                    ...fm
                });
            } catch {
                continue;
            }
        }
    } catch (error) {
        console.error(`ディレクトリの読み込みに失敗: ${directory}`, error);
    }

    return contents;
};

// 特定のslugの記事の詳細情報（本文全体 + frontmatter）を取得
export const fetchContentBySlug = async (
    slug: string
): Promise<{
    frontmatter: Record<string, unknown>;
    content: string;
    directory: string;
} | null> => {
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const branch = config.branch || 'main';
    const octokit = await getOctokitWithAuth();

    // draftDirectoryも含めた全てのcontent typeでslugを検索
    const contentTypes = await getAllContentTypes();
    for (const contentType of contentTypes) {
        const { directory, articleFile } = contentType;
        try {
            const { data: file } = await octokit.repos.getContent({
                owner,
                repo,
                path: `${directory}/${slug}/${articleFile}`,
                ref: branch
            });
            if ('content' in file && file.content) {
                const md = Buffer.from(file.content, 'base64').toString('utf-8');
                const { data: frontmatter, content } = matter(md);
                return {
                    frontmatter,
                    content,
                    directory
                };
            }
        } catch {
            continue;
        }
    }
    return null; // 見つからなかった場合
};

export const fetchAllContentsFromGitHub = async (): Promise<Content[]> => {
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const branch = config.branch || 'main';
    const octokit = await getOctokitWithAuth();
    const allContents: Content[] = [];

    // draftDirectoryも含めたcontentTypeリストを取得
    const contentTypes = await getAllContentTypes();
    for (const contentType of contentTypes) {
        const { directory, articleFile, metaCache } = contentType;

        if (metaCache?.path) {
            // キャッシュファイルの存在確認
            const cacheExists = await checkCacheExists(octokit, owner, repo, metaCache.path, branch);

            if (cacheExists) {
                // キャッシュから読み込み
                const cachedContents = await readCacheFile(octokit, owner, repo, metaCache.path, branch);
                allContents.push(...cachedContents);
            } else {
                // キャッシュが存在しない場合は新規作成
                const freshContents = await fetchContentsFromDirectory(
                    octokit,
                    owner,
                    repo,
                    directory,
                    articleFile,
                    branch
                );
                await createCacheFile(octokit, owner, repo, metaCache.path, branch, freshContents);
                allContents.push(...freshContents);
            }
        } else {
            // キャッシュ設定がない場合は直接取得
            const contents = await fetchContentsFromDirectory(octokit, owner, repo, directory, articleFile, branch);
            allContents.push(...contents);
        }
    }

    return allContents;
};

// index.jsonを更新する関数
export const updateCacheForContent = async (
    directory: string,
    slug: string,
    frontmatter: Record<string, unknown>,
    content: string,
    operation: 'create' | 'update' | 'delete'
): Promise<void> => {
    try {
        const config = await getCmsConfig();
        const [owner, repo] = config.targetRepository.split('/');
        const branch = config.branch || 'main';
        const octokit = await getOctokitWithAuth();

        // 対象のコンテンツタイプを検索
        const contentType = config.content.find((c) => c.directory === directory);
        if (!contentType?.metaCache?.path) return; // キャッシュ設定がない場合はスキップ

        const cachePath = contentType.metaCache.path;

        // 既存のキャッシュを読み込み
        let existingContents: Content[] = [];
        try {
            const { data: file } = await octokit.repos.getContent({
                owner,
                repo,
                path: cachePath,
                ref: branch
            });

            if ('content' in file && file.content) {
                const cacheContent = Buffer.from(file.content, 'base64').toString('utf-8');
                existingContents = JSON.parse(cacheContent);
            }
        } catch {
            // キャッシュファイルが存在しない場合は空配列で開始
        }

        // 操作に応じてキャッシュを更新
        const updatedContents = [...existingContents];
        const existingIndex = updatedContents.findIndex((item) => item.slug === slug);

        if (operation === 'delete') {
            if (existingIndex !== -1) {
                updatedContents.splice(existingIndex, 1);
            }
        } else {
            // 本文の冒頭75文字を取得
            const excerpt = content.split('\n').find((line) => line.trim()) || '';
            const shortExcerpt = excerpt.length > 75 ? `${excerpt.substring(0, 75)}...` : excerpt;

            const newContent: Content = {
                slug,
                excerpt: shortExcerpt,
                directory,
                ...frontmatter
            };

            if (operation === 'create') {
                updatedContents.push(newContent);
            } else if (operation === 'update' && existingIndex !== -1) {
                updatedContents[existingIndex] = newContent;
            }
        }

        // キャッシュファイルを更新
        const updatedCacheContent = JSON.stringify(updatedContents, null, 2);
        const encodedContent = Buffer.from(updatedCacheContent, 'utf-8').toString('base64');

        // SHAを取得（ファイルが存在する場合）
        let sha: string | undefined;
        try {
            const { data: existingFile } = await octokit.repos.getContent({
                owner,
                repo,
                path: cachePath,
                ref: branch
            });
            if ('sha' in existingFile) {
                sha = existingFile.sha;
            }
        } catch {
            // ファイルが存在しない場合はshaは不要
        }

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: cachePath,
            message: `Update cache: ${operation} ${slug} in ${directory}`,
            content: encodedContent,
            sha,
            branch
        });
    } catch (error) {
        console.error('キャッシュ更新に失敗:', error);
        // キャッシュ更新の失敗は致命的ではないためエラーを投げない
    }
};

import { promises as fs } from 'fs';
import path from 'path';

import matter from 'gray-matter';
import type { Octokit } from '@octokit/rest';
import { z } from 'zod';

import { getOctokitWithAuth } from './github-api';

interface WebhookEndpoint {
    name: string;
    url: string;
    type?: 'vercel' | 'netlify' | 'custom';
    events?: string[];
}

interface WebhookConfig {
    enabled: boolean;
    secret?: string;
    endpoints?: WebhookEndpoint[];
}

export interface ContentTypeConfigItem {
    directory: string;
    articleFile: string;
    imageDirInsideContent?: boolean;
}

export interface CmsConfig {
    targetRepository: string;
    branch?: string;
    draftDirectory?: string;
    content: ContentTypeConfigItem[];
    webhooks?: WebhookConfig;
    // その他の設定は許容
    [key: string]: unknown;
}

// zod スキーマ（厳格にはしすぎず、必須項目のみ検証）
const ContentItemSchema = z.object({
    directory: z.string(),
    articleFile: z.string(),
    imageDirInsideContent: z.boolean().optional()
});

const WebhookEndpointSchema = z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.enum(['vercel', 'netlify', 'custom']).optional(),
    events: z.array(z.string()).optional()
});

const WebhookConfigSchema = z.object({
    enabled: z.boolean(),
    secret: z.string().optional(),
    endpoints: z.array(WebhookEndpointSchema).optional()
});

const CmsConfigSchema = z.object({
    targetRepository: z.string().regex(/^[^/]+\/[^/]+$/, 'owner/repo 形式で指定してください'),
    branch: z.string().optional(),
    draftDirectory: z.string().optional(),
    content: z.array(ContentItemSchema),
    webhooks: WebhookConfigSchema.optional()
    // 追加のキーは許容
});

let cachedConfig: CmsConfig | null = null;

// サーバーサイドでローカルの cms.config.json を読み込み、検証・キャッシュする
const getCmsConfig = async (): Promise<CmsConfig> => {
    if (cachedConfig) return cachedConfig;
    const configPath = path.join(process.cwd(), 'cms.config.json');
    const file = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(file);
    const result = CmsConfigSchema.safeParse(parsed);
    if (!result.success) {
        const issue = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new Error(`cms.config.json の検証に失敗: ${issue}`);
    }
    // secret は環境変数優先（存在しても型は維持）
    const cfg: CmsConfig = {
        ...result.data,
        webhooks: result.data.webhooks
            ? {
                  ...result.data.webhooks,
                  secret: process.env.WEBHOOK_SECRET || result.data.webhooks.secret
              }
            : undefined
    };
    cachedConfig = cfg;
    return cfg;
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
                articleFile: 'index.md'
            });
        }
    }
    return contentTypes;
};

export { getCmsConfig, getAllContentTypes };

export const getIndexJsonPath = (directory: string) => `${directory}/index.json`;

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
    } catch (error: unknown) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            (error as { status?: number }).status === 404
        ) {
            // ディレクトリが存在しない場合はエラーを出さず空リスト扱い
            console.info(`ディレクトリが存在しません: ${directory}`);
        } else {
            console.error(`ディレクトリの読み込みに失敗: ${directory}`, error);
        }
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
        const { directory, articleFile } = contentType;
        const cachePath = getIndexJsonPath(directory);

        // キャッシュファイルの存在確認
        const cacheExists = await checkCacheExists(octokit, owner, repo, cachePath, branch);

        if (cacheExists) {
            // キャッシュから読み込み
            const cachedContents = await readCacheFile(octokit, owner, repo, cachePath, branch);
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
            if (freshContents.length > 0) {
                await createCacheFile(octokit, owner, repo, cachePath, branch, freshContents);
            }
            allContents.push(...freshContents);
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

        // 対象ディレクトリがcontent設定に存在するか確認（draft含む）
        const contentTypes = await getAllContentTypes();
        const hasContentType = contentTypes.some((c) => c.directory === directory);
        if (!hasContentType) return; // 設定に存在しないディレクトリはスキップ

        const cachePath = getIndexJsonPath(directory);

        const applyOperation = (existingContents: Content[]): Content[] => {
            const updatedContents = [...existingContents];
            const existingIndex = updatedContents.findIndex((item) => item.slug === slug);

            if (operation === 'delete') {
                if (existingIndex !== -1) {
                    updatedContents.splice(existingIndex, 1);
                }
                return updatedContents;
            }

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

            return updatedContents;
        };

        const fetchCache = async (): Promise<{ contents: Content[]; sha?: string }> => {
            let contents: Content[] = [];
            let sha: string | undefined;
            try {
                const { data: file } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: cachePath,
                    ref: branch
                });

                if ('content' in file && file.content) {
                    const cacheContent = Buffer.from(file.content, 'base64').toString('utf-8');
                    contents = JSON.parse(cacheContent);
                }
                if ('sha' in file) {
                    sha = file.sha;
                }
            } catch {
                // キャッシュファイルが存在しない場合は空配列で開始
            }
            return { contents, sha };
        };

        const saveCache = async (baseCache: { contents: Content[]; sha?: string }) => {
            const updatedContents = applyOperation(baseCache.contents);

            // 記事が0件になった場合はindex.jsonを削除し、再作成しない
            if (updatedContents.length === 0) {
                if (baseCache.sha) {
                    await octokit.repos.deleteFile({
                        owner,
                        repo,
                        path: cachePath,
                        message: `Delete cache: ${cachePath}`,
                        branch,
                        sha: baseCache.sha
                    });
                }
                return;
            }

            const updatedCacheContent = JSON.stringify(updatedContents, null, 2);
            const encodedContent = Buffer.from(updatedCacheContent, 'utf-8').toString('base64');

            const params: import('@octokit/rest').RestEndpointMethodTypes['repos']['createOrUpdateFileContents']['parameters'] =
                {
                    owner,
                    repo,
                    path: cachePath,
                    message: `Update cache: ${operation} ${slug} in ${directory}`,
                    content: encodedContent,
                    branch,
                    ...(baseCache.sha ? { sha: baseCache.sha } : {})
                };

            await octokit.repos.createOrUpdateFileContents(params);
        };

        const initialCache = await fetchCache();

        try {
            await saveCache(initialCache);
        } catch (error) {
            const isConflict =
                typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                (error as { status?: number }).status === 409;

            if (!isConflict) throw error;

            // 競合時は最新の内容を取得し直して1度だけ再試行
            try {
                const latestCache = await fetchCache();
                await saveCache(latestCache);
            } catch (retryError) {
                console.error('キャッシュ更新に失敗 (retry):', retryError);
            }
        }
    } catch (error) {
        console.error('キャッシュ更新に失敗:', error);
        // キャッシュ更新の失敗は致命的ではないためエラーを投げない
    }
};

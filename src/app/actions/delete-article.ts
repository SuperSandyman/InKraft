'use server';

import { getCmsConfig, updateCacheForContent } from '@/lib/content';
import { getOctokitWithAuth } from '@/lib/github-api';

// getAllContentTypesを追加でインポート
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
        
        console.log('削除対象:', { slug, directory });
        console.log('見つかったcontentType:', contentType);
        
        if (contentType?.metaCache?.path) {
            cachePath = contentType.metaCache.path;
            console.log('キャッシュパス:', cachePath);
            
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
                console.log('index.json内の記事数:', arr.length);
                
                if (Array.isArray(arr) && arr.length === 1 && 'sha' in cacheFile) {
                    isLastArticle = true;
                    cacheSha = cacheFile.sha;
                    console.log('最後の1件として判定');
                }
            } catch (error) {
                console.log('index.jsonが存在しないか取得に失敗:', error);
            }
        } else {
            console.log('metaCacheが設定されていません');
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
            console.log('index.jsonを削除します:', cachePath);
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: cachePath,
                message: `Delete empty index.json for ${directory}`,
                sha: cacheSha,
                branch
            });
            console.log('index.jsonの削除が完了しました');
        } else {
            // それ以外はindex.jsonを更新
            console.log('index.jsonを更新します');
            await updateCacheForContent(directory, slug, {}, '', 'delete');
        }

        return true;
    } catch (error) {
        console.error('記事削除に失敗', error);
        return false;
    }
};

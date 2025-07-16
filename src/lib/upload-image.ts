import type { Octokit } from '@octokit/rest';

import { getOctokitWithAuth } from './github-api';
import { getCmsConfig } from './content';

export interface UploadImageParams {
    directory: string;
    slug: string;
    file: {
        name: string;
        type: string;
        buffer: Buffer;
    };
    branch?: string;
}

export interface UploadImageResult {
    imageUrl: string;
    commitSha: string;
}

/**
 * 画像ファイルをGitHubリポジトリにアップロードし、画像URLを返す
 * @param params アップロード情報
 * @returns アップロード結果（画像URL・コミットSHA）
 * @throws エラー時は例外
 */
export const uploadImageToGitHub = async (params: UploadImageParams): Promise<UploadImageResult> => {
    const { directory, slug, file, branch } = params;

    // バリデーション
    if (!directory || !slug) {
        throw new Error('directory/slugが未設定です');
    }

    // ファイルサイズ制限（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
        throw new Error(`ファイルサイズが制限（${maxSize / 1024 / 1024}MB）を超えています`);
    }

    // 画像ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('サポートされていない画像形式です（JPEG、PNG、GIF、WebP、SVGのみ対応）');
    }

    // base64エンコード
    const base64 = Buffer.from(file.buffer).toString('base64');

    // cms.config.jsonからリポジトリ情報を取得
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const useBranch = branch || config.branch || 'main';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${file.name.replace(/\.[^/.]+$/, '')}-${timestamp}.${fileExtension}`;
    // 例: posts/slug/ファイル名
    const imagePath = `${directory}/${slug}/${fileName}`;

    const octokit: Octokit = await getOctokitWithAuth();
    // 既存ファイルのSHA取得（上書き時用）
    let sha: string | undefined = undefined;
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: imagePath,
            ref: useBranch
        });
        if (!Array.isArray(data) && 'sha' in data && data.sha) {
            sha = data.sha;
        }
    } catch (e) {
        // 404なら新規作成なので無視、それ以外はエラー
        if (e instanceof Error) {
            const octokitError = e as { status?: number; message?: string };
            if (octokitError.status !== 404) {
                throw new Error(`既存ファイル確認エラー: ${octokitError.message || e.message}`);
            }
        } else {
            throw e;
        }
    }

    try {
        // ファイルアップロード
        const res = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: imagePath,
            message: `Upload image: ${fileName}`,
            content: base64,
            branch: useBranch,
            ...(sha && { sha })
        });

        const imageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${useBranch}/${imagePath}`;

        if (!res.data.commit?.sha) {
            throw new Error('コミットSHAが取得できませんでした');
        }

        return {
            imageUrl,
            commitSha: res.data.commit.sha
        };
    } catch (e) {
        if (e instanceof Error) {
            const octokitError = e as { status?: number; message?: string };
            if (octokitError.status === 422) {
                throw new Error('ファイルのアップロードに失敗しました。ファイル形式またはサイズを確認してください。');
            }
            throw new Error(`GitHubアップロードエラー: ${octokitError.message || e.message}`);
        }
        throw e;
    }
};

import { randomUUID } from 'crypto';
import type { Octokit } from '@octokit/rest';

import { getOctokitWithAuth } from './github-api';
import { getAllContentTypes, getCmsConfig } from './content';

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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp']
};

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;

const detectImageExtension = (buffer: Buffer): string | null => {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'jpg';
    }
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return 'png';
    }
    if (buffer.length >= 6) {
        const header = buffer.subarray(0, 6).toString('ascii');
        if (header === 'GIF87a' || header === 'GIF89a') {
            return 'gif';
        }
    }
    if (buffer.length >= 12) {
        const riff = buffer.subarray(0, 4).toString('ascii');
        const webp = buffer.subarray(8, 12).toString('ascii');
        if (riff === 'RIFF' && webp === 'WEBP') {
            return 'webp';
        }
    }
    return null;
};

const sanitizeBaseFileName = (fileName: string): string => {
    const noExtension = fileName.replace(/\.[^/.]+$/, '');
    const sanitized = noExtension
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return sanitized || 'image';
};

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
    if (!SLUG_PATTERN.test(slug)) {
        throw new Error('slug形式が不正です');
    }

    const contentTypes = await getAllContentTypes();
    const allowedDirectories = new Set(contentTypes.map((contentType) => contentType.directory));
    if (!allowedDirectories.has(directory)) {
        throw new Error('directoryが許可されていません');
    }

    // ファイルサイズ制限（10MB）
    if (file.buffer.length === 0) {
        throw new Error('空のファイルはアップロードできません');
    }
    if (file.buffer.length > MAX_FILE_SIZE) {
        throw new Error(`ファイルサイズが制限（${MAX_FILE_SIZE / 1024 / 1024}MB）を超えています`);
    }

    const allowedExtensions = ALLOWED_MIME_TYPES[file.type];
    if (!allowedExtensions) {
        throw new Error('サポートされていない画像形式です（JPEG、PNG、GIF、WebPのみ対応）');
    }
    const detectedExtension = detectImageExtension(file.buffer);
    if (!detectedExtension || !allowedExtensions.includes(detectedExtension)) {
        throw new Error('ファイル内容と画像形式が一致しません');
    }

    // base64エンコード
    const base64 = Buffer.from(file.buffer).toString('base64');

    // cms.config.jsonからリポジトリ情報を取得
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const useBranch = branch || config.branch || 'main';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeBaseName = sanitizeBaseFileName(file.name);
    const suffix = randomUUID().slice(0, 8);
    const fileName = `${safeBaseName}-${timestamp}-${suffix}.${detectedExtension}`;
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

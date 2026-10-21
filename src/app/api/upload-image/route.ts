import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { isUserAllowed } from '@/lib/allowed-users';
import { checkRateLimit } from '@/lib/rate-limit';
import { ImageUploadValidationError, MAX_IMAGE_FILE_SIZE, uploadImageToGitHub } from '@/lib/upload-image';

const MAX_REQUEST_BYTES = MAX_IMAGE_FILE_SIZE + 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!isUserAllowed(session)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const requestKey = session.user.githubId || session.user.githubLogin || session.user.email || 'unknown-user';
        const limit = checkRateLimit(`upload-image:${requestKey}`, { windowMs: 10 * 60 * 1000, maxRequests: 20 });
        if (!limit.allowed) {
            return NextResponse.json(
                { error: 'アップロードの回数が上限に達しました。しばらく待ってから再試行してください。' },
                { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
            );
        }

        const contentLength = Number(req.headers.get('content-length') ?? '0');
        if (!Number.isFinite(contentLength) || contentLength > MAX_REQUEST_BYTES) {
            return NextResponse.json({ error: 'ファイルサイズが大きすぎます。' }, { status: 413 });
        }

        const formData = await req.formData();
        const directory = formData.get('directory');
        const slug = formData.get('slug');
        const file = formData.get('file');
        if (typeof directory !== 'string' || typeof slug !== 'string' || !(file instanceof File)) {
            console.error('Invalid params', { directory, slug, fileType: typeof file, file });
            return NextResponse.json({ error: 'invalid params' }, { status: 400 });
        }
        if (file.size === 0) {
            return NextResponse.json({ error: '空のファイルはアップロードできません。' }, { status: 400 });
        }
        if (file.size > MAX_IMAGE_FILE_SIZE) {
            return NextResponse.json({ error: 'ファイルサイズが制限（10MB）を超えています。' }, { status: 413 });
        }
        // File→ArrayBuffer→Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { imageUrl } = await uploadImageToGitHub({
            directory,
            slug,
            file: {
                name: file.name,
                type: file.type,
                buffer
            }
        });
        return NextResponse.json({ imageUrl });
    } catch (error) {
        if (error instanceof ImageUploadValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('API upload-image error:', error);
        return NextResponse.json({ error: '画像のアップロードに失敗しました。' }, { status: 500 });
    }
}

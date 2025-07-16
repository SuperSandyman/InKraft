import { NextRequest, NextResponse } from 'next/server';

import { uploadImageToGitHub } from '@/lib/upload-image';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const directory = formData.get('directory');
        const slug = formData.get('slug');
        const file = formData.get('file');
        if (typeof directory !== 'string' || typeof slug !== 'string' || !(file instanceof File)) {
            console.error('Invalid params', { directory, slug, fileType: typeof file, file });
            return NextResponse.json({ error: 'invalid params' }, { status: 400 });
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
    } catch (e) {
        console.error('API upload-image error:', e);
        if (e instanceof Error) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'unknown error' }, { status: 500 });
    }
}

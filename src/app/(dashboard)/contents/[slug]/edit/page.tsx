import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import type { FrontmatterSchema } from '@/types/frontmatter';
import ContentEditClient from './content-edit-client';

interface PageProps {
    params: { slug: string };
}

export default async function ContentEditPage({ params }: PageProps) {
    const { slug } = params;
    if (!slug) {
        notFound();
    }

    // frontmatter.scheme.example.json をサーバーサイドで読み込む
    const schemaPath = path.join(process.cwd(), 'frontmatter.scheme.example.json');
    const schema: FrontmatterSchema = { fields: [] };
    try {
        const json = fs.readFileSync(schemaPath, 'utf-8');
        const cleaned = json.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '');
        const arr = JSON.parse(cleaned);
        schema.fields = arr;
    } catch (e) {
        console.error('frontmatter.scheme.example.json の読み込みに失敗:', e);
        notFound();
    }

    return <ContentEditClient schema={schema} slug={slug} />;
}

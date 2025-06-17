import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import ContentNewClient from './content-new-client';

import type { FrontmatterSchema } from '@/types/frontmatter';

export default async function ContentNewPage() {
    // frontmatter.scheme.example.json をサーバーサイドで読み込む
    const schemaPath = path.join(process.cwd(), 'frontmatter.scheme.example.json');
    const schema: FrontmatterSchema = { fields: [] };
    try {
        const json = fs.readFileSync(schemaPath, 'utf-8');
        // コメント行を除去してパース
        const cleaned = json.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '');
        const arr = JSON.parse(cleaned);
        schema.fields = arr;
    } catch (e) {
        console.error('frontmatter.scheme.example.json の読み込みに失敗:', e);
        notFound();
    }

    return <ContentNewClient schema={schema} />;
}

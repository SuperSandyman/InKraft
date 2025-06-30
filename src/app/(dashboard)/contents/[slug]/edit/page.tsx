import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import type { FrontmatterSchema } from '@/types/frontmatter';
import ContentEditClient from './content-edit-client';
import { fetchAllContentsFromGitHub } from '@/lib/content';

interface PageProps {
    params: { slug: string };
}

export default async function ContentEditPage(props: PageProps) {
    const { params } = props;
    const { slug } = await params;
    if (!slug) {
        notFound();
    }

    // スキーマ読み込み
    const schemaPath = path.join(process.cwd(), 'frontmatter.scheme.json');
    const schema: FrontmatterSchema = { fields: [] };
    try {
        const json = fs.readFileSync(schemaPath, 'utf-8');
        const cleaned = json.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '');
        const arr = JSON.parse(cleaned);
        schema.fields = arr;
    } catch (e) {
        console.error('frontmatter.scheme.json の読み込みに失敗:', e);
        notFound();
    }

    // 記事データ取得
    const allContents = await fetchAllContentsFromGitHub();
    const article = allContents.find((c) => c.slug === slug);
    if (!article) {
        notFound();
    }

    return <ContentEditClient schema={schema} article={article} />;
}

import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import type { FrontmatterSchema } from '@/types/frontmatter';
import ContentEditClient from './content-edit-client';
import { fetchContentBySlug } from '@/lib/content';

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

    // 記事詳細データ取得（本文全体 + frontmatter）
    const articleDetail = await fetchContentBySlug(slug);
    if (!articleDetail) {
        notFound();
    }

    // ContentEditClient用にContent型のオブジェクトを作成
    const article = {
        slug,
        excerpt: '',
        directory: articleDetail.directory,
        ...articleDetail.frontmatter
    };

    return <ContentEditClient schema={schema} article={article} fullContent={articleDetail.content} />;
}

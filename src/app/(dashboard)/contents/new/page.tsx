import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import ContentNewClient from './content-new-client';

import type { FrontmatterSchema } from '@/types/frontmatter';
import { getAllContentTypes, getCmsConfig } from '@/lib/content';

export default async function ContentNewPage() {
    // frontmatter.scheme.json をサーバーサイドで読み込む
    const schemaPath = path.join(process.cwd(), 'frontmatter.scheme.json');
    const schema: FrontmatterSchema = { fields: [] };
    try {
        const json = fs.readFileSync(schemaPath, 'utf-8');
        // コメント行を除去してパース
        const cleaned = json.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '');
        const arr = JSON.parse(cleaned);
        schema.fields = arr;
    } catch (e) {
        console.error('frontmatter.scheme.json の読み込みに失敗:', e);
        notFound();
    }

    // cms.config.json から directory 一覧を取得（ローダー経由）
    let directories: string[] = [];
    try {
        const cfg = await getCmsConfig();
        const types = await getAllContentTypes();
        const fromTypes = types.map((t) => t.directory);
        // draftDirectory を先頭にしたい場合
        const draft = cfg.draftDirectory;
        directories = draft ? [draft, ...fromTypes.filter((d) => d !== draft)] : fromTypes;
    } catch (e) {
        console.error('cms.config の読み込みに失敗:', e);
    }

    return <ContentNewClient schema={schema} directories={directories} />;
}

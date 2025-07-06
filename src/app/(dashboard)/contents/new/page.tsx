import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import ContentNewClient from './content-new-client';

import type { FrontmatterSchema } from '@/types/frontmatter';

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

    // cms.config.json から directory 一覧を取得
    interface ContentConfigItem {
        directory: string;
        articleFile: string;
        imageDirInsideContent: boolean;
        metaCache: {
            type: string;
            path: string;
        };
    }

    const configPath = path.join(process.cwd(), 'cms.config.json');
    let directories: string[] = [];
    try {
        const configJson = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configJson);
        directories = Array.isArray(config.content)
            ? (config.content as ContentConfigItem[]).map((c) => c.directory)
            : [];
        // draftDirectory も選択肢に追加（重複しない場合のみ）
        if (config.draftDirectory && !directories.includes(config.draftDirectory)) {
            directories.unshift(config.draftDirectory);
        }
    } catch (e) {
        console.error('cms.config.json の読み込みに失敗:', e);
    }

    return <ContentNewClient schema={schema} directories={directories} />;
}

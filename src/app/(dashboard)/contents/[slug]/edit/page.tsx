import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

import type { FrontmatterSchema } from '@/types/frontmatter';
import ContentEditClient from './content-edit-client';
import { fetchContentBySlug } from '@/lib/content';
import { replaceFileNameWithRawUrlInMarkdown } from '@/lib/github-path';

interface PageProps {
    params: Promise<{ slug: string }>;
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

    // cms.config.json からリポジトリ情報取得
    const configPath = path.join(process.cwd(), 'cms.config.json');
    let owner = '';
    let repo = '';
    let branch = 'main';
    try {
        const configRaw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configRaw);
        if (config.targetRepository) {
            const [o, r] = config.targetRepository.split('/');
            owner = o;
            repo = r;
        }
        if (config.branch) {
            branch = config.branch;
        }
    } catch (e) {
        console.error('cms.config.json の読み込みに失敗:', e);
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

    // 本文の画像パスをファイル名→raw URLに変換
    const contentForEdit = await replaceFileNameWithRawUrlInMarkdown(
        articleDetail.content,
        articleDetail.directory,
        slug,
        owner,
        repo,
        branch
    );

    return (
        <ContentEditClient
            schema={schema}
            article={article}
            fullContent={contentForEdit}
            githubInfo={{ owner, repo, branch }}
        />
    );
}

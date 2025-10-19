'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { FrontmatterSchema, FrontmatterData } from '@/types/frontmatter';
import MdEditor from '@/components/content-edit/md-editor';
import DynamicContentForm from '@/components/content-edit/dynamic-content-form';
import type { Content } from '@/lib/content';
import { updateArticle } from '@/app/actions/update-article';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import Breadcrumbs from '@/components/common/breadcrumbs';

interface GithubInfo {
    owner: string;
    repo: string;
    branch: string;
}

interface ContentEditClientProps {
    schema: FrontmatterSchema;
    article: Content;
    fullContent?: string;
    githubInfo: GithubInfo;
    directories?: string[];
}

const ContentEditClient = ({ schema, article, fullContent, githubInfo, directories = [] }: ContentEditClientProps) => {
    const router = useRouter();
    const [content, setContent] = useState<string>(() => {
        // fullContentが提供されている場合はそれを使用、そうでなければfallback
        if (fullContent) {
            return fullContent;
        }
        const title = typeof article.title === 'string' ? article.title : '';
        return `# ${title}\n\n${article.excerpt}`;
    });
    const initialMeta = useMemo(() => {
        const meta: FrontmatterData = {};

        // slugフィールドを強制的に追加
        meta['slug'] =
            article.slug ||
            (typeof article.title === 'string'
                ? article.title
                      .toLowerCase()
                      .replace(/[^a-zA-Z0-9-_]/g, '-')
                      .replace(/-+/g, '-')
                      .trim()
                : '');

        schema.fields.forEach((field) => {
            const fieldValue = article[field.name];
            if (fieldValue !== undefined && fieldValue !== null) {
                if (typeof fieldValue === 'string' || typeof fieldValue === 'boolean' || Array.isArray(fieldValue)) {
                    meta[field.name] = fieldValue;
                } else {
                    meta[field.name] = '';
                }
            } else {
                meta[field.name] = '';
            }
        });
        return {
            ...meta,
            directory: article.directory
        };
    }, [article, schema]);
    const [formMeta, setFormMeta] = useState<FrontmatterData & { directory?: string }>(initialMeta);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleFormSubmit = async (formData: FrontmatterData & { directory?: string }) => {
        setIsSubmitting(true);
        try {
            const { directory: formDirectory, slug: newSlug, ...frontmatter } = formData;

            const sanitizedSlug =
                typeof newSlug === 'string'
                    ? newSlug
                          .toLowerCase()
                          .replace(/[^a-zA-Z0-9-_]/g, '-')
                          .replace(/-+/g, '-')
                          .trim()
                    : article.slug;

            if (!sanitizedSlug) {
                alert('有効なスラッグを入力してください');
                setIsSubmitting(false);
                return;
            }

            const targetDirectory =
                typeof formDirectory === 'string' && formDirectory.trim() !== '' ? formDirectory : article.directory;

            const result = await updateArticle({
                slug: sanitizedSlug,
                directory: targetDirectory,
                frontmatter,
                content,
                originalSlug: article.slug,
                originalDirectory: article.directory
            });

            if (result.success) {
                router.push('/contents');
            } else {
                alert(result.error || '保存に失敗しました');
            }
        } catch (error) {
            console.error('保存に失敗しました:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormMetaChange = (data: FrontmatterData & { directory?: string }) => {
        setFormMeta((prev) => ({
            ...prev,
            ...data,
            slug: typeof data.slug === 'string' ? data.slug : typeof prev.slug === 'string' ? prev.slug : '',
            directory:
                typeof data.directory === 'string' && data.directory.trim() !== ''
                    ? data.directory
                    : typeof prev.directory === 'string'
                    ? prev.directory
                    : article.directory
        }));
    };

    const currentDirectory =
        typeof formMeta.directory === 'string' && formMeta.directory !== '' ? formMeta.directory : article.directory;
    const currentSlug = typeof formMeta.slug === 'string' && formMeta.slug !== '' ? formMeta.slug : article.slug;
    const currentTitle = typeof formMeta.title === 'string' ? formMeta.title : '';

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumbs
                        items={[
                            { label: 'ダッシュボード', href: '/' },
                            { label: '記事一覧', href: '/contents' },
                            { label: currentTitle || '...', href: undefined },
                            { label: '編集', isCurrent: true }
                        ]}
                    />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                <div className="space-y-6">
                    <div className="px-2 md:px-4 mt-8 mb-6">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">記事編集</h1>
                        <p className="text-base text-muted-foreground">記事の内容とメタデータを編集します。</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2 md:px-4">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-card rounded-lg border p-4">
                                <h2 className="text-lg font-semibold mb-4">記事内容</h2>
                                <MdEditor
                                    value={content}
                                    onChange={setContent}
                                    height={700}
                                    directory={currentDirectory}
                                    slug={currentSlug}
                                    githubInfo={githubInfo}
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <DynamicContentForm
                                schema={schema}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                                directories={directories}
                                initialValues={initialMeta}
                                onChange={handleFormMetaChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContentEditClient;

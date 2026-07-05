'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { FrontmatterSchema, FrontmatterData } from '@/types/frontmatter';
import MdEditor from '@/components/content-edit/md-editor';
import DynamicContentForm from '@/components/content-edit/dynamic-content-form';
import type { Content } from '@/lib/content';
import { updateArticle } from '@/app/actions/update-article';

import { SidebarTrigger } from '@/components/ui/sidebar';
import Breadcrumbs from '@/components/common/breadcrumbs';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';
import { useIsMobile } from '@/hooks/use-mobile';

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

const normalizeMeta = (meta: FrontmatterData & { directory?: string }) => {
    const entries: Array<[string, unknown]> = Object.entries(meta).map(([key, value]) => {
        if (Array.isArray(value)) {
            return [key, [...value]];
        }
        if (value === undefined || value === null) {
            return [key, ''];
        }
        return [key, value];
    });
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return Object.fromEntries(entries);
};

const ContentEditClient = ({ schema, article, fullContent, githubInfo, directories = [] }: ContentEditClientProps) => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const initialContentValue = useMemo(() => {
        if (fullContent) {
            return fullContent;
        }
        const title = typeof article.title === 'string' ? article.title : '';
        return `# ${title}\n\n${article.excerpt}`;
    }, [article, fullContent]);
    const [content, setContent] = useState<string>(initialContentValue);
    const initialContentRef = useRef<string>(initialContentValue);
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
            if (fieldValue === undefined || fieldValue === null) {
                meta[field.name] = '';
                return;
            }
            // dateフィールド特別処理（最短手数で文字列化）
            if (field.type === 'date') {
                if (fieldValue instanceof Date) {
                    meta[field.name] = isNaN(fieldValue.getTime()) ? '' : fieldValue.toISOString().slice(0, 10);
                    return;
                }
                if (typeof fieldValue === 'string') {
                    let s = fieldValue.trim();
                    if (s.includes('T')) s = s.split('T')[0];
                    if (s.includes(' ')) s = s.split(' ')[0];
                    s = s.replace(/\//g, '-');
                    // 正規 yyyy-mm-dd ならそのまま
                    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                        meta[field.name] = s;
                        return;
                    }
                    // パースできれば ISO へ
                    const parsed = new Date(s);
                    meta[field.name] = isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
                    return;
                }
                // その他（配列/booleanなど）は空
                meta[field.name] = '';
                return;
            }
            // 既存ロジック（string/boolean/array以外は空）
            if (typeof fieldValue === 'string' || typeof fieldValue === 'boolean' || Array.isArray(fieldValue)) {
                meta[field.name] = fieldValue;
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
    const initialNormalizedMetaRef = useRef<Record<string, unknown>>(normalizeMeta(initialMeta));
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    useEffect(() => {
        const normalizedCurrent = normalizeMeta(formMeta);
        const metaChanged = JSON.stringify(normalizedCurrent) !== JSON.stringify(initialNormalizedMetaRef.current);
        const contentChanged = content !== initialContentRef.current;
        setHasUnsavedChanges(contentChanged || metaChanged);
    }, [content, formMeta]);

    useNavigationGuard(hasUnsavedChanges && !isSubmitting);

    const handleContentChange = useCallback((value: string) => {
        setContent(value);
    }, []);
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
                initialContentRef.current = content;
                initialNormalizedMetaRef.current = normalizeMeta({
                    ...frontmatter,
                    slug: sanitizedSlug,
                    directory: targetDirectory
                });
                router.push('/contents');
                // キャッシュ再検証をトリガー
                router.refresh();
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

    const handleFormMetaChange = useCallback(
        (data: FrontmatterData & { directory?: string }) => {
            setFormMeta((prev) => {
                const nextDirectory =
                    typeof data.directory === 'string' && data.directory.trim() !== ''
                        ? data.directory
                        : typeof prev.directory === 'string'
                        ? prev.directory
                        : article.directory;
                const nextSlug =
                    typeof data.slug === 'string'
                        ? data.slug
                        : typeof prev.slug === 'string'
                        ? prev.slug
                        : article.slug;
                return {
                    ...prev,
                    ...data,
                    slug: nextSlug,
                    directory: nextDirectory
                };
            });
        },
        [article.directory, article.slug]
    );

    const currentDirectory =
        typeof formMeta.directory === 'string' && formMeta.directory !== '' ? formMeta.directory : article.directory;
    const currentSlug = typeof formMeta.slug === 'string' && formMeta.slug !== '' ? formMeta.slug : article.slug;
    const currentTitle = typeof formMeta.title === 'string' ? formMeta.title : '';
    const metadataForm = (
        <DynamicContentForm
            schema={schema}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            directories={directories}
            initialValues={initialMeta}
            onChange={handleFormMetaChange}
        />
    );

    return (
        <>
            <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center gap-3 border-b border-border/70 bg-white/88 px-4 backdrop-blur-md transition-[width,height] ease-linear md:px-8 group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
                <div className="flex min-w-0 items-center gap-3">
                    <SidebarTrigger className="size-9 rounded-lg md:hidden" />
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
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="space-y-6">
                    <div>
                        <h1 className="mb-2 text-2xl font-extrabold tracking-normal text-slate-950">記事編集</h1>
                        <p className="text-sm font-bold text-muted-foreground">記事の内容とメタデータを編集します。</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {isMobile && (
                        <div className="lg:hidden">
                            <details className="rounded-lg border border-border/70 bg-white shadow-[0_12px_32px_rgba(27,42,71,0.07)]">
                                <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-slate-900">
                                    記事メタデータ
                                </summary>
                                <div className="border-t border-border/60 p-3">{metadataForm}</div>
                            </details>
                        </div>
                        )}
                        <div className="min-w-0 space-y-4 lg:col-span-2">
                            <div className="-mx-2 rounded-lg border border-border/70 bg-white p-2 shadow-[0_12px_32px_rgba(27,42,71,0.07)] sm:mx-0 sm:p-4">
                                <h2 className="mb-3 px-1 text-lg font-bold sm:px-0">記事内容</h2>
                                <MdEditor
                                    value={content}
                                    onChange={handleContentChange}
                                    height={640}
                                    directory={currentDirectory}
                                    slug={currentSlug}
                                    githubInfo={githubInfo}
                                />
                            </div>
                        </div>
                        {!isMobile && (
                        <div className="hidden lg:col-span-1 lg:block">
                            {metadataForm}
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContentEditClient;

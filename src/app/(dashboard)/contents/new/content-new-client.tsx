'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { FrontmatterSchema, FrontmatterData } from '@/types/frontmatter';
import MdEditor from '@/components/content-edit/md-editor';
import DynamicContentForm from '@/components/content-edit/dynamic-content-form';
import { createArticle } from '@/app/actions/create-article';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
// パンくずは共通コンポーネントを使用
import Breadcrumbs from '@/components/common/breadcrumbs';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContentNewClientProps {
    schema: FrontmatterSchema;
    directories?: string[];
}

const DEFAULT_CONTENT = '# 新しい記事\n\nここに記事の内容を書いてください...';

const normalizeMeta = (meta: FrontmatterData & { directory?: string } = { slug: '' }) => {
    const entries = Object.entries(meta).map(([key, value]) => {
        if (Array.isArray(value)) {
            return [key, [...value]];
        }
        if (value === undefined || value === null) {
            return [key, ''];
        }
        return [key, value];
    });
    entries.sort(([a], [b]) => String(a).localeCompare(String(b)));
    return Object.fromEntries(entries);
};

const ContentNewClient = ({ schema, directories = [] }: ContentNewClientProps) => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [content, setContent] = useState<string>(DEFAULT_CONTENT);
    const initialContentRef = useRef<string>(DEFAULT_CONTENT);
    const [formMeta, setFormMeta] = useState<FrontmatterData & { directory?: string }>({ slug: '' });
    const [initialFormValues, setInitialFormValues] = useState<FrontmatterData & { directory?: string }>({ slug: '' });
    const initialMetaRef = useRef<(FrontmatterData & { directory?: string }) | null>(null);
    const hasCapturedInitialMetaRef = useRef<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    useEffect(() => {
        const baselineMeta = initialMetaRef.current ?? formMeta;
        const normalizedInitial = normalizeMeta(baselineMeta);
        const normalizedCurrent = normalizeMeta(formMeta);
        const contentChanged = content !== initialContentRef.current;
        const metaChanged = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial);
        setHasUnsavedChanges(contentChanged || metaChanged);
    }, [content, formMeta]);

    useNavigationGuard(hasUnsavedChanges && !isSubmitting);

    const handleContentChange = useCallback((value: string) => {
        setContent(value);
    }, []);

    const handleFormSubmit = async (formData: FrontmatterData & { directory: string }) => {
        setIsSubmitting(true);
        const slug = (formData.slug ?? '').toString();
        try {
            if (!slug || slug.trim() === '') {
                alert('スラッグを入力してください');
                setIsSubmitting(false);
                return;
            }

            const sanitizedSlug = slug
                .toLowerCase()
                .replace(/[^a-zA-Z0-9-_]/g, '-')
                .replace(/-+/g, '-')
                .trim();

            if (!sanitizedSlug) {
                alert('有効なスラッグを入力してください');
                setIsSubmitting(false);
                return;
            }

            const { directory, ...frontmatter } = formData;
            const result = await createArticle({
                slug: sanitizedSlug,
                directory,
                frontmatter,
                content
            });

            if (result.success) {
                initialContentRef.current = content;
                initialMetaRef.current = normalizeMeta({
                    ...frontmatter,
                    directory,
                    slug: sanitizedSlug
                }) as FrontmatterData & { directory?: string };
                setInitialFormValues(initialMetaRef.current);
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

    const handleFormMetaChange = useCallback((data: FrontmatterData & { directory?: string }) => {
        const mergedMeta: FrontmatterData & { directory?: string } = {
            ...data,
            slug: typeof data.slug === 'string' ? data.slug : ''
        };
        const clonedMeta = normalizeMeta(mergedMeta) as FrontmatterData & { directory?: string };
        if (!hasCapturedInitialMetaRef.current) {
            initialMetaRef.current = { ...clonedMeta };
            setInitialFormValues(clonedMeta);
            hasCapturedInitialMetaRef.current = true;
        }
        setFormMeta(clonedMeta);
    }, []);

    const handleGenerateTemplate = async () => {
        setIsGenerating(true);
        setContent('');
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: aiPrompt })
            });
            if (!response.body) throw new Error('ストリームが取得できません');
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let result = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                result += chunk;
                setContent(result);
            }
        } catch {
            setContent('AI生成に失敗しました');
        } finally {
            setIsGenerating(false);
        }
    };

    const aiTemplateForm = (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">AIで記事テンプレート作成</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleGenerateTemplate();
                    }}
                    className="flex flex-col gap-3"
                >
                    <Input
                        type="text"
                        placeholder="どんな記事を書きますか？"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        disabled={isGenerating}
                    />
                    <Button type="submit" disabled={!aiPrompt || isGenerating} className="w-full">
                        {isGenerating ? '生成中...' : 'テンプレート生成'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const metadataForm = (
        <DynamicContentForm
            schema={schema}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            directories={directories}
            initialValues={initialFormValues}
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
                            { label: '新規記事作成', isCurrent: true }
                        ]}
                    />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="space-y-6">
                    <div>
                        <h1 className="mb-2 text-2xl font-extrabold tracking-normal text-slate-950">新規記事作成</h1>
                        <p className="text-sm font-bold text-muted-foreground">
                            記事の内容とメタデータを入力して新しい記事を作成します。
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {isMobile && (
                        <div className="space-y-3 lg:hidden">
                            <details className="rounded-lg border border-border/70 bg-white shadow-[0_12px_32px_rgba(27,42,71,0.07)]">
                                <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-slate-900">
                                    AIで記事テンプレート作成
                                </summary>
                                <div className="border-t border-border/60 p-3">{aiTemplateForm}</div>
                            </details>
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
                                    directory={typeof formMeta.directory === 'string' ? formMeta.directory : ''}
                                    slug={typeof formMeta.slug === 'string' ? formMeta.slug : ''}
                                />
                            </div>
                        </div>
                        {!isMobile && (
                        <div className="lg:col-span-1 space-y-4 order-3 hidden lg:block">
                            {aiTemplateForm}
                            {metadataForm}
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContentNewClient;

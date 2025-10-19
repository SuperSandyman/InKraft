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
import { Separator } from '@/components/ui/separator';
// パンくずは共通コンポーネントを使用
import Breadcrumbs from '@/components/common/breadcrumbs';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';

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
    const [content, setContent] = useState<string>(DEFAULT_CONTENT);
    const initialContentRef = useRef<string>(DEFAULT_CONTENT);
    const [formMeta, setFormMeta] = useState<FrontmatterData & { directory?: string }>({ slug: '' });
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
        console.log('handleFormSubmit: formData =', formData);
        const slug = (formData.slug ?? '').toString();
        console.log('handleFormSubmit: slug =', slug, 'typeof:', typeof slug);
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

    const handleFormMetaChange = useCallback((data: FrontmatterData & { directory?: string }) => {
        const mergedMeta: FrontmatterData & { directory?: string } = {
            ...data,
            slug: typeof data.slug === 'string' ? data.slug : ''
        };
        const clonedMeta = normalizeMeta(mergedMeta) as FrontmatterData & { directory?: string };
        if (!hasCapturedInitialMetaRef.current) {
            initialMetaRef.current = { ...clonedMeta };
            hasCapturedInitialMetaRef.current = true;
        }
        setFormMeta(clonedMeta);
    }, []);

    useEffect(() => {
        console.log('[MdEditor debug] directory:', typeof formMeta.directory, formMeta.directory);
        console.log('[MdEditor debug] slug:', typeof formMeta.slug, formMeta.slug);
    }, [formMeta.directory, formMeta.slug]);

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
                            { label: '新規記事作成', isCurrent: true }
                        ]}
                    />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                <div className="space-y-6">
                    <div className="px-2 md:px-4 mt-8 mb-6">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">新規記事作成</h1>
                        <p className="text-base text-muted-foreground">
                            記事の内容とメタデータを入力して新しい記事を作成します。
                        </p>
                    </div>
                    {/* PC: メタデータ右/ モバイル: メタデータ上 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2 md:px-4">
                        {/* モバイル時: メタデータ・AI生成を上に表示 */}
                        <div className="lg:hidden space-y-4 order-1">
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
                            <DynamicContentForm
                                schema={schema}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                                directories={directories}
                                initialValues={initialMetaRef.current ?? formMeta}
                                onChange={handleFormMetaChange}
                            />
                        </div>
                        {/* PC: エディタ左/ モバイル: 下 */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-card rounded-lg border p-4">
                                <h2 className="text-lg font-semibold mb-4">記事内容</h2>
                                <MdEditor
                                    value={content}
                                    onChange={handleContentChange}
                                    height={700}
                                    directory={typeof formMeta.directory === 'string' ? formMeta.directory : ''}
                                    slug={typeof formMeta.slug === 'string' ? formMeta.slug : ''}
                                />
                            </div>
                        </div>
                        {/* PC: メタデータ右/ モバイル: 非表示 */}
                        <div className="lg:col-span-1 space-y-4 order-3 hidden lg:block">
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
                            <DynamicContentForm
                                schema={schema}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                                directories={directories}
                                initialValues={initialMetaRef.current ?? formMeta}
                                onChange={handleFormMetaChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContentNewClient;

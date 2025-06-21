'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { FrontmatterSchema, FrontmatterData } from '@/types/frontmatter';
import MdEditor from '@/components/content-edit/md-editor';
import DynamicContentForm from '@/components/content-edit/dynamic-content-form';
import { mockContents } from '@/lib/content';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

interface ContentEditClientProps {
    schema: FrontmatterSchema;
    slug: string;
}

const ContentEditClient = ({ schema, slug }: ContentEditClientProps) => {
    const router = useRouter();
    const [content, setContent] = useState<string>('');
    const [meta, setMeta] = useState<FrontmatterData>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    useEffect(() => {
        // ダミーデータから記事取得
        const article = mockContents.find((c) => c.slug === slug);
        if (article) {
            setContent(`# ${article.title}\n\n${article.excerpt}`);
            setMeta({
                title: article.title,
                tags: article.tags,
                date: article.publishedAt ? article.publishedAt.split('T')[0].replace(/-/g, '/') : '',
                draft: article.status === 'draft'
            });
        }
        setIsLoaded(true);
    }, [slug]);

    const handleFormSubmit = async (formData: FrontmatterData) => {
        setIsSubmitting(true);
        try {
            // TODO: 実際のAPI呼び出し実装
            console.log('Form Data:', formData);
            console.log('Content:', content);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            router.push('/contents');
        } catch (error) {
            console.error('保存に失敗しました:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return <div>読み込み中...</div>;
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/">ダッシュボード</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/contents">記事一覧</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">{meta.title || '...'}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>編集</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
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
                                <MdEditor value={content} onChange={setContent} height={700} />
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <DynamicContentForm
                                schema={schema}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                                initialValues={meta}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContentEditClient;

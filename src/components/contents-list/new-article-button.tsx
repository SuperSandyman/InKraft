'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const NewArticleButton = () => {
    const router = useRouter();
    return (
        <Button size="default" className="h-10 px-6 text-sm font-semibold" onClick={() => router.push('/contents/new')}>
            新規記事作成
        </Button>
    );
};

export default NewArticleButton;

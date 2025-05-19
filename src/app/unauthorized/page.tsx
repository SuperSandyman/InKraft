import { Button } from '@/components/ui/button';
import { signOut } from '@/auth';

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-5 font-sans">
            <h1 className="text-3xl font-bold mb-4 md:text-4xl">アクセスが許可されていません</h1>
            <p className="text-lg mb-8 md:text-xl">申し訳ありませんが、このページにアクセスする権限がありません。</p>
            <form
                action={async () => {
                    'use server';
                    await signOut();
                }}
            >
                <Button className="px-6 py-3">ログアウト</Button>
            </form>
        </div>
    );
}

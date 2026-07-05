import { Button } from '@/components/ui/button';
import { signOut } from '@/auth';

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-5 text-center font-sans">
            <div className="w-full max-w-lg rounded-lg border border-border/70 bg-white p-8 shadow-[0_18px_50px_rgba(27,42,71,0.09)]">
            <h1 className="mb-4 text-3xl font-extrabold tracking-normal text-slate-950 md:text-4xl">アクセスが許可されていません</h1>
            <p className="mb-8 text-base font-bold text-muted-foreground md:text-lg">申し訳ありませんが、このページにアクセスする権限がありません。</p>
            <form
                action={async () => {
                    'use server';
                    await signOut();
                }}
            >
                <Button className="rounded-full px-6 py-3">ログアウト</Button>
            </form>
            </div>
        </div>
    );
}

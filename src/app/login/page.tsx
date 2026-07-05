import { Button } from '@/components/ui/button';
import { FaGithub } from 'react-icons/fa';
import { signIn } from '@/auth';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-lg border border-border/70 bg-white p-8 text-center shadow-[0_18px_50px_rgba(27,42,71,0.09)]">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <FaGithub size={30} />
                </div>
                <h1 className="text-3xl font-extrabold tracking-normal text-slate-950">InKraft</h1>
                <p className="mt-2 text-sm font-bold text-muted-foreground">GitHubでログイン</p>

                <form
                    className="mt-8"
                    action={async () => {
                        'use server';
                        await signIn('github', {
                            callbackUrl: '/',
                            redirect: true
                        });
                    }}
                >
                    <Button className="mx-auto flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-6 text-base text-white hover:bg-slate-800">
                        <FaGithub size={20} />
                        <span>GitHubでログイン</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}

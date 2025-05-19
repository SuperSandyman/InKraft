import { Button } from '@/components/ui/button';
import { FaGithub } from 'react-icons/fa';
import { signIn } from '@/auth';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-md text-center space-y-6">
                <h1 className="text-3xl font-bold">ログイン</h1>

                <form
                    action={async () => {
                        'use server';
                        await signIn('github', {
                            callbackUrl: '/',
                            redirect: true
                        });
                    }}
                >
                    <Button className="mx-auto px-4 flex items-center justify-center space-x-2 text-base py-6 bg-black text-white hover:bg-black/90">
                        <FaGithub size={20} />
                        <span>GitHubでログイン</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}

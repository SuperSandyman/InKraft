import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fontsource/line-seed-jp/japanese-400.css';
import '@fontsource/line-seed-jp/japanese-700.css';
import '@fontsource/line-seed-jp/japanese-800.css';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap'
});

export const metadata: Metadata = {
    title: 'InKraft',
    description: 'Git based CMS.',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true
        }
    }
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={`${inter.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}

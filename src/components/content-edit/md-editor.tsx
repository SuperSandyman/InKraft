'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ICommand } from '@uiw/react-md-editor';

// MDEditorはSSR非対応のため動的インポート
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });

interface GithubInfo {
    owner: string;
    repo: string;
    branch: string;
}

interface MdEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    height?: number;
    directory?: string;
    slug?: string;
    githubInfo?: GithubInfo;
}

const MdEditor = ({
    value = '**Hello world!!!**',
    onChange,
    height = 400,
    directory,
    slug,
    githubInfo
}: MdEditorProps) => {
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dirRef = useRef(directory);
    const slugRef = useRef(slug);
    useEffect(() => {
        dirRef.current = directory;
        slugRef.current = slug;
    }, [directory, slug]);

    // 画像アップロード処理
    const handleImageUpload = async (file: File) => {
        if (!dirRef.current || !slugRef.current) {
            window.alert('directory/slugが未設定です');
            return;
        }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('directory', dirRef.current);
            formData.append('slug', slugRef.current);
            formData.append('file', file);
            const res = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) {
                const text = await res.text();
                window.alert(`APIエラー: ${text}`);
                throw new Error(text);
            }
            const data = await res.json();
            const imageUrl = data.imageUrl;
            // ファイル名から拡張子を除いたaltテキストを生成
            const altText = file.name.replace(/\.[^/.]+$/, '');
            // imageUrlがファイル名のみの場合はraw URLに変換
            let markdownImageUrl = imageUrl;
            if (!/^https?:\/\//.test(imageUrl) && dirRef.current && slugRef.current && githubInfo) {
                markdownImageUrl = `https://raw.githubusercontent.com/${githubInfo.owner}/${githubInfo.repo}/${githubInfo.branch}/${dirRef.current}/${slugRef.current}/${imageUrl}`;
            }
            const markdown = `![${altText}](${markdownImageUrl})`;
            if (onChange) {
                onChange(`${value}\n${markdown}`);
            }
            window.alert('画像アップロード成功');
        } catch (e) {
            if (e instanceof Error) {
                window.alert(`画像アップロード失敗: ${e.message}`);
            } else {
                window.alert('画像アップロード失敗: 不明なエラー');
            }
        } finally {
            setIsUploading(false);
        }
    };

    // 画像ボタンの上書き
    const toolbarComponent = (command: ICommand, disabled: boolean) => {
        if (command.keyCommand === 'image') {
            return (
                <>
                    <button
                        aria-label="画像アップロード"
                        disabled={disabled || isUploading}
                        onClick={(evn) => {
                            evn.stopPropagation();
                            if (!dirRef.current || !slugRef.current) {
                                window.alert('画像アップロードには投稿先ディレクトリとslugが必要です');
                                return;
                            }
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                                fileInputRef.current.click();
                            }
                        }}
                    >
                        {isUploading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    x="3"
                                    y="5"
                                    width="14"
                                    height="10"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <circle cx="7" cy="9" r="1.2" fill="currentColor" />
                                <path
                                    d="M3 15L8.5 9.5C9.32843 8.67157 10.6716 8.67157 11.5 9.5L17 15"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                                handleImageUpload(file);
                            }
                        }}
                    />
                </>
            );
        }
    };

    return (
        <div className="w-full" data-color-mode="light">
            <MDEditor
                value={value}
                onChange={(val) => onChange?.(val ?? '')}
                height={height}
                components={{ toolbar: toolbarComponent }}
            />
        </div>
    );
};

export default MdEditor;

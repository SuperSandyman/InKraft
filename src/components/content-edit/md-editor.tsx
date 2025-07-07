'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// MDEditorはSSR非対応のため動的インポート
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });

interface MdEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    height?: number;
    directory?: string;
    slug?: string;
}

const MdEditor = ({ value = '**Hello world!!!**', onChange, height = 400, directory, slug }: MdEditorProps) => {
    const [internalContent, setInternalContent] = useState<string>(value);

    const currentValue = onChange ? value : internalContent;
    const handleChange = onChange || setInternalContent;

    // directory/slugの最新値をrefで保持
    const dirRef = useRef(directory);
    const slugRef = useRef(slug);
    useEffect(() => {
        dirRef.current = directory;
        slugRef.current = slug;
    }, [directory, slug]);

    // 画像ボタンの上書き
    const toolbarComponent = (command: any, disabled: boolean, executeCommand: any) => {
        if (command.keyCommand === 'image') {
            return (
                <button
                    aria-label="画像アップロード"
                    disabled={disabled}
                    onClick={(evn) => {
                        evn.stopPropagation();
                        if (dirRef.current == null || dirRef.current === '' || slugRef.current == null || slugRef.current === '') {
                            window.alert('画像アップロードには投稿先ディレクトリとslugが必要です');
                            return;
                        }
                        window.alert(`directory: ${dirRef.current}\nslug: ${slugRef.current}`);
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="7" cy="9" r="1.2" fill="currentColor" />
                        <path
                            d="M3 15L8.5 9.5C9.32843 8.67157 10.6716 8.67157 11.5 9.5L17 15"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    </svg>
                </button>
            );
        }
    };

    return (
        <div className="w-full" data-color-mode="light">
            <MDEditor
                value={currentValue}
                onChange={(val) => handleChange(val ?? '')}
                height={height}
                components={{ toolbar: toolbarComponent }}
            />
        </div>
    );
};

export default MdEditor;

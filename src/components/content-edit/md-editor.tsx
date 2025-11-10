'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';

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
    const editorRef = useRef<EditorView | null>(null);

    const dirRef = useRef(directory);
    const slugRef = useRef(slug);
    useEffect(() => {
        dirRef.current = directory;
        slugRef.current = slug;
    }, [directory, slug]);

    // 画像アップロード処理
    const handleImageUpload = useCallback(
        async (file: File) => {
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

                // エディタに挿入
                if (editorRef.current) {
                    const view = editorRef.current;
                    const cursor = view.state.selection.main.head;
                    view.dispatch({
                        changes: { from: cursor, insert: `\n${markdown}\n` }
                    });
                } else if (onChange) {
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
        },
        [value, onChange, githubInfo]
    );

    // ドラッグ＆ドロップハンドラー
    const handleDrop = useCallback(
        (event: Event) => {
            const dragEvent = event as DragEvent;
            dragEvent.preventDefault();
            const files = dragEvent.dataTransfer?.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    handleImageUpload(file);
                }
            }
        },
        [handleImageUpload]
    );

    const handleDragOver = useCallback((event: Event) => {
        const dragEvent = event as DragEvent;
        dragEvent.preventDefault();
    }, []);

    // ドラッグ＆ドロップのイベントリスナー設定
    useEffect(() => {
        const editor = editorRef.current?.dom;
        if (editor) {
            editor.addEventListener('drop', handleDrop);
            editor.addEventListener('dragover', handleDragOver);
            return () => {
                editor.removeEventListener('drop', handleDrop);
                editor.removeEventListener('dragover', handleDragOver);
            };
        }
    }, [handleDrop, handleDragOver]);

    // CodeMirror 拡張設定
    const extensions = [
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        EditorView.lineWrapping // 行の折り返し
    ];

    return (
        <div className="w-full relative">
            {/* 画像アップロードツールバー */}
            <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
                <button
                    type="button"
                    onClick={() => {
                        if (!dirRef.current || !slugRef.current) {
                            window.alert('画像アップロードには投稿先ディレクトリとslugが必要です');
                            return;
                        }
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                            fileInputRef.current.click();
                        }
                    }}
                    disabled={isUploading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    aria-label="画像アップロード"
                >
                    {isUploading ? (
                        <span className="animate-spin">⏳</span>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="7" cy="9" r="1.2" fill="currentColor" />
                            <path
                                d="M3 15L8.5 9.5C9.32843 8.67157 10.6716 8.67157 11.5 9.5L17 15"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    )}
                    <span className="ml-2">画像</span>
                </button>
                <span className="text-xs text-muted-foreground">
                    画像をドラッグ＆ドロップまたはクリックしてアップロード
                </span>
            </div>

            {/* CodeMirror エディタ */}
            <CodeMirror
                value={value}
                height={`${height}px`}
                extensions={extensions}
                onChange={(val) => onChange?.(val)}
                onCreateEditor={(view) => {
                    editorRef.current = view;
                }}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true
                }}
            />

            {/* 隠しファイル入力 */}
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
        </div>
    );
};

export default MdEditor;

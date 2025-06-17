'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// MDEditorはSSR非対応のため動的インポート
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });

interface MdEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    height?: number;
}

const MdEditor = ({ value = '**Hello world!!!**', onChange, height = 400 }: MdEditorProps) => {
    const [internalContent, setInternalContent] = useState<string>(value);

    const currentValue = onChange ? value : internalContent;
    const handleChange = onChange || setInternalContent;

    return (
        <div className="w-full" data-color-mode="light">
            <MDEditor value={currentValue} onChange={(val) => handleChange(val ?? '')} height={height} />
        </div>
    );
};

export default MdEditor;

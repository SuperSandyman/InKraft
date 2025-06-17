import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TagsFieldProps {
    id: string;
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    description?: string;
}

const TagsField = ({
    id,
    label,
    value,
    onChange,
    placeholder,
    required = false,
    error,
    description
}: TagsFieldProps) => {
    const [inputValue, setInputValue] = useState<string>('');

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const tag = inputValue.trim();
        if (tag && !value.includes(tag)) {
            onChange([...value, tag]);
        }
        setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium">
                {label} {required && '*'}
            </label>
            <div className="flex gap-2">
                <Input
                    id={id}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={placeholder || 'タグを入力してEnterまたはカンマで追加'}
                    className={error ? 'border-red-500' : ''}
                />
                <Button type="button" variant="outline" onClick={addTag} disabled={!inputValue.trim()}>
                    追加
                </Button>
            </div>
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 hover:bg-transparent"
                                onClick={() => removeTag(tag)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                </div>
            )}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default TagsField;

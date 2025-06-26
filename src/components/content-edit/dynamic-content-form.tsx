import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StringField from './fields/string-field';
import TagsField from './fields/tags-field';
import DateField from './fields/date-field';
import BooleanField from './fields/boolean-field';

import type { FrontmatterSchema, FrontmatterData, FrontmatterField } from '@/types/frontmatter';
import { defaultFrontmatterSchema } from '@/types/frontmatter';

interface DynamicContentFormProps {
    schema?: FrontmatterSchema;
    onSubmit: (data: FrontmatterData) => void;
    isSubmitting?: boolean;
    initialValues?: FrontmatterData;
}

const DynamicContentForm = ({
    schema = defaultFrontmatterSchema,
    onSubmit,
    isSubmitting = false,
    initialValues
}: DynamicContentFormProps) => {
    const [formData, setFormData] = useState<FrontmatterData>(() => {
        const initialData: FrontmatterData = {};
        schema.fields.forEach((field) => {
            if (initialValues && initialValues[field.name] !== undefined) {
                initialData[field.name] = initialValues[field.name];
            } else if (field.multiple) {
                initialData[field.name] = [];
            } else if (field.type === 'boolean') {
                initialData[field.name] = false;
            } else {
                initialData[field.name] = '';
            }
        });
        return initialData;
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // フォームデータの初期化
    useEffect(() => {
        const initialData: FrontmatterData = {};
        schema.fields.forEach((field) => {
            if (initialValues && initialValues[field.name] !== undefined) {
                initialData[field.name] = initialValues[field.name];
            } else if (field.multiple) {
                initialData[field.name] = [];
            } else if (field.type === 'boolean') {
                initialData[field.name] = false;
            } else {
                initialData[field.name] = '';
            }
        });
        setFormData(initialData);
    }, [schema, initialValues]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        schema.fields.forEach((field) => {
            const value = formData[field.name];
            if (field.required) {
                if (field.type === 'string' && field.multiple) {
                    if (!Array.isArray(value) || value.length === 0) {
                        newErrors[field.name] = `${field.label}は必須です`;
                    }
                } else if (field.type === 'string' && !field.multiple) {
                    if (typeof value !== 'string' || value === '') {
                        newErrors[field.name] = `${field.label}は必須です`;
                    }
                } else if (field.type === 'date') {
                    if (typeof value !== 'string' || value === '') {
                        newErrors[field.name] = `${field.label}は必須です`;
                    }
                } else if (field.type === 'boolean') {
                    // boolean型はrequiredでもfalseを許容する（未入力概念がないため）
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleFieldChange = (fieldName: string, value: string | string[] | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value
        }));

        // エラーをクリア
        if (errors[fieldName]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const renderField = (field: FrontmatterField, index: number) => {
        const commonProps = {
            id: field.name,
            label: field.label,
            required: field.required,
            error: errors[field.name],
            description: field.description
        };

        if (field.type === 'string' && field.multiple) {
            return (
                <TagsField
                    key={`${field.name}-${index}`}
                    {...commonProps}
                    value={Array.isArray(formData[field.name]) ? (formData[field.name] as string[]) : []}
                    onChange={(value) => handleFieldChange(field.name, value)}
                />
            );
        }

        if (field.type === 'string' && !field.multiple) {
            return (
                <StringField
                    key={`${field.name}-${index}`}
                    {...commonProps}
                    value={typeof formData[field.name] === 'string' ? (formData[field.name] as string) : ''}
                    onChange={(value) => handleFieldChange(field.name, value)}
                    placeholder={`${field.label}を入力してください`}
                />
            );
        }

        if (field.type === 'date') {
            return (
                <DateField
                    key={`${field.name}-${index}`}
                    {...commonProps}
                    value={typeof formData[field.name] === 'string' ? (formData[field.name] as string) : ''}
                    onChange={(value) => handleFieldChange(field.name, value)}
                    format={field.format}
                />
            );
        }

        if (field.type === 'boolean') {
            return (
                <BooleanField
                    key={`${field.name}-${index}`}
                    {...commonProps}
                    value={typeof formData[field.name] === 'boolean' ? (formData[field.name] as boolean) : false}
                    onChange={(value) => handleFieldChange(field.name, value)}
                />
            );
        }

        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>記事メタデータ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {schema.fields.map(renderField)}

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '保存中...' : '保存'}
                        </Button>
                        <Button type="button" variant="outline">
                            プレビュー
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default DynamicContentForm;

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodString, ZodArray } from 'zod';

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
    onSubmit: (data: FrontmatterData & { directory: string }) => void;
    isSubmitting?: boolean;
    initialValues?: FrontmatterData;
    directories?: string[];
}

// zodスキーマをFrontmatterSchemaから動的生成
const buildZodSchema = (schema: FrontmatterSchema) => {
    const shape: Record<string, z.ZodTypeAny> = {};
    schema.fields.forEach((field) => {
        if (field.type === 'string' && field.multiple) {
            let zodType = z.array(z.string()) as ZodArray<ZodString>;
            if (field.required) {
                zodType = zodType.min(1, `${field.label}は必須です`);
            }
            shape[field.name] = zodType;
        } else if (field.type === 'string') {
            let zodType = z.string();
            if (field.required) {
                zodType = zodType.min(1, `${field.label}は必須です`);
            }
            shape[field.name] = zodType;
        } else if (field.type === 'date') {
            let zodType = z.string();
            if (field.required) {
                zodType = zodType.min(1, `${field.label}は必須です`);
            }
            shape[field.name] = zodType;
        } else if (field.type === 'boolean') {
            shape[field.name] = z.boolean();
        } else {
            shape[field.name] = z.any();
        }
    });
    return z.object(shape);
};

const DynamicContentForm = ({
    schema = defaultFrontmatterSchema,
    onSubmit,
    isSubmitting = false,
    initialValues,
    directories = []
}: DynamicContentFormProps) => {
    const zodSchema = useMemo(() => buildZodSchema(schema), [schema]);

    // 初期値生成
    const defaultValues = useMemo(() => {
        const values: FrontmatterData = {};
        schema.fields.forEach((field) => {
            if (initialValues && initialValues[field.name] !== undefined) {
                values[field.name] = initialValues[field.name];
            } else if (field.multiple) {
                values[field.name] = [];
            } else if (field.type === 'boolean') {
                values[field.name] = false;
            } else {
                values[field.name] = '';
            }
        });
        return values;
    }, [schema, initialValues]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue
    } = useForm<FrontmatterData>({
        resolver: zodResolver(zodSchema),
        defaultValues
    });

    // ディレクトリ選択
    const watchedDirectory = watch('directory');
    const selectedDirectory: string = typeof watchedDirectory === 'string'
        ? watchedDirectory
        : directories[0] || '';

    // submit
    const onFormSubmit = (data: FrontmatterData) => {
        onSubmit({ ...data, directory: selectedDirectory });
    };

    // フィールド描画
    const renderField = (field: FrontmatterField, index: number) => {
        const commonProps = {
            id: field.name,
            label: field.label,
            required: field.required,
            error: errors[field.name]?.message as string,
            description: field.description
        };
        if (field.type === 'string' && field.multiple) {
            return (
                <Controller
                    key={`${field.name}-${index}`}
                    name={field.name}
                    control={control}
                    render={({ field: rhfField }) => (
                        <TagsField
                            {...commonProps}
                            value={Array.isArray(rhfField.value) ? rhfField.value : []}
                            onChange={rhfField.onChange}
                        />
                    )}
                />
            );
        }
        if (field.type === 'string' && !field.multiple) {
            return (
                <Controller
                    key={`${field.name}-${index}`}
                    name={field.name}
                    control={control}
                    render={({ field: rhfField }) => (
                        <StringField
                            {...commonProps}
                            value={typeof rhfField.value === 'string' ? rhfField.value : ''}
                            onChange={rhfField.onChange}
                            placeholder={`${field.label}を入力してください`}
                        />
                    )}
                />
            );
        }
        if (field.type === 'date') {
            return (
                <Controller
                    key={`${field.name}-${index}`}
                    name={field.name}
                    control={control}
                    render={({ field: rhfField }) => (
                        <DateField
                            {...commonProps}
                            value={typeof rhfField.value === 'string' ? rhfField.value : ''}
                            onChange={rhfField.onChange}
                            format={field.format}
                        />
                    )}
                />
            );
        }
        if (field.type === 'boolean') {
            return (
                <Controller
                    key={`${field.name}-${index}`}
                    name={field.name}
                    control={control}
                    render={({ field: rhfField }) => (
                        <BooleanField
                            {...commonProps}
                            value={typeof rhfField.value === 'boolean' ? rhfField.value : false}
                            onChange={rhfField.onChange}
                        />
                    )}
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
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    {directories.length > 1 && (
                        <div>
                            <label htmlFor="directory" className="block text-sm font-medium mb-1">
                                投稿先ディレクトリ
                            </label>
                            <select
                                id="directory"
                                value={selectedDirectory}
                                onChange={(e) => setValue('directory', e.target.value)}
                                className="w-full border rounded px-2 py-1"
                            >
                                {directories.map((dir) => (
                                    <option key={dir} value={dir}>
                                        {dir}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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

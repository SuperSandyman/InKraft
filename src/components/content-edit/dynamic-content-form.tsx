import { useMemo, useEffect } from 'react';
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
    onChange?: (data: FrontmatterData & { directory?: string }) => void;
    setSlugValueRef?: (fn: (slug: string) => void) => void;
    onTitleChange?: (title: string) => void;
}

// zodスキーマをFrontmatterSchemaから動的生成
const buildZodSchema = (schema: FrontmatterSchema) => {
    const shape: Record<string, z.ZodTypeAny> = {};
    // slugフィールドを必須stringとして追加
    shape['slug'] = z.string().min(1, 'スラッグは必須です');
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
    directories = [],
    onChange,
    setSlugValueRef,
    onTitleChange
}: DynamicContentFormProps & { setSlugValueRef?: (fn: (slug: string) => void) => void }) => {
    const zodSchema = useMemo(() => buildZodSchema(schema), [schema]);

    // 初期値生成
    const defaultValues = useMemo(() => {
        const values: FrontmatterData = {};
        // slugフィールドを必ず初期化
        values['slug'] = initialValues && initialValues['slug'] !== undefined ? initialValues['slug'] : '';
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

    // setValueを親から使えるようにrefで渡す
    useEffect(() => {
        if (setSlugValueRef) {
            setSlugValueRef((slug: string) => setValue('slug', slug));
        }
    }, [setSlugValueRef, setValue]);

    // ディレクトリ選択
    const watchedDirectory = watch('directory');
    const selectedDirectory: string = typeof watchedDirectory === 'string' ? watchedDirectory : directories[0] || '';

    // 値の変化をonChangeで通知
    const watchedFields = watch();
    useEffect(() => {
        if (onChange) {
            onChange({ ...watchedFields, directory: selectedDirectory });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(watchedFields), selectedDirectory]);

    // submit
    const onFormSubmit = (data: FrontmatterData) => {
        onSubmit({ ...data, directory: selectedDirectory });
    };

    // slugフィールドを必ず先頭に追加
    const renderSlugField = () => (
        <Controller
            name="slug"
            control={control}
            rules={{ required: 'スラッグは必須です' }}
            render={({ field: rhfField }) => (
                <StringField
                    id="slug"
                    label="スラッグ"
                    required={true}
                    error={errors.slug?.message as string}
                    description="URL等に使われる英数字の識別子。必須。"
                    value={typeof rhfField.value === 'string' ? rhfField.value : ''}
                    onChange={rhfField.onChange}
                    placeholder="slug（例: my-article）を入力してください"
                />
            )}
        />
    );

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
            // タイトルフィールドの場合はonTitleChangeを呼ぶ
            if (field.name === 'title' && onTitleChange) {
                return (
                    <Controller
                        key={`${field.name}-${index}`}
                        name={field.name}
                        control={control}
                        render={({ field: rhfField }) => (
                            <StringField
                                {...commonProps}
                                value={typeof rhfField.value === 'string' ? rhfField.value : ''}
                                onChange={(val) => {
                                    rhfField.onChange(val);
                                    onTitleChange(val);
                                }}
                                placeholder={`${field.label}を入力してください`}
                            />
                        )}
                    />
                );
            }
            // 通常のstringフィールド
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

    // setValueを外部から使えるように返す
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
                    {renderSlugField()}
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
export type { FrontmatterData };

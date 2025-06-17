export interface FrontmatterField {
    name: string;
    label: string;
    type: 'string' | 'date' | 'boolean';
    multiple: boolean;
    required: boolean;
    format?: string;
    description?: string;
}

export interface FrontmatterSchema {
    fields: FrontmatterField[];
}

// デフォルトのフロントマタースキーマ
export const defaultFrontmatterSchema: FrontmatterSchema = {
    fields: [
        {
            name: 'title',
            label: 'タイトル',
            type: 'string',
            multiple: false,
            required: true,
            description: '記事のタイトルです。1行の文字列として記述します。'
        },
        {
            name: 'tags',
            label: 'タグ',
            type: 'string',
            multiple: true,
            required: false,
            description: 'タグは文字列の配列です。省略可能。'
        },
        {
            name: 'date',
            label: '投稿日',
            type: 'date',
            format: 'yyyy/MM/dd',
            multiple: false,
            required: true,
            description: '記事の公開日を指定します。'
        },
        {
            name: 'draft',
            label: '下書き',
            type: 'boolean',
            multiple: false,
            required: false,
            description: 'true にすると未公開扱いになります。'
        }
    ]
};

// フロントマターデータの型（動的）
export type FrontmatterData = Record<string, string | string[] | boolean>;

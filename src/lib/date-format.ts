import { promises as fs } from 'fs';
import path from 'path';

import type { FrontmatterSchema } from '@/types/frontmatter';

let cachedSchema: FrontmatterSchema | null = null;

/**
 * frontmatter.scheme.jsonを読み込んでスキーマを取得（キャッシュ付き）
 */
const loadSchema = async (): Promise<FrontmatterSchema> => {
    if (cachedSchema) {
        return cachedSchema;
    }
    const schemaPath = path.join(process.cwd(), 'frontmatter.scheme.json');
    try {
        const json = await fs.readFile(schemaPath, 'utf-8');
        const cleaned = json.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '');
        const fields = JSON.parse(cleaned);
        cachedSchema = { fields };
        return cachedSchema;
    } catch {
        cachedSchema = { fields: [] };
        return cachedSchema;
    }
};

/**
 * 日付文字列からyyyy, MM, ddを抽出
 */
const parseDateParts = (value: string): { year: string; month: string; day: string } | null => {
    const trimmed = value.trim();

    // yyyy-MM-dd or yyyy/MM/dd or yyyy:MM:dd
    let match = trimmed.match(/^(\d{4})[-/:.](\d{2})[-/:.](\d{2})$/);
    if (match) {
        return { year: match[1], month: match[2], day: match[3] };
    }

    // yyyyMMdd
    match = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) {
        return { year: match[1], month: match[2], day: match[3] };
    }

    // MM-dd-yyyy or MM/dd/yyyy or MM:dd:yyyy
    match = trimmed.match(/^(\d{2})[-/:.](\d{2})[-/:.](\d{4})$/);
    if (match) {
        return { year: match[3], month: match[1], day: match[2] };
    }

    // dd-MM-yyyy or dd/MM/yyyy or dd:MM:yyyy
    match = trimmed.match(/^(\d{2})[-/:.](\d{2})[-/:.](\d{4})$/);
    if (match) {
        // MM/dd/yyyy と dd/MM/yyyy は区別できないため、月の値で判定
        const first = parseInt(match[1], 10);
        const second = parseInt(match[2], 10);
        if (first > 12 && second <= 12) {
            // first が月ではない → dd/MM/yyyy
            return { year: match[3], month: match[2], day: match[1] };
        }
        // デフォルトは MM/dd/yyyy として扱う（上のパターンで既にカバー）
        return { year: match[3], month: match[1], day: match[2] };
    }

    return null;
};

/**
 * フォーマット文字列に従って日付パーツを配置
 */
const formatDateParts = (parts: { year: string; month: string; day: string }, format: string): string => {
    let result = format;

    // 大文字小文字を区別せずに置換
    result = result.replace(/yyyy/i, parts.year);
    result = result.replace(/MM/g, parts.month);
    result = result.replace(/mm/g, parts.month);
    result = result.replace(/dd/i, parts.day);

    return result;
};

/**
 * 任意の日付フォーマット間の相互変換
 */
const convertDateFormat = (value: string, targetFormat: string): string => {
    if (!value || typeof value !== 'string') {
        return value;
    }

    const parts = parseDateParts(value);
    if (!parts) {
        return value;
    }

    return formatDateParts(parts, targetFormat);
};

/**
 * 保存前: yyyy-mm-dd → スキーマ指定フォーマットに変換
 */
export const convertDatesToSchemaFormat = async (
    frontmatter: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const schema = await loadSchema();
    const result = { ...frontmatter };

    schema.fields.forEach((field) => {
        if (field.type !== 'date' || !(field.name in result)) {
            return;
        }
        const value = result[field.name];
        if (typeof value === 'string') {
            result[field.name] = convertDateFormat(value, field.format || 'yyyy-MM-dd');
        }
    });

    return result;
};

/**
 * 読み込み時: スキーマ指定フォーマット → yyyy-mm-dd に変換
 */
export const convertDatesFromSchemaFormat = async (
    frontmatter: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const schema = await loadSchema();
    const result = { ...frontmatter };

    schema.fields.forEach((field) => {
        if (field.type !== 'date' || !(field.name in result)) {
            return;
        }
        const value = result[field.name];
        if (typeof value === 'string') {
            result[field.name] = convertDateFormat(value, 'yyyy-MM-dd');
        }
    });

    return result;
};

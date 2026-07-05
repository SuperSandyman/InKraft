import { describe, expect, it } from 'vitest';

import {
    assertSafeRepositoryPath,
    assertSafeRepositoryPathSegment,
    assertValidSlug,
    resolveArticleFile,
    resolveContentType,
    sanitizeSlug
} from '@/lib/content-path';

describe('content path helpers', () => {
    it('sanitizes slug input consistently', () => {
        expect(sanitizeSlug(' My Article!! ')).toBe('my-article');
    });

    it('rejects unsafe slugs', () => {
        expect(() => assertValidSlug('../secret')).toThrow('slug形式が不正です');
        expect(() => assertValidSlug('valid-slug_1')).not.toThrow();
    });

    it('rejects unsafe repository paths', () => {
        expect(() => assertSafeRepositoryPath('../posts', 'directory')).toThrow('directoryの形式が不正です');
        expect(() => assertSafeRepositoryPath('/posts', 'directory')).toThrow('directoryの形式が不正です');
        expect(() => assertSafeRepositoryPath('posts/index.md', 'articleFile')).not.toThrow();
    });

    it('rejects path separators for single path segments', () => {
        expect(() => assertSafeRepositoryPathSegment('posts/foo', 'slug')).toThrow('slugの形式が不正です');
        expect(() => assertSafeRepositoryPathSegment('Legacy_Slug', 'slug')).not.toThrow();
    });

    it('resolves configured content directories only', () => {
        const contentTypes = [{ directory: 'posts', articleFile: 'index.md' }];

        expect(resolveContentType(contentTypes, 'posts')).toEqual(contentTypes[0]);
        expect(() => resolveContentType(contentTypes, 'draft')).toThrow('directoryが許可されていません');
    });

    it('rejects article files that do not match the content type', () => {
        const contentType = { directory: 'posts', articleFile: 'index.md' };

        expect(resolveArticleFile(contentType)).toBe('index.md');
        expect(() => resolveArticleFile(contentType, '../secret.md')).toThrow('articleFileが許可されていません');
        expect(() => resolveArticleFile(contentType, 'other.md')).toThrow('articleFileが許可されていません');
    });
});

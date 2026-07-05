import type { ContentTypeConfigItem } from './content';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;

export const sanitizeSlug = (slug: string): string =>
    slug
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

export const isValidSlug = (slug: string): boolean => SLUG_PATTERN.test(slug);

export const assertValidSlug = (slug: string): void => {
    if (!isValidSlug(slug)) {
        throw new Error('slug形式が不正です');
    }
};

export const isSafeRepositoryPath = (value: string): boolean => {
    if (!value || value.startsWith('/') || value.includes('\\')) {
        return false;
    }

    return value.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
};

export const isSafeRepositoryPathSegment = (value: string): boolean =>
    value.length > 0 && !value.includes('/') && isSafeRepositoryPath(value);

export const assertSafeRepositoryPathSegment = (value: string, label: string): void => {
    if (!isSafeRepositoryPathSegment(value)) {
        throw new Error(`${label}の形式が不正です`);
    }
};

export const assertSafeRepositoryPath = (value: string, label: string): void => {
    if (!isSafeRepositoryPath(value)) {
        throw new Error(`${label}の形式が不正です`);
    }
};

export const resolveContentType = (
    contentTypes: ContentTypeConfigItem[],
    directory: string
): ContentTypeConfigItem => {
    assertSafeRepositoryPath(directory, 'directory');

    const contentType = contentTypes.find((item) => item.directory === directory);
    if (!contentType) {
        throw new Error('directoryが許可されていません');
    }

    assertSafeRepositoryPath(contentType.directory, 'directory');
    assertSafeRepositoryPath(contentType.articleFile, 'articleFile');

    return contentType;
};

export const resolveArticleFile = (contentType: ContentTypeConfigItem, requestedArticleFile?: string): string => {
    if (requestedArticleFile && requestedArticleFile !== contentType.articleFile) {
        throw new Error('articleFileが許可されていません');
    }

    assertSafeRepositoryPath(contentType.articleFile, 'articleFile');
    return contentType.articleFile;
};

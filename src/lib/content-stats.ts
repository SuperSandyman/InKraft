import { getCmsConfig } from './content';
import { getOctokitWithAuth } from './github-api';

export interface ContentTypeCount {
    label: string;
    count: number;
    color: string;
}

export const fetchContentTypeCounts = async (): Promise<ContentTypeCount[]> => {
    const config = await getCmsConfig();
    const [owner, repo] = config.targetRepository.split('/');
    const branch = config.branch || 'main';
    const octokit = await getOctokitWithAuth();
    const result: ContentTypeCount[] = [];

    for (let i = 0; i < config.content.length; i++) {
        const contentType = config.content[i];
        let count = 0;
        if (contentType.metaCache?.path) {
            try {
                const { data: file } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: contentType.metaCache.path,
                    ref: branch
                });
                if ('content' in file && file.content) {
                    const cacheContent = Buffer.from(file.content, 'base64').toString('utf-8');
                    const arr = JSON.parse(cacheContent);
                    if (Array.isArray(arr)) {
                        count = arr.length;
                    }
                }
            } catch {
                count = 0;
            }
        }
        result.push({
            label: contentType.directory,
            count,
            color: `var(--chart-${i + 1})`
        });
    }
    return result;
};

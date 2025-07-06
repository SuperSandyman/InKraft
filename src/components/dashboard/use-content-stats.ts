import fs from 'fs';
import path from 'path';

interface ContentStats {
    label: string;
    count: number;
    color: string;
}

interface ContentConfigItem {
    directory: string;
    articleFile: string;
    imageDirInsideContent: boolean;
    metaCache: {
        type: string;
        path: string;
    };
}

export const getContentStats = (): ContentStats[] => {
    const configPath = path.join(process.cwd(), 'cms.config.json');
    let stats: ContentStats[] = [];
    try {
        const configJson = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configJson);
        if (Array.isArray(config.content)) {
            stats = config.content.map((item: ContentConfigItem, idx: number) => {
                let count = 0;
                try {
                    const metaPath = path.join(process.cwd(), item.metaCache.path);
                    if (fs.existsSync(metaPath)) {
                        const metaJson = fs.readFileSync(metaPath, 'utf-8');
                        const arr = JSON.parse(metaJson);
                        if (Array.isArray(arr)) {
                            count = arr.length;
                        }
                    }
                } catch {
                    count = 0;
                }
                return {
                    label: item.directory,
                    count,
                    color: `var(--chart-${idx + 1})`
                };
            });
        }
    } catch {
        // ignore
    }
    return stats;
};

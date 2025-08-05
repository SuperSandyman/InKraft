'use client';

import * as React from 'react';

import HeatMap from '@uiw/react-heat-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Content } from '@/lib/content';

export interface HeatmapValue {
    date: string;
    count: number;
}

interface GitHubHeatmapProps {
    articles: Content[];
}

const getDateCountMap = (articles: Content[]): HeatmapValue[] => {
    const dateCount: Record<string, number> = {};
    articles.forEach((a) => {
        const date = typeof a.date === 'string' ? a.date.replace(/-/g, '/') : '';
        if (date) {
            dateCount[date] = (dateCount[date] || 0) + 1;
        }
    });
    return Object.entries(dateCount).map(([date, count]) => ({ date, count }));
};

const GitHubHeatmap: React.FC<GitHubHeatmapProps> = ({ articles }) => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setFullYear(endDate.getFullYear() - 1);
    const values = getDateCountMap(articles);

    return (
        <Card className="sm:h-full h-auto flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">アクティビティ</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between p-4 min-h-0">
                <div className="overflow-x-auto">
                    <HeatMap
                        value={values}
                        startDate={startDate}
                        endDate={endDate}
                        width="100%"
                        panelColors={{
                            0: '#ebedf0',
                            1: '#9be9a8',
                            2: '#40c463',
                            3: '#30a14e',
                            4: '#216e39'
                        }}
                        rectSize={14}
                        rectRender={(props, data) => (
                            <rect {...props}>
                                <title>{`${data.date}: ${data.count} contributions`}</title>
                            </rect>
                        )}
                        className="w-full"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default GitHubHeatmap;

'use client';

import HeatMap from '@uiw/react-heat-map';
import { subYears } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type HeatmapValue = { date: string; count: number };

export default function GitHubHeatmap() {
    const endDate = new Date();
    const startDate = subYears(endDate, 1);
    // 仮データ: 直近5日分のみ例示（実際は1年分を生成する想定）
    const dummyValues: HeatmapValue[] = [
        { date: '2025/05/30', count: 2 },
        { date: '2025/05/31', count: 4 },
        { date: '2025/06/01', count: 1 },
        { date: '2025/06/02', count: 0 },
        { date: '2025/06/03', count: 3 }
    ];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">アクティビティ</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between p-4">
                <div className="overflow-x-auto">
                    <HeatMap
                        value={dummyValues}
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
}

'use client';

import * as React from 'react';
import { Label, Pie, PieChart, Cell } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
    { browser: 'chrome', visitors: 275, fill: 'var(--chart-1)' },
    { browser: 'safari', visitors: 200, fill: 'var(--chart-2)' },
    { browser: 'firefox', visitors: 287, fill: 'var(--chart-3)' },
    { browser: 'edge', visitors: 173, fill: 'var(--chart-4)' },
    { browser: 'other', visitors: 190, fill: 'var(--chart-5)' }
];

const chartConfig = {
    visitors: {
        label: 'Visitors'
    },
    chrome: {
        label: 'Chrome',
        color: 'var(--chart-1)'
    },
    safari: {
        label: 'Safari',
        color: 'var(--chart-2)'
    },
    firefox: {
        label: 'Firefox',
        color: 'var(--chart-3)'
    },
    edge: {
        label: 'Edge',
        color: 'var(--chart-4)'
    },
    other: {
        label: 'Other',
        color: 'var(--chart-5)'
    }
} satisfies ChartConfig;

export function ChartPieDonutText() {
    const totalVisitors = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">コンテンツ分布</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-0 min-w-0">
                {/* チャート中央寄せ＆サイズ拡大 */}
                <div className="flex-none flex items-center justify-center min-w-0 min-h-0">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-square w-full min-w-[240px] max-w-[240px] min-h-[240px] max-h-[240px] flex items-center justify-center"
                    >
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={chartData}
                                dataKey="visitors"
                                nameKey="browser"
                                innerRadius={52}
                                outerRadius={85}
                                cx="50%"
                                cy="42%"
                                strokeWidth={5}
                            >
                                {chartData.map((entry) => (
                                    <Cell key={entry.browser} fill={entry.fill} />
                                ))}
                                <Label
                                    position="center"
                                    content={({ viewBox }) => {
                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                            const cy = typeof viewBox.cy === 'number' ? viewBox.cy : 60;
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={cy - 4}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={cy - 4}
                                                        className="fill-foreground text-xl font-bold"
                                                    >
                                                        {totalVisitors.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={cy + 12}
                                                        className="fill-muted-foreground text-xs"
                                                    >
                                                        Visitors
                                                    </tspan>
                                                </text>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}

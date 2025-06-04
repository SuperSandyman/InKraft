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
            <CardContent className="flex-1 flex flex-col justify-center p-4">
                <div className="w-full flex-1 flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="aspect-square w-full max-w-[180px]">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={chartData}
                                dataKey="visitors"
                                nameKey="browser"
                                innerRadius={60}
                                outerRadius={80}
                                cx="50%"
                                cy="50%"
                                strokeWidth={5}
                            >
                                {chartData.map((entry) => (
                                    <Cell key={entry.browser} fill={entry.fill} />
                                ))}
                                <Label
                                    position="center"
                                    content={({ viewBox }) => {
                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-2xl font-bold"
                                                    >
                                                        {totalVisitors.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 18}
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

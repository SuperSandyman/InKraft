'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Label } from 'recharts';

export interface ArticleStatsDonutProps {
    posts: number;
    scraps: number;
}

export function ArticleStatsDonut({ posts, scraps }: ArticleStatsDonutProps) {
    const data = [
        { key: 'posts', name: '投稿数', value: posts },
        { key: 'scraps', name: 'スクラップ数', value: scraps }
    ];
    const total = posts + scraps;
    const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

    const chartConfig: ChartConfig = {
        posts: { label: '投稿数', color: COLORS[0] },
        scraps: { label: 'スクラップ数', color: COLORS[1] }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">記事統計</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
                <ChartContainer config={chartConfig} className="w-full aspect-square max-h-[240px]">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                        >
                            {data.map((entry, idx) => (
                                <Cell key={entry.key} fill={COLORS[idx]} />
                            ))}
                            <Label
                                position="center"
                                content={({ viewBox }) =>
                                    viewBox && 'cx' in viewBox && 'cy' in viewBox ? (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="text-3xl font-bold fill-foreground"
                                        >
                                            {total}件
                                        </text>
                                    ) : null
                                }
                            />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-around text-sm text-gray-600">
                {data.map((entry, idx) => (
                    <div key={entry.key} className="flex items-center space-x-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span>{entry.name}</span>
                    </div>
                ))}
            </CardFooter>
        </Card>
    );
}

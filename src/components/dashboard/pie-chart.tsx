'use client';

import * as React from 'react';
import { Label, Pie, PieChart, Cell } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ChartPieDonutTextProps {
    data: { label: string; count: number; color: string }[];
    totalCount?: number;
}

export const ChartPieDonutText: React.FC<ChartPieDonutTextProps> = ({ data, totalCount }) => {
    const total = React.useMemo(() => totalCount ?? data.reduce((acc, cur) => acc + cur.count, 0), [data, totalCount]);
    const chartConfig = React.useMemo(() => {
        const conf: ChartConfig = {};
        data.forEach((d) => {
            conf[d.label] = { label: d.label, color: d.color };
        });
        return conf;
    }, [data]);

    return (
        <Card className="min-h-0 w-full min-w-0 py-4 sm:min-h-[210px]">
            <CardHeader className="items-center px-4 pb-0 text-center">
                <CardTitle className="text-base font-bold">総コンテンツ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row items-center justify-center gap-4 px-4 sm:flex-1 sm:flex-col sm:gap-2">
                <div className="flex flex-none items-center justify-center">
                    <ChartContainer
                        config={chartConfig}
                        className="flex aspect-square min-h-[104px] max-h-[112px] min-w-[104px] max-w-[112px] items-center justify-center sm:min-h-[132px] sm:max-h-[132px] sm:min-w-[132px] sm:max-w-[132px]"
                    >
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="label"
                                innerRadius={38}
                                outerRadius={58}
                                cx="50%"
                                cy="50%"
                                strokeWidth={5}
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.label} fill={entry.color} />
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
                                                        className="fill-foreground text-2xl font-extrabold"
                                                    >
                                                        {total.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={cy + 14}
                                                        className="fill-muted-foreground text-xs font-bold"
                                                    >
                                                        記事
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
                <div className="text-left text-sm font-bold text-muted-foreground sm:text-center">
                    <span className="block text-xs">現在の総数</span>
                    <span className="text-cyan-600">{data.length.toLocaleString()} 種類</span>
                </div>
            </CardContent>
        </Card>
    );
};

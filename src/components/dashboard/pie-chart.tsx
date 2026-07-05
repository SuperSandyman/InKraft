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
        <Card className="min-h-[180px] w-full min-w-0 sm:min-h-[210px]">
            <CardHeader className="items-center px-4 text-center">
                <CardTitle className="text-base font-bold">総コンテンツ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
                <div className="flex-none flex items-center justify-center">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-square w-full min-w-[132px] max-w-[132px] min-h-[132px] max-h-[132px] flex items-center justify-center"
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
                <div className="text-sm font-bold text-muted-foreground">
                    今月 <span className="text-cyan-600">+4 ↑</span>
                </div>
            </CardContent>
        </Card>
    );
};

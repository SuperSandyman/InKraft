'use client';

import * as React from 'react';
import { Label, Pie, PieChart, Cell } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ChartPieDonutTextProps {
    data: { label: string; count: number; color: string }[];
}

export const ChartPieDonutText: React.FC<ChartPieDonutTextProps> = ({ data }) => {
    const total = React.useMemo(() => data.reduce((acc, cur) => acc + cur.count, 0), [data]);
    const chartConfig = React.useMemo(() => {
        const conf: ChartConfig = {};
        data.forEach((d) => {
            conf[d.label] = { label: d.label, color: d.color };
        });
        return conf;
    }, [data]);

    return (
        <Card className="sm:h-full h-auto flex flex-col w-full min-w-0">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">コンテンツ分布</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <div className="flex-none flex items-center justify-center">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-square w-full min-w-[240px] max-w-[240px] min-h-[240px] max-h-[240px] flex items-center justify-center"
                    >
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="label"
                                innerRadius={52}
                                outerRadius={85}
                                cx="50%"
                                cy="42%"
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
                                                        className="fill-foreground text-xl font-bold"
                                                    >
                                                        {total.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={cy + 12}
                                                        className="fill-muted-foreground text-xs"
                                                    >
                                                        Articles
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
};

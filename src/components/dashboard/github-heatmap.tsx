'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Content } from '@/lib/content';
import { useIsMobile } from '@/hooks/use-mobile';

interface GitHubHeatmapProps {
    articles: Content[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GRID_DAYS_DESKTOP = 365;
const GRID_DAYS_MOBILE = 180; // 180日
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const COLORS = ['#eef2f8', '#dbe6ff', '#9fbbff', '#5f89ea', '#2f62d6'];

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const normalizeDateKey = (rawDate: string) => {
    const normalized = rawDate.trim().replace(/\//g, '-');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return formatDateKey(new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())));
};

const getDateCountMap = (articles: Content[]): Map<string, number> => {
    const dateCount = new Map<string, number>();
    articles.forEach((a) => {
        if (typeof a.date !== 'string') return;
        const key = normalizeDateKey(a.date);
        if (!key) return;
        dateCount.set(key, (dateCount.get(key) ?? 0) + 1);
    });
    return dateCount;
};

const buildDays = (endDate: Date, gridDays: number) => {
    const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    const startUTC = new Date(endUTC.getTime() - (gridDays - 1) * MS_PER_DAY);
    const days: Date[] = [];
    for (let i = 0; i < gridDays; i += 1) {
        days.push(new Date(startUTC.getTime() + i * MS_PER_DAY));
    }
    return { startUTC, days };
};

const buildWeeks = (days: Date[]) => {
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = new Array(7).fill(null);
    days.forEach((day, index) => {
        const dayIndex = day.getUTCDay();
        if (index === 0 && dayIndex !== 0) {
            week = new Array(7).fill(null);
        }
        week[dayIndex] = day;
        if (dayIndex === 6) {
            weeks.push(week);
            week = new Array(7).fill(null);
        }
    });
    if (week.some((d) => d !== null)) {
        weeks.push(week);
    }
    return weeks;
};

const getLevel = (count: number, maxCount: number) => {
    if (count <= 0) return 0;
    if (maxCount <= 4) {
        return Math.min(4, count);
    }
    const step = Math.ceil(maxCount / 4);
    return Math.min(4, Math.ceil(count / step));
};

const GitHubHeatmap: React.FC<GitHubHeatmapProps> = ({ articles }) => {
    const isMobile = useIsMobile();
    const gridDays = isMobile ? GRID_DAYS_MOBILE : GRID_DAYS_DESKTOP;
    const cellSize = isMobile ? 9 : 13;
    const cellGap = isMobile ? 3 : 5;

    const endDate = React.useMemo(() => new Date(), []);
    const { startUTC, days } = React.useMemo(() => buildDays(endDate, gridDays), [endDate, gridDays]);
    const dateCount = React.useMemo(() => getDateCountMap(articles), [articles]);
    const maxCount = React.useMemo(() => {
        let max = 0;
        dateCount.forEach((value) => {
            if (value > max) max = value;
        });
        return max;
    }, [dateCount]);
    const weeks = React.useMemo(() => buildWeeks(days), [days]);
    const monthLabels = React.useMemo(() => {
        return weeks.map((week) => {
            const firstDay = week.find((day) => day !== null);
            if (!firstDay) return '';
            const isFirstWeekOfMonth = firstDay.getUTCDate() <= 7;
            return isFirstWeekOfMonth ? MONTH_LABELS[firstDay.getUTCMonth()] : '';
        });
    }, [weeks]);

    return (
        <Card className="h-full min-h-[260px] w-full min-w-0">
            <CardHeader className="flex-row items-center justify-between gap-3 pb-1">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">コンテンツアクティビティ</CardTitle>
                    <span className="flex size-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500">
                        i
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-4 px-4 sm:px-5">
                <div className="min-w-0 overflow-x-auto" aria-label="GitHub style activity heatmap">
                    <div className="w-max">
                        <div className="flex items-start gap-1 sm:gap-3">
                            <div
                                className="flex flex-col text-[10px] font-bold text-muted-foreground flex-shrink-0"
                                style={{ marginTop: cellSize + cellGap + 2, gap: cellGap + cellSize - 10 }}
                            >
                                {DAY_LABELS.map((label, index) => (
                                    <span key={label} className={index % 2 === 0 ? 'opacity-0' : ''}>
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <div className="flex flex-col flex-shrink-0" style={{ gap: cellGap }}>
                                <div
                                    className="flex text-[11px] font-bold text-muted-foreground"
                                    style={{ gap: cellGap }}
                                >
                                    {monthLabels.map((label, index) => (
                                        <span
                                            key={`${label}-${index}`}
                                            className="flex-shrink-0"
                                            style={{ width: cellSize }}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex" style={{ gap: cellGap }} role="grid">
                                    {weeks.map((week, weekIndex) => (
                                        <div
                                            key={`week-${weekIndex}`}
                                            className="flex flex-col flex-shrink-0"
                                            style={{ gap: cellGap }}
                                            role="row"
                                        >
                                            {week.map((day, dayIndex) => {
                                                if (!day) {
                                                    return (
                                                        <span
                                                            key={`empty-${weekIndex}-${dayIndex}`}
                                                        className="rounded-[3px] bg-transparent flex-shrink-0"
                                                            style={{ height: cellSize, width: cellSize }}
                                                        />
                                                    );
                                                }
                                                const key = formatDateKey(day);
                                                const count = dateCount.get(key) ?? 0;
                                                const level = getLevel(count, maxCount);
                                                return (
                                                    <span
                                                        key={key}
                                                        role="gridcell"
                                                        aria-label={`${key}: ${count} contributions`}
                                                        title={`${key}: ${count} contributions`}
                                                        className="rounded-[3px] ring-1 ring-blue-950/5 transition-transform duration-150 hover:scale-110 flex-shrink-0"
                                                        style={{
                                                            height: cellSize,
                                                            width: cellSize,
                                                            backgroundColor: COLORS[level]
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 text-xs font-bold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {formatDateKey(startUTC)} - {formatDateKey(days[days.length - 1])}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <span>少ない</span>
                        <div className="flex gap-0.5 sm:gap-1">
                            {COLORS.map((color, index) => (
                                <span
                                    key={`${color}-${index}`}
                                    className="h-[11px] w-[11px] rounded-[3px] ring-1 ring-blue-950/5 flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <span>多い</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GitHubHeatmap;

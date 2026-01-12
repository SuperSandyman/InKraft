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
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

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
    const cellSize = isMobile ? 10 : 14;
    const cellGap = isMobile ? 3 : 6;

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

    const periodLabel = isMobile ? 'Last 180 days' : 'Last 12 months';

    return (
        <Card className="sm:h-full h-auto flex flex-col w-full min-w-0">
            <CardHeader className="pb-2 sm:pb-2">
                <CardTitle className="text-lg font-semibold">アクティビティ</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 min-w-0 p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-emerald-700 shrink-0">{periodLabel}</span>
                    <span className="text-[10px] sm:text-xs text-right">
                        {formatDateKey(startUTC)} - {formatDateKey(days[days.length - 1])}
                    </span>
                </div>

                <div className="min-w-0 overflow-x-auto" aria-label="GitHub style activity heatmap">
                    <div className="w-max">
                        <div className="flex items-start gap-1 sm:gap-3">
                            <div
                                className="flex flex-col text-[8px] sm:text-[10px] text-muted-foreground flex-shrink-0"
                                style={{ marginTop: cellSize + cellGap, gap: cellGap + cellSize - (isMobile ? 8 : 10) }}
                            >
                                {DAY_LABELS.map((label, index) => (
                                    <span key={label} className={index % 2 === 0 ? 'opacity-0' : ''}>
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <div className="flex flex-col flex-shrink-0" style={{ gap: cellGap }}>
                                <div
                                    className="flex text-[8px] sm:text-[10px] text-muted-foreground"
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
                                                            className="rounded-[2px] sm:rounded-[3px] bg-transparent flex-shrink-0"
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
                                                        className="rounded-[2px] sm:rounded-[3px] ring-1 ring-emerald-950/5 transition-transform duration-150 hover:scale-110 flex-shrink-0"
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

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-emerald-700">{dateCount.size.toLocaleString()} days active</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[10px] sm:text-xs">Less</span>
                        <div className="flex gap-0.5 sm:gap-1">
                            {COLORS.map((color, index) => (
                                <span
                                    key={`${color}-${index}`}
                                    className="h-[10px] w-[10px] sm:h-[12px] sm:w-[12px] rounded-[2px] sm:rounded-[3px] ring-1 ring-emerald-950/5 flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] sm:text-xs">More</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GitHubHeatmap;

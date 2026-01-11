'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Content } from '@/lib/content';

interface GitHubHeatmapProps {
    articles: Content[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GRID_DAYS = 365;
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

const buildDays = (endDate: Date) => {
    const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    const startUTC = new Date(endUTC.getTime() - (GRID_DAYS - 1) * MS_PER_DAY);
    const days: Date[] = [];
    for (let i = 0; i < GRID_DAYS; i += 1) {
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
    const endDate = React.useMemo(() => new Date(), []);
    const { startUTC, days } = React.useMemo(() => buildDays(endDate), [endDate]);
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
        <Card className="sm:h-full h-auto flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">アクティビティ</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between px-4 min-h-0">
                <div className="overflow-x-auto">
                    <div
                        className="min-w-max rounded-xl bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                        aria-label="GitHub style activity heatmap"
                    >
                        <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium text-emerald-700">Last 12 months</span>
                            <span>
                                {formatDateKey(startUTC)} - {formatDateKey(days[days.length - 1])}
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-5 flex flex-col gap-[10px] text-[10px] text-muted-foreground">
                                {DAY_LABELS.map((label, index) => (
                                    <span key={label} className={index % 2 === 0 ? 'opacity-0' : ''}>
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-[6px] text-[10px] text-muted-foreground">
                                    {monthLabels.map((label, index) => (
                                        <span key={`${label}-${index}`} className="w-[14px]">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-[6px]" role="grid">
                                    {weeks.map((week, weekIndex) => (
                                        <div key={`week-${weekIndex}`} className="flex flex-col gap-[6px]" role="row">
                                            {week.map((day, dayIndex) => {
                                                if (!day) {
                                                    return (
                                                        <span
                                                            key={`empty-${weekIndex}-${dayIndex}`}
                                                            className="h-[14px] w-[14px] rounded-[3px] bg-transparent"
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
                                                        className="h-[14px] w-[14px] rounded-[3px] ring-1 ring-emerald-950/5 transition-transform duration-150 hover:scale-110"
                                                        style={{ backgroundColor: COLORS[level] }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-medium text-emerald-700">
                                {dateCount.size.toLocaleString()} days active
                            </span>
                            <div className="flex items-center gap-2">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    {COLORS.map((color, index) => (
                                        <span
                                            key={`${color}-${index}`}
                                            className="h-[12px] w-[12px] rounded-[3px] ring-1 ring-emerald-950/5"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GitHubHeatmap;

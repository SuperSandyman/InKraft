'use client';

import HeatMap from '@uiw/react-heat-map';
import { subYears } from 'date-fns';

export type HeatmapValue = { date: string; count: number };

interface Props {
    values: HeatmapValue[];
}

export default function GitHubHeatmap({ values }: Props) {
    const endDate = new Date();
    const startDate = subYears(endDate, 1);

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-3 sm:p-4 md:p-5 w-full">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 md:mb-4">
                アクティビティ
            </h3>
            <div className="overflow-x-auto">
                <HeatMap
                    value={values}
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
        </div>
    );
}

import React from 'react';
import { BarChartComponent, BarChartMeta } from './BarChartComponent';
import type { ComponentProps } from '@lowcode/types';

export { BarChartMeta };

export const LcBarChart = Object.assign(
  (props: ComponentProps) => {
    let xAxisData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let seriesData = [120, 200, 150, 80, 70, 110, 130];

    try {
      if (props.xAxisData) {
        const parsed = typeof props.xAxisData === 'string'
          ? JSON.parse(props.xAxisData as string)
          : props.xAxisData;
        if (Array.isArray(parsed)) xAxisData = parsed as string[];
      }
      if (props.seriesData) {
        const parsed = typeof props.seriesData === 'string'
          ? JSON.parse(props.seriesData as string)
          : props.seriesData;
        if (Array.isArray(parsed)) seriesData = parsed as number[];
      }
    } catch { /* use defaults */ }

    return (
      <BarChartComponent
        title={props.title as string}
        xAxisData={xAxisData}
        seriesData={seriesData}
        seriesName={props.seriesName as string}
        color={props.color as string}
        horizontal={props.horizontal as boolean}
        showLabel={props.showLabel as boolean}
        height={props.height as number}
        style={props.style as React.CSSProperties}
        className={props.className as string}
      />
    );
  },
  { meta: BarChartMeta }
);

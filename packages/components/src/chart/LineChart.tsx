import React from 'react';
import { LineChartComponent } from './LineChartComponent';
import { LineChartMeta as LcLineChartMeta } from './LineChart.meta';
import { BarChartMeta as LcBarChartMeta } from './BarChart.meta';
import { PieChartMeta as LcPieChartMeta } from './PieChart.meta';
import type { ComponentProps } from '@lowcode/types';

export { LcLineChartMeta as LineChartMeta, LcBarChartMeta as BarChartMeta, LcPieChartMeta as PieChartMeta };

export const LcLineChart = Object.assign(
  (props: ComponentProps) => {
    let xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    let seriesData = [820, 932, 901, 934, 1290, 1330, 1320];

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
      <LineChartComponent
        title={props.title as string}
        xAxisData={xAxisData}
        seriesData={seriesData}
        seriesName={props.seriesName as string}
        color={props.color as string}
        smooth={props.smooth as boolean}
        showArea={props.showArea as boolean}
        style={props.style as React.CSSProperties}
        className={props.className as string}
      />
    );
  },
  { meta: LcLineChartMeta }
);

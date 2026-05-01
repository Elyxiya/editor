import React from 'react';
import { PieChartComponent } from './PieChartComponent';
import { PieChartMeta as LcPieChartMeta } from './PieChart.meta';
import type { ComponentProps } from '@lowcode/types';

export { LcPieChartMeta as PieChartMeta };

interface PieDataItem {
  name: string;
  value: number;
}

export const LcPieChart = Object.assign(
  (props: ComponentProps) => {
    let data: PieDataItem[] = [
      { name: '类目一', value: 1048 },
      { name: '类目二', value: 735 },
      { name: '类目三', value: 580 },
      { name: '类目四', value: 484 },
      { name: '类目五', value: 300 },
    ];

    try {
      if (props.data) {
        const parsed = typeof props.data === 'string'
          ? JSON.parse(props.data as string)
          : props.data;
        if (Array.isArray(parsed)) data = parsed as PieDataItem[];
      }
    } catch { /* use defaults */ }

    return (
      <PieChartComponent
        title={props.title as string}
        data={data}
        showLegend={props.showLegend as boolean}
        roseType={props.roseType as boolean}
        style={props.style as React.CSSProperties}
        className={props.className as string}
      />
    );
  },
  { meta: LcPieChartMeta }
);

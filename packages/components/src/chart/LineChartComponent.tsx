import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

interface LineChartComponentProps {
  title?: string;
  xAxisData?: string[];
  seriesData?: number[];
  seriesName?: string;
  color?: string;
  smooth?: boolean;
  showArea?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  title,
  xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  seriesData = [820, 932, 901, 934, 1290, 1330, 1320],
  seriesName = '数据',
  color = '#1677ff',
  smooth = false,
  showArea = false,
  style,
  className,
}) => {
  const getOption = useCallback(() => ({
    title: {
      text: title || '',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '10%', bottom: '15%', top: title ? '20%' : '10%' },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLabel: { fontSize: 11, color: '#666' },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 11, color: '#666' } },
    series: [{
      name: seriesName,
      type: 'line',
      data: seriesData,
      smooth,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: showArea ? {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${color}40` },
            { offset: 1, color: `${color}05` },
          ],
        },
      } : undefined,
    }],
  }), [title, xAxisData, seriesData, seriesName, color, smooth, showArea]);

  return (
    <ReactECharts
      option={getOption()}
      style={{ width: '100%', height: '100%', minHeight: 280, ...style }}
      className={className}
      opts={{ renderer: 'canvas' }}
    />
  );
};

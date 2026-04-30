import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

interface BarChartComponentProps {
  title?: string;
  xAxisData?: string[];
  seriesData?: number[];
  seriesName?: string;
  color?: string;
  horizontal?: boolean;
  showLabel?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  title,
  xAxisData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  seriesData = [120, 200, 150, 80, 70, 110, 130],
  seriesName = '数据',
  color = '#1677ff',
  horizontal = false,
  showLabel = true,
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
    grid: {
      left: horizontal ? '15%' : '10%',
      right: '10%',
      bottom: '15%',
      top: title ? '20%' : '10%',
    },
    xAxis: horizontal
      ? { type: 'value', axisLabel: { fontSize: 11, color: '#666' } }
      : { type: 'category', data: xAxisData, axisLabel: { fontSize: 11, color: '#666' } },
    yAxis: horizontal
      ? { type: 'category', data: xAxisData, axisLabel: { fontSize: 11, color: '#666' } }
      : { type: 'value', axisLabel: { fontSize: 11, color: '#666' } },
    series: [{
      name: seriesName,
      type: 'bar',
      data: seriesData,
      itemStyle: { color, borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      label: showLabel ? { show: true, position: horizontal ? 'right' : 'top', fontSize: 11 } : undefined,
      barMaxWidth: 40,
    }],
  }), [title, xAxisData, seriesData, seriesName, color, horizontal, showLabel]);

  return (
    <ReactECharts
      option={getOption()}
      style={{ width: '100%', height: '100%', minHeight: 280, ...style }}
      className={className}
      opts={{ renderer: 'canvas' }}
    />
  );
};

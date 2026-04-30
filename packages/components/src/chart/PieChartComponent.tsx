import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

interface PieDataItem {
  name: string;
  value: number;
}

interface PieChartComponentProps {
  title?: string;
  data?: PieDataItem[];
  colors?: string[];
  showLegend?: boolean;
  roseType?: boolean;
  radius?: string;
  style?: React.CSSProperties;
  className?: string;
}

const DEFAULT_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  title,
  data = [
    { name: '类目一', value: 1048 },
    { name: '类目二', value: 735 },
    { name: '类目三', value: 580 },
    { name: '类目四', value: 484 },
    { name: '类目五', value: 300 },
  ],
  colors = DEFAULT_COLORS,
  showLegend = true,
  roseType = false,
  radius = '65%',
  style,
  className,
}) => {
  const getOption = useCallback(() => ({
    title: {
      text: title || '',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      show: showLegend,
      bottom: 0,
      type: 'scroll',
      textStyle: { fontSize: 11, color: '#666' },
    },
    series: [{
      name: '数据',
      type: 'pie',
      radius: roseType ? ['20%', '75%'] : radius,
      center: ['50%', '45%'],
      roseType: roseType ? 'radius' : undefined,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, fontSize: 11, color: '#666', formatter: '{b}: {d}%' },
      emphasis: {
        label: { show: true, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
      },
      data: data.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] },
      })),
    }],
  }), [title, data, colors, showLegend, roseType, radius]);

  return (
    <ReactECharts
      option={getOption()}
      style={{ width: '100%', height: '100%', minHeight: 280, ...style }}
      className={className}
      opts={{ renderer: 'canvas' }}
    />
  );
};

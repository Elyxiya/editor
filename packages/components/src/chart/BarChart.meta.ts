import type { ComponentMeta } from '@lowcode/types';

export const BarChartMeta: ComponentMeta = {
  name: 'BarChart',
  label: '柱状图',
  icon: 'BarChartOutlined',
  category: 'chart',
  defaultProps: {
    title: '柱状图',
    xAxisData: '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
    seriesData: '[120, 200, 150, 80, 70, 110, 130]',
    seriesName: '数据',
    color: '#1677ff',
    horizontal: false,
    showLabel: true,
    height: 300,
  },
  propSchema: [
    { name: 'title', label: '图表标题', type: 'string', defaultValue: '柱状图', group: 'basic' },
    { name: 'seriesName', label: '系列名称', type: 'string', defaultValue: '数据', group: 'basic' },
    { name: 'horizontal', label: '横向柱状图', type: 'boolean', defaultValue: false, group: 'basic' },
    { name: 'showLabel', label: '显示数值', type: 'boolean', defaultValue: true, group: 'basic' },
    { name: 'color', label: '柱子颜色', type: 'color', defaultValue: '#1677ff', group: 'style' },
    { name: 'xAxisData', label: 'X轴数据(JSON)', type: 'string', defaultValue: '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', group: 'data' },
    { name: 'seriesData', label: '系列数据(JSON)', type: 'string', defaultValue: '[120, 200, 150, 80, 70, 110, 130]', group: 'data' },
    { name: 'height', label: '高度(px)', type: 'number', defaultValue: 300, group: 'style', min: 100, max: 800 },
  ],
  eventSchema: [],
  styleSchema: [],
};

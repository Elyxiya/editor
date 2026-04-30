import type { ComponentMeta } from '@lowcode/types';

export const LineChartMeta: ComponentMeta = {
  name: 'LineChart',
  label: '折线图',
  icon: 'LineChartOutlined',
  category: 'chart',
  defaultProps: {
    title: '折线图',
    xAxisData: '["周一","周二","周三","周四","周五","周六","周日"]',
    seriesData: '[820, 932, 901, 934, 1290, 1330, 1320]',
    seriesName: '数据',
    color: '#1677ff',
    smooth: false,
    showArea: false,
    height: 300,
  },
  propSchema: [
    { name: 'title', label: '图表标题', type: 'string', defaultValue: '折线图', group: 'basic' },
    { name: 'seriesName', label: '系列名称', type: 'string', defaultValue: '数据', group: 'basic' },
    { name: 'smooth', label: '平滑曲线', type: 'boolean', defaultValue: false, group: 'basic' },
    { name: 'showArea', label: '显示面积', type: 'boolean', defaultValue: false, group: 'basic' },
    { name: 'color', label: '线条颜色', type: 'color', defaultValue: '#1677ff', group: 'style' },
    { name: 'xAxisData', label: 'X轴数据(JSON)', type: 'string', defaultValue: '["周一","周二","周三","周四","周五","周六","周日"]', group: 'data' },
    { name: 'seriesData', label: '系列数据(JSON)', type: 'string', defaultValue: '[820, 932, 901, 934, 1290, 1330, 1320]', group: 'data' },
    { name: 'height', label: '高度(px)', type: 'number', defaultValue: 300, group: 'style', min: 100, max: 800 },
  ],
  eventSchema: [],
  styleSchema: [],
};

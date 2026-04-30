import type { ComponentMeta } from '@lowcode/types';

export const PieChartMeta: ComponentMeta = {
  name: 'PieChart',
  label: '饼图',
  icon: 'PieChartOutlined',
  category: 'chart',
  defaultProps: {
    title: '饼图',
    data: '[{"name":"类目一","value":1048},{"name":"类目二","value":735},{"name":"类目三","value":580},{"name":"类目四","value":484},{"name":"类目五","value":300}]',
    showLegend: true,
    roseType: false,
    height: 300,
  },
  propSchema: [
    { name: 'title', label: '图表标题', type: 'string', defaultValue: '饼图', group: 'basic' },
    { name: 'showLegend', label: '显示图例', type: 'boolean', defaultValue: true, group: 'basic' },
    { name: 'roseType', label: '玫瑰图模式', type: 'boolean', defaultValue: false, group: 'basic' },
    { name: 'data', label: '饼图数据(JSON)', type: 'string', defaultValue: '[{"name":"类目一","value":1048},{"name":"类目二","value":735},{"name":"类目三","value":580}]', group: 'data' },
    { name: 'height', label: '高度(px)', type: 'number', defaultValue: 300, group: 'style', min: 100, max: 800 },
  ],
  eventSchema: [],
  styleSchema: [],
};

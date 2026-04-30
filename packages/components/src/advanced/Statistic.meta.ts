import type { ComponentMeta } from '@lowcode/types';

export const StatisticMeta: ComponentMeta = {
  name: 'Statistic',
  label: '统计数值',
  icon: 'BarChartOutlined',
  category: 'business',
  defaultProps: {
    title: '统计值',
    value: 0,
    suffix: '',
    precision: 0,
  },
  propSchema: [
    {
      name: 'title',
      label: '标题',
      type: 'string',
      defaultValue: '统计值',
      group: 'basic',
    },
    {
      name: 'value',
      label: '数值',
      type: 'number',
      defaultValue: 0,
      group: 'basic',
    },
    {
      name: 'suffix',
      label: '后缀',
      type: 'string',
      defaultValue: '',
      group: 'basic',
    },
    {
      name: 'precision',
      label: '小数位数',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 6,
      group: 'basic',
    },
    {
      name: 'decimalSeparator',
      label: '小数分隔符',
      type: 'string',
      defaultValue: '.',
      group: 'basic',
    },
  ],
  eventSchema: [],
  styleSchema: [],
};

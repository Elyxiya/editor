import type { ComponentMeta } from '@lowcode/types';

export const BadgeMeta: ComponentMeta = {
  name: 'Badge',
  label: '徽章',
  icon: 'NotificationOutlined',
  category: 'business',
  defaultProps: {
    count: 0,
    showZero: false,
    dot: false,
    overflowCount: 99,
  },
  propSchema: [
    {
      name: 'count',
      label: '数量',
      type: 'number',
      defaultValue: 0,
      group: 'basic',
    },
    {
      name: 'showZero',
      label: '显示零',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'dot',
      label: '圆点样式',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '无', value: undefined },
        { label: '成功', value: 'success' },
        { label: '进行中', value: 'processing' },
        { label: '默认', value: 'default' },
        { label: '错误', value: 'error' },
        { label: '警告', value: 'warning' },
      ],
      defaultValue: undefined,
      group: 'basic',
    },
    {
      name: 'text',
      label: '状态文字',
      type: 'string',
      defaultValue: '',
      group: 'basic',
    },
    {
      name: 'overflowCount',
      label: '溢出计数',
      type: 'number',
      defaultValue: 99,
      group: 'basic',
    },
  ],
  eventSchema: [],
  styleSchema: [],
};

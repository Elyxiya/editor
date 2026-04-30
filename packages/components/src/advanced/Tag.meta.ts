import type { ComponentMeta } from '@lowcode/types';

export const TagMeta: ComponentMeta = {
  name: 'Tag',
  label: '标签',
  icon: 'TagOutlined',
  category: 'business',
  defaultProps: {
    color: 'blue',
    closable: false,
    children: '标签',
  },
  propSchema: [
    {
      name: 'color',
      label: '颜色',
      type: 'select',
      options: [
        { label: '蓝色', value: 'blue' },
        { label: '绿色', value: 'green' },
        { label: '橙色', value: 'orange' },
        { label: '红色', value: 'red' },
        { label: '紫色', value: 'purple' },
        { label: '灰色', value: 'geekblue' },
        { label: '青色', value: 'cyan' },
        { label: '金色', value: 'gold' },
        { label: ' lime', value: 'lime' },
      ],
      defaultValue: 'blue',
      group: 'basic',
    },
    {
      name: 'closable',
      label: '可关闭',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'children',
      label: '标签文字',
      type: 'string',
      defaultValue: '标签',
      group: 'basic',
    },
  ],
  eventSchema: [
    { name: 'onClose', label: '关闭', description: '标签关闭时触发' },
  ],
  styleSchema: [],
};

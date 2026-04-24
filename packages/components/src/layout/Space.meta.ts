import type { ComponentMeta } from '@lowcode/types';

export const SpaceMeta: ComponentMeta = {
  name: 'Space',
  label: '间距',
  icon: 'AlignLeftOutlined',
  category: 'layout',
  defaultProps: {
    direction: 'horizontal',
    size: 'small',
    align: 'start',
    wrap: false,
    block: false,
  },
  propSchema: [
    {
      name: 'direction',
      label: '排列方向',
      type: 'select',
      options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
      ],
      defaultValue: 'horizontal',
      group: 'basic',
    },
    {
      name: 'size',
      label: '间距大小',
      type: 'select',
      options: [
        { label: '小', value: 'small' },
        { label: '中', value: 'middle' },
        { label: '大', value: 'large' },
        { label: '无', value: 0 },
      ],
      defaultValue: 'small',
      group: 'basic',
    },
    {
      name: 'align',
      label: '对齐方式',
      type: 'select',
      options: [
        { label: '开始', value: 'start' },
        { label: '居中', value: 'center' },
        { label: '结束', value: 'end' },
        { label: '基线', value: 'baseline' },
      ],
      defaultValue: 'start',
      group: 'basic',
    },
    {
      name: 'wrap',
      label: '自动换行',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
  ],
  eventSchema: [],
  styleSchema: [],
  isContainer: true,
};

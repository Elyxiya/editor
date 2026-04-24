import type { ComponentMeta } from '@lowcode/types';

export const CardMeta: ComponentMeta = {
  name: 'Card',
  label: '卡片',
  icon: 'CreditCardOutlined',
  category: 'business',
  defaultProps: {
    title: '卡片标题',
    subTitle: undefined,
    description: undefined,
    bordered: true,
    hoverable: false,
    size: 'default',
    cover: undefined,
    actions: [],
  },
  propSchema: [
    {
      name: 'title',
      label: '标题',
      type: 'string',
      defaultValue: '卡片标题',
      group: 'basic',
    },
    {
      name: 'subTitle',
      label: '副标题',
      type: 'string',
      defaultValue: undefined,
      group: 'basic',
    },
    {
      name: 'description',
      label: '描述',
      type: 'string',
      defaultValue: undefined,
      group: 'basic',
    },
    {
      name: 'bordered',
      label: '带边框',
      type: 'boolean',
      defaultValue: true,
      group: 'style',
    },
    {
      name: 'hoverable',
      label: '悬停效果',
      type: 'boolean',
      defaultValue: false,
      group: 'style',
    },
    {
      name: 'size',
      label: '尺寸',
      type: 'select',
      options: [
        { label: '默认', value: 'default' },
        { label: '紧凑', value: 'small' },
      ],
      defaultValue: 'default',
      group: 'basic',
    },
  ],
  eventSchema: [
    { name: 'onClick', label: '点击', description: '卡片被点击时触发' },
  ],
  styleSchema: [],
  isContainer: true,
};

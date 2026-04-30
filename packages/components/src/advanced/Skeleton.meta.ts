import type { ComponentMeta } from '@lowcode/types';

export const SkeletonMeta: ComponentMeta = {
  name: 'Skeleton',
  label: '骨架屏',
  icon: 'BlockOutlined',
  category: 'business',
  defaultProps: {
    active: true,
    avatar: false,
    loading: true,
    paragraph: true,
    title: true,
  },
  propSchema: [
    {
      name: 'active',
      label: '动画效果',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
    {
      name: 'avatar',
      label: '头像占位',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'loading',
      label: '加载状态',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
    {
      name: 'paragraph',
      label: '段落占位',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
    {
      name: 'title',
      label: '标题占位',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
  ],
  eventSchema: [],
  styleSchema: [],
};

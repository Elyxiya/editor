import type { ComponentMeta } from '@lowcode/types';

export const AvatarMeta: ComponentMeta = {
  name: 'Avatar',
  label: '头像',
  icon: 'UserOutlined',
  category: 'business',
  defaultProps: {
    shape: 'circle',
    size: 'default',
    src: '',
    alt: '',
  },
  propSchema: [
    {
      name: 'src',
      label: '图片地址',
      type: 'string',
      defaultValue: '',
      group: 'basic',
    },
    {
      name: 'alt',
      label: '替代文本',
      type: 'string',
      defaultValue: 'avatar',
      group: 'basic',
    },
    {
      name: 'shape',
      label: '形状',
      type: 'select',
      options: [
        { label: '圆形', value: 'circle' },
        { label: '方形', value: 'square' },
      ],
      defaultValue: 'circle',
      group: 'basic',
    },
    {
      name: 'size',
      label: '尺寸',
      type: 'select',
      options: [
        { label: '小', value: 'small' },
        { label: '默认', value: 'default' },
        { label: '大', value: 'large' },
      ],
      defaultValue: 'default',
      group: 'basic',
    },
  ],
  eventSchema: [],
  styleSchema: [],
};

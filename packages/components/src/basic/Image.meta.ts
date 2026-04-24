import type { ComponentMeta } from '@lowcode/types';

export const ImageMeta: ComponentMeta = {
  name: 'Image',
  label: '图片',
  icon: 'PictureOutlined',
  category: 'basic',
  defaultProps: {
    src: 'https://picsum.photos/200',
    alt: '图片',
    width: 200,
    height: undefined,
    fit: 'cover',
    preview: true,
    fallback: undefined,
    placeholder: undefined,
  },
  propSchema: [
    {
      name: 'src',
      label: '图片地址',
      type: 'string',
      defaultValue: 'https://picsum.photos/200',
      group: 'basic',
    },
    {
      name: 'alt',
      label: '替代文本',
      type: 'string',
      defaultValue: '图片',
      group: 'basic',
    },
    {
      name: 'width',
      label: '宽度',
      type: 'number',
      defaultValue: 200,
      group: 'style',
    },
    {
      name: 'height',
      label: '高度',
      type: 'number',
      defaultValue: undefined,
      group: 'style',
    },
    {
      name: 'fit',
      label: '填充方式',
      type: 'select',
      options: [
        { label: '覆盖', value: 'cover' },
        { label: 'contain', value: 'contain' },
        { label: 'fill', value: 'fill' },
        { label: 'none', value: 'none' },
      ],
      defaultValue: 'cover',
      group: 'style',
    },
    {
      name: 'preview',
      label: '可预览',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
  ],
  eventSchema: [
    { name: 'onClick', label: '点击', description: '图片被点击时触发' },
  ],
  styleSchema: [],
};

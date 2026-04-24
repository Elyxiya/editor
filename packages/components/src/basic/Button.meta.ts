import type { ComponentMeta } from '@lowcode/types';

export const ButtonMeta: ComponentMeta = {
  name: 'Button',
  label: '按钮',
  icon: 'ButtonOutlined',
  category: 'basic',
  defaultProps: {
    text: '按钮',
    type: 'primary',
    size: 'middle',
    disabled: false,
    block: false,
    danger: false,
    ghost: false,
    icon: undefined,
    shape: undefined,
    loading: false,
  },
  propSchema: [
    {
      name: 'text',
      label: '按钮文字',
      type: 'string',
      defaultValue: '按钮',
      group: 'basic',
    },
    {
      name: 'type',
      label: '类型',
      type: 'select',
      options: [
        { label: '主要按钮', value: 'primary' },
        { label: '默认按钮', value: 'default' },
        { label: '虚线按钮', value: 'dashed' },
        { label: '文本按钮', value: 'text' },
        { label: '链接按钮', value: 'link' },
      ],
      defaultValue: 'primary',
      group: 'basic',
    },
    {
      name: 'size',
      label: '尺寸',
      type: 'select',
      options: [
        { label: '大', value: 'large' },
        { label: '中', value: 'middle' },
        { label: '小', value: 'small' },
      ],
      defaultValue: 'middle',
      group: 'basic',
    },
    {
      name: 'shape',
      label: '形状',
      type: 'select',
      options: [
        { label: '默认', value: undefined },
        { label: '圆形', value: 'circle' },
        { label: '圆角', value: 'round' },
      ],
      defaultValue: undefined,
      group: 'basic',
    },
    {
      name: 'danger',
      label: '危险按钮',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'ghost',
      label: '幽灵按钮',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'loading',
      label: '加载中',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'block',
      label: '宽度适应父元素',
      type: 'boolean',
      defaultValue: false,
      group: 'style',
    },
  ],
  eventSchema: [
    { name: 'onClick', label: '点击事件', description: '按钮被点击时触发' },
  ],
  styleSchema: [
    { name: 'margin', label: '外边距', type: 'string', defaultValue: '0' },
    { name: 'padding', label: '内边距', type: 'string', defaultValue: '0' },
  ],
};

export function getButtonStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    margin: (props.margin as string) || '0',
    padding: (props.padding as string) || '0',
  };
}

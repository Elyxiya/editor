import type { ComponentMeta } from '@lowcode/types';

export const DividerMeta: ComponentMeta = {
  name: 'Divider',
  label: '分隔线',
  icon: 'MinusOutlined',
  category: 'business',
  defaultProps: {
    type: 'horizontal',
    orientation: 'center',
    plain: false,
    dashed: false,
  },
  propSchema: [
    {
      name: 'type',
      label: '方向',
      type: 'select',
      options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
      ],
      defaultValue: 'horizontal',
      group: 'basic',
    },
    {
      name: 'orientation',
      label: '文字位置',
      type: 'select',
      options: [
        { label: '居左', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '居右', value: 'right' },
      ],
      defaultValue: 'center',
      group: 'basic',
    },
    {
      name: 'plain',
      label: '纯文字',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
      tooltip: '文字是否为平淡风格',
    },
    {
      name: 'dashed',
      label: '虚线',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
  ],
  eventSchema: [],
  styleSchema: [
    { name: 'margin', label: '外边距', type: 'string', defaultValue: '16px 0' },
  ],
};

export function getDividerStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    margin: (props.margin as string) || '16px 0',
  };
}

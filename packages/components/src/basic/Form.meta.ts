import type { ComponentMeta } from '@lowcode/types';

export const FormMeta: ComponentMeta = {
  name: 'Form',
  label: '表单',
  icon: 'FormOutlined',
  category: 'basic',
  isContainer: true,
  childNames: ['FormItem'],
  defaultProps: {
    layout: 'vertical',
    labelAlign: 'left',
    requiredMark: true,
  },
  propSchema: [
    {
      name: 'layout',
      label: '表单布局',
      type: 'select',
      options: [
        { label: '垂直布局', value: 'vertical' },
        { label: '水平布局', value: 'horizontal' },
        { label: '行内布局', value: 'inline' },
      ],
      defaultValue: 'vertical',
      group: 'basic',
    },
    {
      name: 'labelAlign',
      label: '标签对齐',
      type: 'select',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '右对齐', value: 'right' },
      ],
      defaultValue: 'left',
      group: 'basic',
    },
    {
      name: 'requiredMark',
      label: '必填标记',
      type: 'select',
      options: [
        { label: '显示', value: true },
        { label: '隐藏', value: false },
        { label: '可选标记', value: 'optional' },
      ],
      defaultValue: true,
      group: 'basic',
    },
  ],
  eventSchema: [
    { name: 'onFinish', label: '提交成功', description: '表单提交成功时触发' },
    { name: 'onFinishFailed', label: '提交失败', description: '表单验证失败时触发' },
  ],
  styleSchema: [
    { name: 'width', label: '宽度', type: 'string', defaultValue: '100%' },
    { name: 'margin', label: '外边距', type: 'string', defaultValue: '0' },
    { name: 'padding', label: '内边距', type: 'string', defaultValue: '0' },
  ],
};

export function getFormStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    width: (props.width as string) || '100%',
    margin: (props.margin as string) || '0',
    padding: (props.padding as string) || '0',
  };
}

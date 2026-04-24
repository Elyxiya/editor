import type { ComponentMeta } from '@lowcode/types';

export const FormItemMeta: ComponentMeta = {
  name: 'FormItem',
  label: '表单项',
  icon: 'EditOutlined',
  category: 'basic',
  defaultProps: {
    label: '表单项',
    required: false,
    hidden: false,
    hasFeedback: true,
    fieldType: 'input',
    placeholder: '请输入',
    options: [],
  },
  propSchema: [
    {
      name: 'label',
      label: '标签',
      type: 'string',
      defaultValue: '表单项',
      group: 'basic',
    },
    {
      name: 'name',
      label: '字段名',
      type: 'string',
      defaultValue: '',
      group: 'basic',
      tooltip: '用于表单提交时的字段标识',
    },
    {
      name: 'required',
      label: '必填',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'hasFeedback',
      label: '反馈图标',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
      tooltip: '是否显示校验反馈图标',
    },
    {
      name: 'fieldType',
      label: '字段类型',
      type: 'select',
      options: [
        { label: '文本输入', value: 'input' },
        { label: '多行文本', value: 'textarea' },
        { label: '下拉选择', value: 'select' },
        { label: '日期选择', value: 'datePicker' },
        { label: '数字输入', value: 'inputNumber' },
        { label: '开关', value: 'switch' },
        { label: '单选', value: 'radio' },
        { label: '多选', value: 'checkbox' },
        { label: '自定义', value: 'custom' },
      ],
      defaultValue: 'input',
      group: 'basic',
    },
    {
      name: 'placeholder',
      label: '占位文本',
      type: 'string',
      defaultValue: '请输入',
      group: 'basic',
    },
    {
      name: 'options',
      label: '选项',
      type: 'array',
      group: 'data',
      tooltip: '下拉、单选、多选时的选项列表',
    },
    {
      name: 'hidden',
      label: '隐藏',
      type: 'boolean',
      defaultValue: false,
      group: 'style',
    },
  ],
  eventSchema: [],
  styleSchema: [
    { name: 'margin', label: '外边距', type: 'string', defaultValue: '0' },
  ],
};

export function getFormItemStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    margin: (props.margin as string) || '0',
  };
}

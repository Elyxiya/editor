import type { ComponentMeta } from '@lowcode/types';

export const SelectMeta: ComponentMeta = {
  name: 'Select',
  label: '选择器',
  icon: 'SelectOutlined',
  category: 'basic',
  defaultProps: {
    placeholder: '请选择',
    allowClear: false,
    showSearch: false,
    disabled: false,
    mode: undefined,
    options: [
      { label: '选项一', value: 'option1' },
      { label: '选项二', value: 'option2' },
      { label: '选项三', value: 'option3' },
    ],
  },
  propSchema: [
    {
      name: 'placeholder',
      label: '占位文本',
      type: 'string',
      defaultValue: '请选择',
      group: 'basic',
    },
    {
      name: 'mode',
      label: '模式',
      type: 'select',
      options: [
        { label: '单选', value: undefined },
        { label: '多选', value: 'multiple' },
        { label: '标签输入', value: 'tags' },
      ],
      defaultValue: undefined,
      group: 'basic',
    },
    {
      name: 'allowClear',
      label: '支持清除',
      type: 'boolean',
      defaultValue: false,
      group: 'basic',
    },
    {
      name: 'showSearch',
      label: '可搜索',
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
      name: 'options',
      label: '选项列表',
      type: 'array',
      group: 'data',
      tooltip: '设置下拉选项',
    },
    {
      name: 'maxTagCount',
      label: '最多标签数',
      type: 'number',
      defaultValue: undefined,
      group: 'basic',
      tooltip: '多选模式下最多显示的标签数量',
    },
  ],
  eventSchema: [
    { name: 'onChange', label: '值变化', description: '选中值变化时触发' },
  ],
  styleSchema: [
    { name: 'width', label: '宽度', type: 'string', defaultValue: '200px' },
    { name: 'margin', label: '外边距', type: 'string', defaultValue: '0' },
  ],
};

export function getSelectStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    width: (props.width as string) || '200px',
    margin: (props.margin as string) || '0',
  };
}

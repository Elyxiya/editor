import type { ComponentMeta } from '@lowcode/types';

export const TabsMeta: ComponentMeta = {
  name: 'Tabs',
  label: '标签页',
  icon: 'FolderOpenOutlined',
  category: 'business',
  isContainer: true,
  defaultProps: {
    tabPosition: 'top',
    type: 'line',
    size: 'default',
    items: [
      { key: '1', label: '标签页一' },
      { key: '2', label: '标签页二' },
    ],
  },
  propSchema: [
    {
      name: 'tabPosition',
      label: '标签位置',
      type: 'select',
      options: [
        { label: '顶部', value: 'top' },
        { label: '右侧', value: 'right' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
      ],
      defaultValue: 'top',
      group: 'basic',
    },
    {
      name: 'type',
      label: '标签样式',
      type: 'select',
      options: [
        { label: '线型', value: 'line' },
        { label: '卡片型', value: 'card' },
        { label: '可编辑卡片', value: 'editable-card' },
      ],
      defaultValue: 'line',
      group: 'basic',
    },
    {
      name: 'size',
      label: '尺寸',
      type: 'select',
      options: [
        { label: '大', value: 'large' },
        { label: '默认', value: 'default' },
        { label: '小', value: 'small' },
      ],
      defaultValue: 'default',
      group: 'basic',
    },
    {
      name: 'items',
      label: '标签配置',
      type: 'array',
      group: 'data',
      tooltip: '设置标签页内容',
    },
  ],
  eventSchema: [
    { name: 'onChange', label: '切换', description: '切换标签页时触发' },
    { name: 'onTabClick', label: '点击', description: '点击标签时触发' },
  ],
  styleSchema: [
    { name: 'margin', label: '外边距', type: 'string', defaultValue: '0' },
  ],
};

export function getTabsStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    margin: (props.margin as string) || '0',
  };
}

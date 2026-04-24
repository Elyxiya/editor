import type { ComponentMeta } from '@lowcode/types';

export const ModalMeta: ComponentMeta = {
  name: 'Modal',
  label: '弹窗',
  icon: 'ApiOutlined',
  category: 'business',
  isContainer: true,
  defaultProps: {
    open: false,
    title: '弹窗标题',
    width: 520,
    closable: true,
    maskClosable: true,
  },
  propSchema: [
    {
      name: 'title',
      label: '标题',
      type: 'string',
      defaultValue: '弹窗标题',
      group: 'basic',
    },
    {
      name: 'width',
      label: '宽度',
      type: 'number',
      defaultValue: 520,
      group: 'basic',
      min: 200,
      max: 2000,
      step: 10,
    },
    {
      name: 'closable',
      label: '显示关闭按钮',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
    {
      name: 'maskClosable',
      label: '点击遮罩关闭',
      type: 'boolean',
      defaultValue: true,
      group: 'basic',
    },
  ],
  eventSchema: [
    { name: 'onCancel', label: '取消', description: '点击取消或关闭时触发' },
    { name: 'onOk', label: '确认', description: '点击确认按钮时触发' },
  ],
  styleSchema: [],
};

export function getModalStyles(props: Record<string, unknown>): React.CSSProperties {
  return {};
}

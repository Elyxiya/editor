import React from 'react';
import { Tabs as AntTabs, TabsProps } from 'antd';
import { TabsMeta } from './Tabs.meta';
import type { ComponentProps } from '@lowcode/types';

export { TabsMeta };

export function getTabsStyles(props: Record<string, unknown>): React.CSSProperties {
  return {};
}

interface TabItem {
  key: string;
  label: string;
  children?: React.ReactNode;
}

interface LcTabsProps extends ComponentProps {
  items?: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  tabPosition?: 'top' | 'right' | 'bottom' | 'left';
  type?: 'line' | 'card' | 'editable-card';
  size?: 'large' | 'default' | 'small';
  onChange?: (activeKey: string) => void;
  onTabClick?: (key: string, e: MouseEvent | KeyboardEvent) => void;
}

export const LcTabs = Object.assign(
  (props: LcTabsProps) => {
    const {
      items = [
        { key: '1', label: '标签页一' },
        { key: '2', label: '标签页二' },
      ],
      activeKey,
      defaultActiveKey,
      tabPosition = 'top',
      type = 'line',
      size = 'default',
      onChange,
      onTabClick,
      style,
      className,
      ...rest
    } = props;

    return (
      <AntTabs
        activeKey={activeKey}
        defaultActiveKey={defaultActiveKey}
        items={items}
        tabPosition={tabPosition as TabsProps['tabPosition']}
        type={type as TabsProps['type']}
        size={size as TabsProps['size']}
        onChange={onChange}
        onTabClick={onTabClick as TabsProps['onTabClick']}
        style={{ ...getTabsStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      />
    );
  },
  { meta: TabsMeta }
);

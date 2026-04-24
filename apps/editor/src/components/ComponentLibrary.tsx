import React, { useState } from 'react';
import { Input, Collapse, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getComponentsByCategory } from '@lowcode/components';
import type { ComponentMeta } from '@lowcode/types';

const { Panel } = Collapse;

interface DraggableItemProps {
  meta: ComponentMeta;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ meta }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-${meta.name}`,
    data: { type: 'component', componentType: meta.name, componentMeta: meta },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <Tooltip title={meta.label} placement="right">
      <div
        ref={setNodeRef}
        style={style}
        className="component-item"
        {...listeners}
        {...attributes}
      >
        <span className="component-icon">{meta.label.charAt(0)}</span>
        <span className="component-label">{meta.label}</span>
      </div>
    </Tooltip>
  );
};

const categoryLabels: Record<string, string> = {
  layout: '布局组件',
  basic: '基础组件',
  business: '业务组件',
  chart: '图表组件',
  custom: '自定义',
};

export const ComponentLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeKeys, setActiveKeys] = useState<string[]>(['layout', 'basic', 'business']);

  const categories = [
    { key: 'layout', label: categoryLabels.layout, components: getComponentsByCategory('layout') },
    { key: 'basic', label: categoryLabels.basic, components: getComponentsByCategory('basic') },
    { key: 'business', label: categoryLabels.business, components: getComponentsByCategory('business') },
  ];

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    components: cat.components.filter((c) =>
      c.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.components.length > 0 || !search);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px' }}>
        <Input
          placeholder="搜索组件"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
        <Collapse
          ghost
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(keys as string[])}
        >
          {filteredCategories.map((cat) => (
            <Panel header={cat.label} key={cat.key}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {cat.components.map((meta) => (
                  <DraggableItem key={meta.name} meta={meta} />
                ))}
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

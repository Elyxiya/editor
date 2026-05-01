import React, { useState, useMemo } from 'react';
import { Input, Collapse, Tooltip, Select, Space, Tag } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getComponentsByCategory, getAllComponentMetas } from '@lowcode/components';
import type { ComponentMeta } from '@lowcode/types';

function fuzzyMatch(pattern: string, text: string): boolean {
  if (!pattern) return true;
  const p = pattern.toLowerCase();
  const t = text.toLowerCase();
  let pi = 0;
  for (let i = 0; i < t.length && pi < p.length; i++) {
    if (t[i] === p[pi]) pi++;
  }
  return pi === p.length;
}

function fuzzyScore(pattern: string, text: string): number {
  if (!pattern) return 1;
  const p = pattern.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(p)) return 3;
  if (fuzzyMatch(p, t)) return 2;
  return 0;
}

interface DraggableItemProps {
  meta: ComponentMeta;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ meta }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-${meta.name}-${meta.label}`,
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

const categoryColors: Record<string, string> = {
  layout: 'purple',
  basic: 'blue',
  business: 'cyan',
  chart: 'orange',
  custom: 'default',
};

export const ComponentLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeKeys, setActiveKeys] = useState<string[]>(['layout', 'basic', 'business', 'chart']);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

  const categories = [
    { key: 'layout', label: categoryLabels.layout, components: getComponentsByCategory('layout') },
    { key: 'basic', label: categoryLabels.basic, components: getComponentsByCategory('basic') },
    { key: 'business', label: categoryLabels.business, components: getComponentsByCategory('business') },
    { key: 'chart', label: categoryLabels.chart, components: getComponentsByCategory('chart') },
  ];

  const allMetas = getAllComponentMetas();
  const totalComponents = allMetas.length;

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        let components = cat.components;

        if (filterCategories.length > 0 && !filterCategories.includes(cat.key)) {
          return { ...cat, components: [] };
        }

        if (search) {
          components = components
            .map((c) => ({
              component: c,
              score: Math.max(
                fuzzyScore(search, c.label),
                fuzzyScore(search, c.name),
                c.label.toLowerCase().includes(search.toLowerCase()) ? 4 : 0
              ),
            }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .map(({ component }) => component);
        }

        return { ...cat, components };
      })
      .filter((cat) => cat.components.length > 0 || !search);
  }, [categories, search, filterCategories]);

  const matchCount = useMemo(() => {
    if (!search) return totalComponents;
    return allMetas
      .filter((c) => {
        const p = search.toLowerCase();
        return (
          c.label.toLowerCase().includes(p) ||
          c.name.toLowerCase().includes(p) ||
          fuzzyMatch(p, c.label) ||
          fuzzyMatch(p, c.name)
        );
      })
      .length;
  }, [search, allMetas, totalComponents]);

  const collapseItems = filteredCategories.map((cat) => ({
    key: cat.key,
    label: (
      <Space>
        <Tag color={categoryColors[cat.key] || 'default'} style={{ marginRight: 4 }}>
          {cat.components.length}
        </Tag>
        {cat.label}
      </Space>
    ),
    children: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cat.components.map((meta) => (
          <DraggableItem key={meta.name} meta={meta} />
        ))}
      </div>
    ),
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px' }}>
        <Input
          placeholder="搜索组件（支持模糊匹配）"
          prefix={<SearchOutlined />}
          suffix={
            search ? (
              <Tag color="blue" style={{ marginRight: 0, fontSize: 11 }}>
                {matchCount}/{totalComponents}
              </Tag>
            ) : null
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <div style={{ marginTop: 8 }}>
          <Select
            mode="multiple"
            placeholder={<><FilterOutlined /> 筛选分类</>}
            value={filterCategories}
            onChange={setFilterCategories}
            allowClear
            style={{ width: '100%' }}
            maxTagCount={1}
            options={[
              { value: 'layout', label: categoryLabels.layout },
              { value: 'basic', label: categoryLabels.basic },
              { value: 'business', label: categoryLabels.business },
              { value: 'chart', label: categoryLabels.chart },
            ]}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
        {search && matchCount === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
            未找到匹配的组件
          </div>
        ) : (
          <Collapse
            items={collapseItems}
            ghost
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(keys as string[])}
          />
        )}
      </div>
    </div>
  );
};

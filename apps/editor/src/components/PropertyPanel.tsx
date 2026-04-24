import React, { useMemo } from 'react';
import { Tabs, Form, Input, Select, Switch, InputNumber, ColorPicker, Divider } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { findComponentById } from '@lowcode/schema';
import { getComponentMeta } from '@lowcode/components';
import type { PropSchema } from '@lowcode/types';

export const PropertyPanel: React.FC = () => {
  const { schema, selectedId, updateComponent } = useEditorStore();

  const selectedComponent = useMemo(() => {
    if (!selectedId) return null;
    return findComponentById(schema.page.components, selectedId);
  }, [schema.page.components, selectedId]);

  const componentMeta = useMemo(() => {
    if (!selectedComponent) return null;
    return getComponentMeta(selectedComponent.type);
  }, [selectedComponent]);

  if (!selectedComponent) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
        选择一个组件以编辑属性
      </div>
    );
  }

  const handlePropChange = (name: string, value: unknown) => {
    updateComponent(selectedId!, { [name]: value });
  };

  const basicProps = componentMeta?.propSchema.filter((p) => p.group === 'basic' || !p.group);
  const styleProps = componentMeta?.propSchema.filter((p) => p.group === 'style');
  const dataProps = componentMeta?.propSchema.filter((p) => p.group === 'data');
  const eventList = componentMeta?.eventSchema || [];

  const renderFormItem = (prop: PropSchema) => {
    const value = selectedComponent.props[prop.name] ?? prop.defaultValue;

    switch (prop.type) {
      case 'string':
        return (
          <Input
            value={value as string}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            placeholder={prop.tooltip}
          />
        );
      case 'number':
        return (
          <InputNumber
            value={value as number}
            onChange={(v) => handlePropChange(prop.name, v)}
            style={{ width: '100%' }}
            min={prop.min}
            max={prop.max}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value as boolean}
            onChange={(checked) => handlePropChange(prop.name, checked)}
          />
        );
      case 'select':
        return (
          <Select
            value={value as string}
            onChange={(v) => handlePropChange(prop.name, v)}
            options={prop.options}
            style={{ width: '100%' }}
          />
        );
      case 'array':
        return (
          <Input.TextArea
            value={Array.isArray(value) ? JSON.stringify(value, null, 2) : (value as string)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '[]');
                handlePropChange(prop.name, Array.isArray(parsed) ? parsed : []);
              } catch {
                handlePropChange(prop.name, []);
              }
            }}
            placeholder={'JSON 数组格式，例如：[{"title":"列名","dataIndex":"field"}]'}
            rows={4}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        );
      case 'color':
        return (
          <ColorPicker
            value={value as string}
            onChange={(c) => handlePropChange(prop.name, c.toHexString())}
          />
        );
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
          />
        );
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '属性',
      children: (
        <Form layout="vertical" size="small">
          <Form.Item label="组件ID">
            <Input value={selectedComponent.id} disabled />
          </Form.Item>
          <Form.Item label="组件类型">
            <Input value={componentMeta?.label || selectedComponent.type} disabled />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          {basicProps?.map((prop) => (
            <Form.Item key={prop.name} label={prop.label}>
              {renderFormItem(prop)}
            </Form.Item>
          ))}
        </Form>
      ),
    },
    {
      key: 'style',
      label: '样式',
      children: (
        <Form layout="vertical" size="small">
          {styleProps?.map((prop) => (
            <Form.Item key={prop.name} label={prop.label}>
              {renderFormItem(prop)}
            </Form.Item>
          ))}
        </Form>
      ),
    },
    {
      key: 'data',
      label: '数据',
      children: (
        <Form layout="vertical" size="small">
          {dataProps?.map((prop) => (
            <Form.Item key={prop.name} label={prop.label}>
              {renderFormItem(prop)}
            </Form.Item>
          ))}
        </Form>
      ),
    },
    {
      key: 'event',
      label: '事件',
      children: (
        <div style={{ padding: '0 12px' }}>
          {eventList.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '24px 0' }}>
              该组件暂无事件配置
            </div>
          ) : (
            eventList.map((event) => (
              <div key={event.name} style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>{event.label}</div>
                <Input.TextArea
                  placeholder={`${event.description || ''}\n例如: console.log('click')`}
                  rows={3}
                  onChange={(e) => {
                    const events = selectedComponent.events || {};
                    if (e.target.value) {
                      handlePropChange('events', { ...events, [event.name]: e.target.value });
                    }
                  }}
                />
                <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                  {event.description}
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '12px 0' }}>
      <Tabs items={tabItems} defaultActiveKey="basic" size="small" />
    </div>
  );
};

type TabsProps = React.ComponentProps<typeof Tabs>;

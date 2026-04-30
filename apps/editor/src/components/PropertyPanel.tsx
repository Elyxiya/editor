import React, { useMemo } from 'react';
import { Tabs, Form, Input, Select, Switch, InputNumber, ColorPicker, Divider, Alert, Slider, Typography } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { findComponentById } from '@lowcode/schema';
import { getComponentMeta } from '@lowcode/components';
import type { PropSchema } from '@lowcode/types';
import { EventBindingPanel } from './EventBindingPanel';
import type { EventBinding } from '@lowcode/events';

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

  const componentBindings = useMemo((): EventBinding[] => {
    return (selectedComponent?.events?.bindings || []) as EventBinding[];
  }, [selectedComponent]);

  const handleBindingsChange = (bindings: EventBinding[]) => {
    updateComponent(selectedId!, { events: { bindings } });
  };

  const getStyleValue = (props: any, key: string): any => {
    if (props?.style && props.style[key] !== undefined) {
      return props.style[key];
    }
    return props?.[key];
  };

  const handleStyleChange = (key: string, value: unknown) => {
    const currentStyle = selectedComponent.props?.style || {};
    const merged = { ...currentStyle, [key]: value };
    updateComponent(selectedId!, { style: merged });
  };

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item label="margin-top" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'marginTop')}
                onChange={(v) => handleStyleChange('marginTop', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="margin-right" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'marginRight')}
                onChange={(v) => handleStyleChange('marginRight', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="margin-bottom" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'marginBottom')}
                onChange={(v) => handleStyleChange('marginBottom', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="margin-left" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'marginLeft')}
                onChange={(v) => handleStyleChange('marginLeft', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
          </div>

          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>内边距 (padding)</Typography.Text>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <Form.Item label="padding-top" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'paddingTop')}
                onChange={(v) => handleStyleChange('paddingTop', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="padding-right" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'paddingRight')}
                onChange={(v) => handleStyleChange('paddingRight', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="padding-bottom" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'paddingBottom')}
                onChange={(v) => handleStyleChange('paddingBottom', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="padding-left" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'paddingLeft')}
                onChange={(v) => handleStyleChange('paddingLeft', v)}
                style={{ width: '100%' }}
                min={0}
                max={1000}
                addonAfter="px"
              />
            </Form.Item>
          </div>

          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>尺寸 (size)</Typography.Text>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <Form.Item label="宽度" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'width')}
                onChange={(v) => handleStyleChange('width', v)}
                style={{ width: '100%' }}
                min={0}
                max={2000}
                addonAfter="px"
                placeholder="auto"
              />
            </Form.Item>
            <Form.Item label="高度" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'height')}
                onChange={(v) => handleStyleChange('height', v)}
                style={{ width: '100%' }}
                min={0}
                max={2000}
                addonAfter="px"
                placeholder="auto"
              />
            </Form.Item>
            <Form.Item label="最大宽度" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'maxWidth')}
                onChange={(v) => handleStyleChange('maxWidth', v)}
                style={{ width: '100%' }}
                min={0}
                max={3000}
                addonAfter="px"
                placeholder="none"
              />
            </Form.Item>
            <Form.Item label="最小高度" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'minHeight')}
                onChange={(v) => handleStyleChange('minHeight', v)}
                style={{ width: '100%' }}
                min={0}
                max={2000}
                addonAfter="px"
                placeholder="0"
              />
            </Form.Item>
          </div>

          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>背景 (background)</Typography.Text>

          <Form.Item label="背景色" style={{ marginBottom: 8 }}>
            <ColorPicker
              value={getStyleValue(selectedComponent.props, 'backgroundColor') || '#ffffff'}
              onChange={(c) => handleStyleChange('backgroundColor', c.toHexString())}
              showText
            />
          </Form.Item>

          <Form.Item label="背景图片 URL" style={{ marginBottom: 8 }}>
            <Input
              value={getStyleValue(selectedComponent.props, 'backgroundImage') || ''}
              onChange={(e) => handleStyleChange('backgroundImage', e.target.value)}
              placeholder="url(https://...)"
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>边框 (border)</Typography.Text>

          <Form.Item label="边框宽度" style={{ marginBottom: 8 }}>
            <InputNumber
              value={getStyleValue(selectedComponent.props, 'borderWidth')}
              onChange={(v) => handleStyleChange('borderWidth', v)}
              style={{ width: '100%' }}
              min={0}
              max={20}
              addonAfter="px"
            />
          </Form.Item>

          <Form.Item label="边框颜色" style={{ marginBottom: 8 }}>
            <ColorPicker
              value={getStyleValue(selectedComponent.props, 'borderColor') || '#d9d9d9'}
              onChange={(c) => handleStyleChange('borderColor', c.toHexString())}
              showText
            />
          </Form.Item>

          <Form.Item label="边框样式" style={{ marginBottom: 8 }}>
            <Select
              value={getStyleValue(selectedComponent.props, 'borderStyle') || 'solid'}
              onChange={(v) => handleStyleChange('borderStyle', v)}
              style={{ width: '100%' }}
              options={[
                { label: '实线', value: 'solid' },
                { label: '虚线', value: 'dashed' },
                { label: '点线', value: 'dotted' },
                { label: '双线', value: 'double' },
                { label: '无', value: 'none' },
              ]}
            />
          </Form.Item>

          <Form.Item label="圆角" style={{ marginBottom: 8 }}>
            <InputNumber
              value={getStyleValue(selectedComponent.props, 'borderRadius')}
              onChange={(v) => handleStyleChange('borderRadius', v)}
              style={{ width: '100%' }}
              min={0}
              max={100}
              addonAfter="px"
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>阴影 (shadow)</Typography.Text>

          <Form.Item label="阴影效果" style={{ marginBottom: 8 }}>
            <Select
              value={getStyleValue(selectedComponent.props, 'boxShadow') || 'none'}
              onChange={(v) => handleStyleChange('boxShadow', v)}
              style={{ width: '100%' }}
              options={[
                { label: '无', value: 'none' },
                { label: '小阴影', value: '0 1px 2px rgba(0,0,0,0.05)' },
                { label: '中等阴影', value: '0 4px 6px rgba(0,0,0,0.1)' },
                { label: '大阴影', value: '0 10px 15px rgba(0,0,0,0.1)' },
                { label: '卡片阴影', value: '0 2px 8px rgba(0,0,0,0.08)' },
                { label: '悬浮阴影', value: '0 4px 12px rgba(0,0,0,0.15)' },
                { label: '内阴影', value: 'inset 0 2px 4px rgba(0,0,0,0.1)' },
              ]}
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>定位 (position)</Typography.Text>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Form.Item label="定位方式" style={{ marginBottom: 8 }}>
              <Select
                value={getStyleValue(selectedComponent.props, 'position') || 'relative'}
                onChange={(v) => handleStyleChange('position', v)}
                style={{ width: '100%' }}
                options={[
                  { label: '静态', value: 'static' },
                  { label: '相对', value: 'relative' },
                  { label: '绝对', value: 'absolute' },
                  { label: '固定', value: 'fixed' },
                  { label: '粘性', value: 'sticky' },
                ]}
              />
            </Form.Item>
            <Form.Item label="z-index" style={{ marginBottom: 8 }}>
              <InputNumber
                value={getStyleValue(selectedComponent.props, 'zIndex') ?? 0}
                onChange={(v) => handleStyleChange('zIndex', v)}
                style={{ width: '100%' }}
                min={-1}
                max={9999}
              />
            </Form.Item>
            <Form.Item label="透明度" style={{ marginBottom: 8 }}>
              <Slider
                value={getStyleValue(selectedComponent.props, 'opacity') ?? 1}
                onChange={(v) => handleStyleChange('opacity', v)}
                min={0}
                max={1}
                step={0.1}
                marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
              />
            </Form.Item>
          </div>
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
          <Alert
            message="事件绑定"
            description="为组件的交互事件绑定对应的动作响应，支持条件判断和多动作串联。"
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />
          <EventBindingPanel
            componentType={selectedComponent.type}
            componentId={selectedComponent.id}
            componentName={componentMeta?.label}
            bindings={componentBindings}
            onChange={handleBindingsChange}
          />
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

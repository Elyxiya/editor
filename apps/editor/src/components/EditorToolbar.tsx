import React, { useState } from 'react';
import { Button, Space, Tooltip, Divider, Modal, message, Select, Input, Dropdown } from 'antd';
import {
  SaveOutlined, UndoOutlined, RedoOutlined, EyeOutlined, ExportOutlined,
  DesktopOutlined, TabletOutlined, MobileOutlined, HistoryOutlined, CloudUploadOutlined,
  FileZipOutlined, CodeOutlined
} from '@ant-design/icons';
import { useEditorStore } from '@/store/editorStore';
import { DEVICE_WIDTHS } from '@lowcode/utils';
import { getComponent } from '@lowcode/components';
import { CodeExportPanel } from '@/components/CodeExportPanel';
import { VersionHistoryPanel } from '@/components/VersionHistoryPanel';

export const EditorToolbar: React.FC = () => {
  const { schema, setSchema, undo, redo, device, setDevice, zoom, setZoom, savePage } = useEditorStore();
  const canUndo = useEditorStore((state) => state.history.past.length > 0);
  const canRedo = useEditorStore((state) => state.history.future.length > 0);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePage();
      message.success('保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const canvasWidth = DEVICE_WIDTHS[device];
  const canvasHeight = 600;

  const handlePreview = () => setIsPreview(true);

  const handleExport = () => {
    setShowExportPanel(true);
  };

  const handlePublish = () => {
    Modal.confirm({
      title: '确认发布', content: '确定要发布当前页面吗？',
      okText: '确认发布', onOk: () => message.success('发布成功'),
    });
  };

  const renderPreviewComponent = (component: any): React.ReactNode => {
    const Comp = getComponent(component.type);

    if (!Comp) {
      return <div key={component.id}>未知组件: {component.type}</div>;
    }

    const children = component.children?.map(renderPreviewComponent);

    if (component.type === 'Container') {
      return (
        <div
          key={component.id}
          style={{
            display: 'flex',
            padding: component.props?.padding || 16,
            background: component.props?.backgroundColor || '#ffffff',
            borderRadius: component.props?.borderRadius || 0,
            minHeight: component.props?.minHeight || 'auto',
            flexDirection: component.props?.flexDirection || 'row',
            justifyContent: component.props?.justifyContent || 'flex-start',
            alignItems: component.props?.alignItems || 'flex-start',
            gap: component.props?.gap || 0,
          }}
        >
          {children}
        </div>
      );
    }

    if (component.type === 'Space') {
      const gapMap: Record<string, number> = { small: 8, middle: 16, large: 24 };
      const gap = typeof component.props?.size === 'string'
        ? gapMap[component.props.size] || 8
        : (component.props?.size || 8);
      return (
        <div
          key={component.id}
          style={{
            display: 'flex',
            flexDirection: component.props?.direction === 'vertical' ? 'column' : 'row',
            gap,
            alignItems: component.props?.align === 'center' ? 'center' : component.props?.align === 'end' ? 'flex-end' : 'flex-start',
          }}
        >
          {children}
        </div>
      );
    }

    if (children && children.length > 0 && component.type !== 'FormItem') {
      return <div key={component.id}><Comp {...component.props}>{children}</Comp></div>;
    }

    return <div key={component.id} style={{ width: '100%' }}><Comp {...component.props} /></div>;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, padding: '0 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ flex: 1 }}>
        <Input value={schema.page.title} onChange={(e) => setSchema({ ...schema, page: { ...schema.page, title: e.target.value } })} style={{ width: 200 }} variant="borderless" />
      </div>
      <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Space>
          <Tooltip title="保存 (Ctrl+S)">
            <Button icon={<SaveOutlined />} onClick={handleSave} loading={isSaving}>保存</Button>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button icon={<UndoOutlined />} disabled={!canUndo} onClick={undo} />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button icon={<RedoOutlined />} disabled={!canRedo} onClick={redo} />
          </Tooltip>
          <Divider type="vertical" />
          <Select value={device} onChange={setDevice} style={{ width: 120 }}
            options={[
              { value: 'pc', label: <><DesktopOutlined /> PC</> },
              { value: 'tablet', label: <><TabletOutlined /> 平板</> },
              { value: 'mobile', label: <><MobileOutlined /> 手机</> },
            ]}
          />
          <Select value={zoom} onChange={setZoom} style={{ width: 80 }}
            options={[
              { value: 0.25, label: '25%' }, { value: 0.5, label: '50%' }, { value: 0.75, label: '75%' },
              { value: 1, label: '100%' }, { value: 1.25, label: '125%' }, { value: 1.5, label: '150%' }, { value: 2, label: '200%' },
            ]}
          />
        </Space>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Space>
          <Tooltip title="历史记录"><Button icon={<HistoryOutlined />} onClick={() => setShowVersionPanel(true)} /></Tooltip>
          <Divider type="vertical" />
          <Button icon={<EyeOutlined />} onClick={handlePreview}>预览</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={handlePublish}>发布</Button>
        </Space>
      </div>
      {isPreview && (
        <Modal
          title={`预览: ${schema.page.title}`}
          open={isPreview}
          onCancel={() => setIsPreview(false)}
          footer={null}
          width={canvasWidth + 100}
        >
          <div
            style={{
              width: canvasWidth,
              minHeight: canvasHeight,
              background: schema.page.props?.background || '#fff',
              margin: '0 auto',
              border: '1px solid #f0f0f0',
              padding: schema.page.props?.padding || 16,
            }}
          >
            {schema.page.components.map(renderPreviewComponent)}
          </div>
        </Modal>
      )}

      {/* 代码导出面板 */}
      <CodeExportPanel
        open={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        schema={schema}
        page={{
          id: schema.page.id || 'export-page',
          name: schema.page.title.replace(/\s+/g, '-').toLowerCase(),
          title: schema.page.title,
          description: schema.page.description,
          schema: schema,
          version: 1,
          createdBy: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }}
      />

      {/* 版本历史面板 */}
      <VersionHistoryPanel
        open={showVersionPanel}
        onClose={() => setShowVersionPanel(false)}
        page={{
          id: schema.page.id || 'version-page',
          name: schema.page.title.replace(/\s+/g, '-').toLowerCase(),
          title: schema.page.title,
          description: schema.page.description,
          schema: schema,
          version: 1,
          createdBy: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }}
        onRollback={(newSchema) => {
          setSchema(newSchema);
        }}
      />
    </div>
  );
};

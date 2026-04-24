import React from 'react';
import { Button, Space, Tooltip, Dropdown, Modal, message, Select, Divider, Input } from 'antd';
import {
  SaveOutlined, UndoOutlined, RedoOutlined, EyeOutlined, ExportOutlined,
  DesktopOutlined, TabletOutlined, MobileOutlined, HistoryOutlined, CloudUploadOutlined
} from '@ant-design/icons';
import { useEditorStore } from '@/store/editorStore';
import { DEVICE_WIDTHS } from '@lowcode/utils';

export const EditorToolbar: React.FC = () => {
  const { schema, setSchema, canUndo, canRedo, undo, redo, device, setDevice, zoom, setZoom, savePage } = useEditorStore() as any;
  const [isPreview, setIsPreview] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

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

  const handlePreview = () => setIsPreview(true);

  const handleExport = () => {
    Modal.info({ title: '导出代码', content: '代码导出功能将在后续版本中开放' });
  };

  const handlePublish = () => {
    Modal.confirm({
      title: '确认发布', content: '确定要发布当前页面吗？',
      okText: '确认发布', onOk: () => message.success('发布成功'),
    });
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
            <Button icon={<UndoOutlined />} disabled={!canUndo?.()} onClick={undo} />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button icon={<RedoOutlined />} disabled={!canRedo?.()} onClick={redo} />
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
          <Tooltip title="历史记录"><Button icon={<HistoryOutlined />} /></Tooltip>
          <Divider type="vertical" />
          <Button icon={<EyeOutlined />} onClick={handlePreview}>预览</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={handlePublish}>发布</Button>
        </Space>
      </div>
      {isPreview && (
        <Modal title="页面预览" open={isPreview} onCancel={() => setIsPreview(false)} footer={null} width={DEVICE_WIDTHS[device] + 100}>
          <div style={{ width: DEVICE_WIDTHS[device], minHeight: 600, background: '#fff', margin: '0 auto', border: '1px solid #f0f0f0', padding: 16 }}>
            <h2>{schema.page.title}</h2>
          </div>
        </Modal>
      )}
    </div>
  );
};

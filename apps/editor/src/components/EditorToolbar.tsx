import React, { useState, useCallback } from 'react';
import { Button, Space, Tooltip, Divider, Modal, message, Select, Input, Dropdown } from 'antd';
import {
  SaveOutlined, UndoOutlined, RedoOutlined, ExportOutlined, EyeOutlined,
  DesktopOutlined, TabletOutlined, MobileOutlined, HistoryOutlined, CloudUploadOutlined,
  ThunderboltOutlined, ApiOutlined, FileTextOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  VerticalAlignTopOutlined, VerticalAlignMiddleOutlined, VerticalAlignBottomOutlined,
  InsertRowRightOutlined, InsertRowBelowOutlined, StarOutlined
} from '@ant-design/icons';
import { useEditorStore } from '@/store/editorStore';
import { CodeExportPanel } from '@/components/CodeExportPanel';
import { VersionHistoryPanel } from '@/components/VersionHistoryPanel';
import { LogicFlowEditor } from '@/components/LogicFlowEditor';
import { DataSourceManagementPanel } from '@/components/DataSourceManagementPanel';
import { PageManagementPanel } from '@/components/PageManagementPanel';
import { TemplateManagementPanel } from '@/components/TemplateManagementPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import type { LogicFlow } from '@lowcode/logic-engine';
import type { DataSource as DataSourceType } from '@lowcode/types';

export const EditorToolbar: React.FC = () => {
  const { schema, setSchema, undo, redo, device, setDevice, zoom, setZoom, savePage, selectedIds, alignComponents, distributeComponents } = useEditorStore();
  const canUndo = useEditorStore((state) => state.history.past.length > 0);
  const canRedo = useEditorStore((state) => state.history.future.length > 0);
  const hasMultiSelect = selectedIds && selectedIds.length > 1;
  const [isSaving, setIsSaving] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [showLogicFlowEditor, setShowLogicFlowEditor] = useState(false);
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(false);
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<LogicFlow | undefined>();

  // 页面管理
  const [pages, setPages] = useState([
    { id: schema.page.id || 'default', title: schema.page.title, name: schema.page.title, version: 1, isPublished: false, updatedAt: new Date().toISOString() }
  ]);
  const currentPageId = schema.page.id || 'default';

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

  const handleExport = () => {
    setShowExportPanel(true);
  };

  const handlePublish = () => {
    Modal.confirm({
      title: '确认发布', content: '确定要发布当前页面吗？',
      okText: '确认发布', onOk: () => message.success('发布成功'),
    });
  };

  const handleLogicFlowSave = useCallback((flow: LogicFlow) => {
    setCurrentFlow(flow);
    const currentSchema = useEditorStore.getState().schema;
    const newSchema = {
      ...currentSchema,
      page: {
        ...currentSchema.page,
        props: {
          ...currentSchema.page.props,
          logicFlow: flow,
        },
      },
    };
    setSchema(newSchema);
    message.success('逻辑流程已保存');
  }, [setSchema]);

  const handleDataSourceSave = useCallback((dataSources: Record<string, DataSourceType>) => {
    const currentSchema = useEditorStore.getState().schema;
    const newSchema = {
      ...currentSchema,
      dataSources,
    };
    setSchema(newSchema);
    message.success('数据源配置已保存');
  }, [setSchema]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, padding: '0 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ flex: 1 }}>
          <Input value={schema.page.title} onChange={(e) => {
            const newTitle = e.target.value;
            setSchema({ ...useEditorStore.getState().schema, page: { ...useEditorStore.getState().schema.page, title: newTitle } });
          }} style={{ width: 200 }} variant="borderless" />
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
            <Divider type="vertical" />
            <Tooltip title={hasMultiSelect ? '对齐与分布' : '对齐工具（需多选）'}>
              <Dropdown
                disabled={!hasMultiSelect}
                menu={{
                  items: [
                    {
                      key: 'align',
                      label: '对齐',
                      type: 'group',
                      children: [
                        { key: 'left', label: '左对齐', icon: <AlignLeftOutlined />, onClick: () => alignComponents('left') },
                        { key: 'center', label: '水平居中', icon: <AlignCenterOutlined />, onClick: () => alignComponents('center') },
                        { key: 'right', label: '右对齐', icon: <AlignRightOutlined />, onClick: () => alignComponents('right') },
                        { key: 'top', label: '顶对齐', icon: <VerticalAlignTopOutlined />, onClick: () => alignComponents('top') },
                        { key: 'middle', label: '垂直居中', icon: <VerticalAlignMiddleOutlined />, onClick: () => alignComponents('middle') },
                        { key: 'bottom', label: '底对齐', icon: <VerticalAlignBottomOutlined />, onClick: () => alignComponents('bottom') },
                      ],
                    },
                    {
                      key: 'distribute',
                      label: '分布',
                      type: 'group',
                      children: [
                        { key: 'h', label: '水平等间距', icon: <InsertRowRightOutlined />, onClick: () => distributeComponents('horizontal') },
                        { key: 'v', label: '垂直等间距', icon: <InsertRowBelowOutlined />, onClick: () => distributeComponents('vertical') },
                      ],
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Button icon={<AlignCenterOutlined />} disabled={!hasMultiSelect} style={{ fontSize: 12 }}>
                  对齐 {hasMultiSelect ? `(${selectedIds.length})` : ''}
                </Button>
              </Dropdown>
            </Tooltip>
          </Space>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Space>
            <Tooltip title="历史记录"><Button icon={<HistoryOutlined />} onClick={() => setShowVersionPanel(true)} /></Tooltip>
            <Tooltip title="页面管理"><Button icon={<FileTextOutlined />} onClick={() => setShowPagePanel(true)} /></Tooltip>
            <Tooltip title="模板市场"><Button icon={<StarOutlined />} onClick={() => setShowTemplatePanel(true)} /></Tooltip>
            <Tooltip title="数据源"><Button icon={<ApiOutlined />} onClick={() => setShowDataSourcePanel(true)} /></Tooltip>
            <Tooltip title="逻辑流程"><Button icon={<ThunderboltOutlined />} onClick={() => setShowLogicFlowEditor(true)} /></Tooltip>
            <Divider type="vertical" />
            <Button icon={<EyeOutlined />} onClick={() => setShowPreviewPanel(true)}>预览</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button type="primary" icon={<CloudUploadOutlined />} onClick={handlePublish}>发布</Button>
          </Space>
        </div>
      </div>

      {/* 渲染器预览面板 */}
      <PreviewPanel
        open={showPreviewPanel}
        schema={schema}
        onClose={() => setShowPreviewPanel(false)}
      />

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

      {/* 逻辑流程编辑器 */}
      <LogicFlowEditor
        open={showLogicFlowEditor}
        onClose={() => setShowLogicFlowEditor(false)}
        flow={currentFlow}
        onSave={handleLogicFlowSave}
      />

      {/* 数据源管理面板 */}
      <DataSourceManagementPanel
        open={showDataSourcePanel}
        onClose={() => setShowDataSourcePanel(false)}
        dataSources={schema.dataSources || {}}
        onSave={handleDataSourceSave}
      />

      {/* 页面管理面板 */}
      <PageManagementPanel
        open={showPagePanel}
        onClose={() => setShowPagePanel(false)}
        pages={pages}
        currentPageId={currentPageId}
        onSwitchPage={(pageId) => {
          if (pageId !== currentPageId) {
            message.info(`切换到页面: ${pages.find(p => p.id === pageId)?.title || pageId}`);
          }
        }}
        onCreatePage={(title) => {
          const newPage = {
            id: `page_${Date.now()}`,
            title,
            name: title,
            version: 1,
            isPublished: false,
            updatedAt: new Date().toISOString(),
          };
          setPages(prev => [...prev, newPage]);
          const currentSchema = useEditorStore.getState().schema;
          setSchema({
            ...currentSchema,
            page: {
              ...currentSchema.page,
              id: newPage.id,
              title: newPage.title,
              components: [],
            },
          });
          message.success(`已创建页面: ${title}`);
        }}
        onRenamePage={(pageId, title) => {
          setPages(prev => prev.map(p => p.id === pageId ? { ...p, title, name: title, updatedAt: new Date().toISOString() } : p));
          if (pageId === currentPageId) {
            const currentSchema = useEditorStore.getState().schema;
            setSchema({
              ...currentSchema,
              page: { ...currentSchema.page, title },
            });
          }
          message.success('页面已重命名');
        }}
        onDeletePage={(pageId) => {
          setPages(prev => prev.filter(p => p.id !== pageId));
          message.success('页面已删除');
        }}
        onDuplicatePage={(pageId) => {
          const source = pages.find(p => p.id === pageId);
          if (source) {
            const newPage = {
              ...source,
              id: `page_${Date.now()}`,
              title: `${source.title} (副本)`,
              name: `${source.name}-copy`,
              version: 1,
              updatedAt: new Date().toISOString(),
            };
            setPages(prev => [...prev, newPage]);
            message.success(`已复制页面: ${newPage.title}`);
          }
        }}
      />

      {/* 模板市场面板 */}
      <TemplateManagementPanel
        open={showTemplatePanel}
        onClose={() => setShowTemplatePanel(false)}
        currentSchema={schema}
        onLoadTemplate={(newSchema) => {
          setSchema(newSchema);
        }}
      />
    </>
  );
};

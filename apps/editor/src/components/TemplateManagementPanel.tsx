/**
 * Template Management Panel
 *
 * 模板市场面板 - 保存当前页面为模板、从模板加载、模板分类浏览
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Button, Space, Tag, Typography, Input, Card, Empty,
  message, Divider, Select, Form, Popconfirm, Tabs, Badge, Switch,
} from 'antd';
import {
  SaveOutlined, DeleteOutlined, SearchOutlined,
  AppstoreOutlined, StarOutlined,
} from '@ant-design/icons';
import {
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  deleteTemplate,
  fetchTemplateCategories,
  type TemplateListItem,
  type TemplateCategory,
} from '@/services/templateService';
import type { PageSchema } from '@lowcode/types';
import { useEditorStore } from '@/store/editorStore';

const { Text, Paragraph } = Typography;

interface TemplateManagementPanelProps {
  open: boolean;
  onClose: () => void;
  currentSchema: PageSchema;
  onLoadTemplate: (schema: PageSchema) => void;
}

const categoryColors: Record<string, string> = {
  general: 'blue',
  form: 'green',
  list: 'cyan',
  dashboard: 'purple',
  detail: 'orange',
  login: 'red',
  landing: 'magenta',
};

const categoryLabels: Record<string, string> = {
  general: '通用',
  form: '表单页',
  list: '列表页',
  dashboard: '仪表盘',
  detail: '详情页',
  login: '登录页',
  landing: '落地页',
};

interface SaveTemplateFormValues {
  name: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
}

const TemplateManagementPanel: React.FC<TemplateManagementPanelProps> = ({
  open,
  onClose,
  currentSchema,
  onLoadTemplate,
}) => {
  const { setSchema, saveSnapshot } = useEditorStore();

  const [activeTab, setActiveTab] = useState('browse');
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SaveTemplateFormValues>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Load templates and categories when panel opens
  useEffect(() => {
    if (open) {
      loadTemplates();
      loadCategories();
    }
  }, [open, search, selectedCategory]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates({
        category: selectedCategory,
        search: search || undefined,
      });
      setTemplates(data);
    } catch (e) {
      message.error('加载模板失败');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchTemplateCategories();
      setCategories(data);
    } catch (e) {
      // silent fail for categories
    }
  }, []);

  const handleSaveAsTemplate = async (values: SaveTemplateFormValues) => {
    setSaving(true);
    try {
      const name = values.name || `template_${Date.now()}`;
      await createTemplate({
        name,
        title: values.title,
        description: values.description,
        category: values.category || 'general',
        schema: currentSchema,
        tags: values.tags || [],
        isPublic: values.isPublic || false,
      });
      message.success('模板保存成功');
      form.resetFields();
      loadTemplates();
      loadCategories();
    } catch (e) {
      message.error('保存模板失败');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = async (templateId: string) => {
    try {
      const template = await fetchTemplate(templateId);
      if (template.schema) {
        const loadedSchema: PageSchema = {
          ...(template.schema as PageSchema),
          page: {
            ...((template.schema as PageSchema).page || { title: '未命名页面', layout: 'flex', props: {}, components: [] }),
            id: undefined,
            title: (template.schema as PageSchema).page?.title || '未命名页面',
          },
        };
        saveSnapshot();
        setSchema(loadedSchema);
        onLoadTemplate(loadedSchema);
        message.success('模板加载成功');
        onClose();
      }
    } catch (e) {
      message.error('加载模板失败');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      message.success('模板已删除');
      loadTemplates();
      loadCategories();
    } catch (e) {
      message.error('删除模板失败');
    }
  };

  const handleQuickSave = async () => {
    const title = currentSchema.page?.title || '未命名页面';
    const name = `template_${Date.now()}`;
    setSaving(true);
    try {
      await createTemplate({
        name,
        title: `${title} - 副本`,
        description: '快速保存的模板',
        schema: currentSchema,
      });
      message.success('已保存为模板');
      loadTemplates();
      loadCategories();
    } catch (e) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const browseContent = (
    <div>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          placeholder="搜索模板..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 8 }}
        />
        <Select
          placeholder="分类筛选"
          allowClear
          value={selectedCategory}
          onChange={(v) => setSelectedCategory(v)}
          style={{ width: '100%' }}
          options={categories.map((c) => ({
            value: c.value,
            label: `${categoryLabels[c.value] || c.value} (${c.count})`,
          }))}
        />
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>
      ) : templates.length === 0 ? (
        <Empty
          style={{ padding: 24 }}
          description={search ? '未找到匹配的模板' : '暂无模板'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              size="small"
              hoverable
              onClick={() => {
                setSelectedTemplateId(tpl.id);
                handleLoadTemplate(tpl.id);
              }}
              style={{
                cursor: 'pointer',
                border: selectedTemplateId === tpl.id ? '#1677ff solid 2px' : undefined,
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag color={categoryColors[tpl.category] || 'default'} style={{ marginRight: 0 }}>
                    {categoryLabels[tpl.category] || tpl.category}
                  </Tag>
                </div>
              }
              extra={
                <Popconfirm
                  title="删除此模板？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteTemplate(tpl.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              }
            >
              <div style={{ marginBottom: 4 }}>
                <Text strong ellipsis style={{ fontSize: 13 }}>{tpl.title}</Text>
              </div>
              {tpl.description && (
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ fontSize: 11, marginBottom: 4 }}
                >
                  {tpl.description}
                </Paragraph>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag style={{ fontSize: 10, marginRight: 0 }}>
                  {tpl.componentCount} 个组件
                </Tag>
                {tpl.isPublic && <Tag color="gold" style={{ fontSize: 10, marginRight: 0 }}>公开</Tag>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const saveContent = (
    <div style={{ padding: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveAsTemplate}
        initialValues={{
          title: currentSchema.page?.title || '',
          category: 'general',
          isPublic: false,
        }}
      >
        <Form.Item
          name="title"
          label="模板标题"
          rules={[{ required: true, message: '请输入模板标题' }]}
        >
          <Input placeholder="例如：用户管理列表页" />
        </Form.Item>

        <Form.Item name="name" label="模板标识（可选）">
          <Input placeholder="英文标识，系统自动生成" />
        </Form.Item>

        <Form.Item name="description" label="模板描述">
          <Input.TextArea
            placeholder="描述此模板的用途和适用场景..."
            rows={3}
          />
        </Form.Item>

        <Form.Item name="category" label="模板分类">
          <Select
            options={[
              { value: 'general', label: '通用' },
              { value: 'form', label: '表单页' },
              { value: 'list', label: '列表页' },
              { value: 'dashboard', label: '仪表盘' },
              { value: 'detail', label: '详情页' },
              { value: 'login', label: '登录页' },
              { value: 'landing', label: '落地页' },
            ]}
          />
        </Form.Item>

        <Form.Item name="isPublic" label="访问权限" valuePropName="checked">
          <Space>
            <Switch />
            <Text>设为公开模板（所有用户可用）</Text>
          </Space>
        </Form.Item>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleQuickSave} loading={saving} icon={<SaveOutlined />}>
            快速保存
          </Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存模板
          </Button>
        </div>
      </Form>
    </div>
  );

  const tabItems = [
    {
      key: 'browse',
      label: (
        <Space>
          <AppstoreOutlined />
          浏览模板
          {templates.length > 0 && <Badge count={templates.length} size="small" />}
        </Space>
      ),
      children: browseContent,
    },
    {
      key: 'save',
      label: (
        <Space>
          <SaveOutlined />
          保存模板
        </Space>
      ),
      children: saveContent,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          模板市场
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      bodyStyle={{ padding: 0, height: 480 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k)}
        items={tabItems}
        style={{ height: '100%' }}
        tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
      />
    </Modal>
  );
};

export { TemplateManagementPanel };
export default TemplateManagementPanel;

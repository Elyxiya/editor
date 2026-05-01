/**
 * Data Source Management Panel
 *
 * 数据源管理面板 - 管理页面级别的数据源配置（API、Mock、变量）
 */

import React, { useState, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select, Switch,
  InputNumber, Divider, Popconfirm, Typography, Empty, message, Tabs, Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ApiOutlined,
  BugOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { DataSource as DataSourceType } from '@lowcode/types';

const { Text } = Typography;

interface DataSourceManagementPanelProps {
  open: boolean;
  onClose: () => void;
  dataSources: Record<string, DataSourceType>;
  onSave: (dataSources: Record<string, DataSourceType>) => void;
}

type DataSourceTypeKey = 'api' | 'mock' | 'variable';

export const DataSourceManagementPanel: React.FC<DataSourceManagementPanelProps> = ({
  open,
  onClose,
  dataSources = {},
  onSave,
}) => {
  const [dsList, setDsList] = useState<Array<DataSourceType & { key: string }>>(() =>
    Object.entries(dataSources).map(([key, ds]) => ({ ...ds, key }))
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('api');
  const [form] = Form.useForm();

  const handleAdd = useCallback((type: DataSourceTypeKey) => {
    setEditingKey('');
    form.resetFields();
    form.setFieldsValue({
      type,
      name: `new${type.charAt(0).toUpperCase() + type.slice(1)}Data`,
      autoLoad: true,
      loadDelay: 0,
      config: {
        method: 'GET',
        params: {},
        headers: {},
      },
    });
    setActiveTab(type);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: DataSourceType & { key: string }) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      description: record.description,
      autoLoad: record.autoLoad,
      loadDelay: record.loadDelay || 0,
      config: record.config || {},
    });
    setActiveTab(record.type);
    setModalOpen(true);
  }, [form]);

  const handleDelete = useCallback((key: string) => {
    setDsList((prev) => prev.filter((ds) => ds.key !== key));
    message.success('数据源已删除');
  }, []);

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const key = editingKey || values.name;
      const existing = dsList.find((ds) => ds.key === editingKey);

      const newDs: DataSourceType & { key: string } = {
        key,
        id: existing?.id || `ds_${Date.now()}`,
        name: values.name,
        type: values.type,
        description: values.description || '',
        autoLoad: values.autoLoad,
        loadDelay: values.loadDelay,
        config: values.config || {},
      };

      if (editingKey) {
        setDsList((prev) => prev.map((ds) => (ds.key === editingKey ? newDs : ds)));
        message.success('数据源已更新');
      } else {
        if (dsList.some((ds) => ds.key === key)) {
          message.error('数据源名称已存在');
          return;
        }
        setDsList((prev) => [...prev, newDs]);
        message.success('数据源已添加');
      }

      setModalOpen(false);
    });
  }, [form, editingKey, dsList]);

  const handleFinish = useCallback(() => {
    const result: Record<string, DataSourceType> = {};
    dsList.forEach((ds) => {
      const { key, ...rest } = ds;
      result[key] = rest as DataSourceType;
    });
    onSave(result);
    message.success('数据源配置已保存');
    onClose();
  }, [dsList, onSave, onClose]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DataSourceType & { key: string }) => (
        <Space>
          {record.type === 'api' && <ApiOutlined style={{ color: '#1890ff' }} />}
          {record.type === 'mock' && <BugOutlined style={{ color: '#52c41a' }} />}
          {record.type === 'variable' && <DatabaseOutlined style={{ color: '#722ed1' }} />}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: DataSourceTypeKey) => {
        const map: Record<DataSourceTypeKey, { label: string; color: string }> = {
          api: { label: 'API', color: 'blue' },
          mock: { label: 'Mock', color: 'green' },
          variable: { label: '变量', color: 'purple' },
        };
        const { label, color } = map[type] || { label: type, color: 'default' };
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '自动加载',
      dataIndex: 'autoLoad',
      key: 'autoLoad',
      width: 100,
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Text type="secondary">{text || '-'}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DataSourceType & { key: string }) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该数据源？"
            onConfirm={() => handleDelete(record.key)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <ApiOutlined />
          <span>数据源管理</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleFinish}
      width={800}
      okText="保存并关闭"
      cancelText="取消"
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => handleAdd('api')} size="small">
              添加 API
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => handleAdd('mock')} size="small">
              添加 Mock
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => handleAdd('variable')} size="small">
              添加变量
            </Button>
          </Space>
        }
        items={[
          {
            key: 'api',
            label: 'API 数据源',
            children: (
              <>
                <Alert
                  message="API 数据源"
                  description="配置 HTTP API 接口，系统会自动请求并返回数据。支持 GET/POST/PUT/DELETE 等方法。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {dsList.filter((ds) => ds.type === 'api').length > 0 ? (
                  <Table
                    dataSource={dsList.filter((ds) => ds.type === 'api')}
                    columns={columns}
                    rowKey="key"
                    size="small"
                    pagination={false}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        暂无 API 数据源，点击上方 <Text strong>"添加 API"</Text> 开始配置
                      </span>
                    }
                  />
                )}
              </>
            ),
          },
          {
            key: 'mock',
            label: 'Mock 数据源',
            children: (
              <>
                <Alert
                  message="Mock 数据源"
                  description="配置模拟数据，适合在没有后端接口时进行前端开发和测试。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {dsList.filter((ds) => ds.type === 'mock').length > 0 ? (
                  <Table
                    dataSource={dsList.filter((ds) => ds.type === 'mock')}
                    columns={columns}
                    rowKey="key"
                    size="small"
                    pagination={false}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        暂无 Mock 数据源，点击上方 <Text strong>"添加 Mock"</Text> 开始配置
                      </span>
                    }
                  />
                )}
              </>
            ),
          },
          {
            key: 'variable',
            label: '变量数据源',
            children: (
              <>
                <Alert
                  message="变量数据源"
                  description="配置静态变量数据，适合存储页面级的状态变量。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {dsList.filter((ds) => ds.type === 'variable').length > 0 ? (
                  <Table
                    dataSource={dsList.filter((ds) => ds.type === 'variable')}
                    columns={columns}
                    rowKey="key"
                    size="small"
                    pagination={false}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        暂无变量数据源，点击上方 <Text strong>"添加变量"</Text> 开始配置
                      </span>
                    }
                  />
                )}
              </>
            ),
          },
        ]}
      />

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingKey ? '编辑数据源' : '新增数据源'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="small">
          <Divider orientation="left">基本信息</Divider>

          <Form.Item
            name="name"
            label="数据源名称"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="例如: userList, productData" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="描述该数据源的用途" />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="autoLoad" label="自动加载" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>

            <Form.Item
              name="loadDelay"
              label="加载延迟 (ms)"
              style={{ marginBottom: 0, minWidth: 140 }}
            >
              <InputNumber min={0} step={100} />
            </Form.Item>
          </Space>

          <Divider orientation="left">类型配置</Divider>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {() => null}
          </Form.Item>

          {/* API 配置 */}
          {activeTab === 'api' && (
            <>
              <Form.Item name={['config', 'method']} label="请求方法" initialValue="GET">
                <Select
                  options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                    { value: 'PUT', label: 'PUT' },
                    { value: 'DELETE', label: 'DELETE' },
                    { value: 'PATCH', label: 'PATCH' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name={['config', 'url']}
                label="请求地址"
                rules={[{ required: true, message: '请输入请求地址' }]}
              >
                <Input placeholder="https://api.example.com/data" />
              </Form.Item>

              <Form.Item name={['config', 'params']} label="URL 参数 (JSON)">
                <Input.TextArea
                  rows={2}
                  placeholder='{"page": 1, "pageSize": 10}'
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item name={['config', 'headers']} label="请求头 (JSON)">
                <Input.TextArea
                  rows={2}
                  placeholder='{"Authorization": "Bearer xxx"}'
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item name={['config', 'body']} label="请求体 (JSON)">
                <Input.TextArea
                  rows={3}
                  placeholder='{"name": "value"}'
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item name={['config', 'timeout']} label="超时时间 (ms)" initialValue={30000}>
                <InputNumber min={1000} max={60000} step={1000} />
              </Form.Item>

              <Form.Item name={['config', 'authType']} label="认证方式">
                <Select
                  allowClear
                  options={[
                    { value: 'none', label: '无' },
                    { value: 'bearer', label: 'Bearer Token' },
                    { value: 'basic', label: 'Basic Auth' },
                  ]}
                />
              </Form.Item>
            </>
          )}

          {/* Mock 配置 */}
          {activeTab === 'mock' && (
            <>
              <Form.Item name={['config', 'mockData']} label="Mock 数据 (JSON)">
                <Input.TextArea
                  rows={8}
                  placeholder={`[\n  {"id": 1, "name": "示例数据"}\n]`}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item name={['config', 'headers']} label="模拟延迟 (ms)" extra="设置模拟网络请求延迟时间">
                <InputNumber min={0} max={5000} step={100} defaultValue={300} />
              </Form.Item>
            </>
          )}

          {/* Variable 配置 */}
          {activeTab === 'variable' && (
            <>
              <Form.Item name={['config', 'mockData']} label="变量值 (JSON)">
                <Input.TextArea
                  rows={6}
                  placeholder='{"key": "value"}'
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Modal>
  );
};

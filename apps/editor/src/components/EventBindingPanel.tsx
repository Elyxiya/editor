/**
 * Event Binding Panel
 *
 * 事件绑定面板 - 为选中组件配置事件触发后的动作
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Divider,
  Typography,
  Empty,
  message,
  List,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ComponentEventDefinition, EventBinding } from '@lowcode/events';
import { getComponentMeta } from '@lowcode/components';
import { v4 as uuidv4 } from 'uuid';

const { Text } = Typography;

interface EventBindingPanelProps {
  componentType: string;
  componentId: string;
  componentName?: string;
  bindings: EventBinding[];
  onChange: (bindings: EventBinding[]) => void;
}

interface ActionTypeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const ACTION_TYPES: ActionTypeOption[] = [
  {
    value: 'showMessage',
    label: '消息提示',
    icon: <PlayCircleOutlined />,
    color: '#1890ff',
    description: '显示一条操作反馈消息',
  },
  {
    value: 'navigate',
    label: '页面跳转',
    icon: <LinkOutlined />,
    color: '#52c41a',
    description: '跳转到指定页面',
  },
  {
    value: 'setValue',
    label: '变量赋值',
    icon: <EditOutlined />,
    color: '#722ed1',
    description: '修改变量或属性的值',
  },
  {
    value: 'callApi',
    label: '调用接口',
    icon: <ThunderboltOutlined />,
    color: '#fa8c16',
    description: '发起 HTTP API 请求',
  },
  {
    value: 'showModal',
    label: '显示弹窗',
    icon: <PlayCircleOutlined />,
    color: '#eb2f96',
    description: '显示一个模态框',
  },
  {
    value: 'hideModal',
    label: '关闭弹窗',
    icon: <DeleteOutlined />,
    color: '#f5222d',
    description: '关闭当前模态框',
  },
  {
    value: 'download',
    label: '下载文件',
    icon: <LinkOutlined />,
    color: '#13c2c2',
    description: '触发文件下载',
  },
  {
    value: 'triggerEvent',
    label: '触发事件',
    icon: <ThunderboltOutlined />,
    color: '#faad14',
    description: '触发一个自定义事件',
  },
  {
    value: 'script',
    label: '执行脚本',
    icon: <PlayCircleOutlined />,
    color: '#a0a0a0',
    description: '执行一段 JavaScript 代码',
  },
];

export const EventBindingPanel: React.FC<EventBindingPanelProps> = ({
  componentType,
  componentId,
  componentName: _componentName,
  bindings = [],
  onChange,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  const componentMeta = getComponentMeta(componentType);
  const eventDefinitions: ComponentEventDefinition[] = componentMeta?.eventSchema || [];

  const handleAddBinding = useCallback(() => {
    if (eventDefinitions.length === 0) {
      message.warning('该组件暂无预定义事件，请手动输入事件名称');
    }
    setEditingIndex(null);
    form.resetFields();
    form.setFieldsValue({
      enabled: true,
      condition: '',
      actions: [{ type: 'showMessage', config: { type: 'success', content: '' } }],
    });
    setModalOpen(true);
  }, [form, eventDefinitions]);

  const handleEditBinding = useCallback((index: number) => {
    const binding = bindings[index];
    setEditingIndex(index);
    form.setFieldsValue({
      eventType: binding.eventType,
      enabled: binding.enabled,
      condition: binding.condition || '',
      actions: binding.actions,
    });
    setModalOpen(true);
  }, [form, bindings]);

  const handleDeleteBinding = useCallback((index: number) => {
    const newBindings = bindings.filter((_, i) => i !== index);
    onChange(newBindings);
    message.success('事件绑定已删除');
  }, [bindings, onChange]);

  const handleSaveBinding = useCallback(() => {
    form.validateFields().then((values) => {
      const binding: EventBinding = {
        id: editingIndex !== null ? bindings[editingIndex].id : uuidv4(),
        componentId,
        eventType: values.eventType,
        enabled: values.enabled,
        condition: values.condition || undefined,
        actions: values.actions || [],
      };

      let newBindings: EventBinding[];
      if (editingIndex !== null) {
        newBindings = bindings.map((b, i) => (i === editingIndex ? binding : b));
      } else {
        newBindings = [...bindings, binding];
      }

      onChange(newBindings);
      setModalOpen(false);
      message.success(editingIndex !== null ? '事件绑定已更新' : '事件绑定已添加');
    });
  }, [form, editingIndex, bindings, componentId, onChange]);

  const getEventOptions = () => {
    if (eventDefinitions.length > 0) {
      return eventDefinitions.map((e) => ({
        label: `${e.label} (${e.name})`,
        value: e.name,
      }));
    }
    return [
      { label: '点击 (click)', value: 'click' },
      { label: '双击 (dblclick)', value: 'dblclick' },
      { label: '值变化 (change)', value: 'change' },
      { label: '获得焦点 (focus)', value: 'focus' },
      { label: '失去焦点 (blur)', value: 'blur' },
      { label: '提交 (submit)', value: 'submit' },
      { label: '加载完成 (load)', value: 'load' },
    ];
  };

  const renderActionConfig = (actionIndex: number, actionType: string) => {
    switch (actionType) {
      case 'showMessage':
        return (
          <>
            <Form.Item
              name={['actions', actionIndex, 'config', 'type']}
              label="消息类型"
              initialValue="success"
            >
              <Select
                options={[
                  { value: 'success', label: '成功' },
                  { value: 'info', label: '信息' },
                  { value: 'warning', label: '警告' },
                  { value: 'error', label: '错误' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'content']}
              label="消息内容"
              rules={[{ required: true, message: '请输入消息内容' }]}
            >
              <Input placeholder="操作成功！" />
            </Form.Item>
          </>
        );

      case 'navigate':
        return (
          <>
            <Form.Item
              name={['actions', actionIndex, 'config', 'path']}
              label="跳转路径"
              rules={[{ required: true, message: '请输入跳转路径' }]}
            >
              <Input placeholder="/page/home" />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'openInNewTab']}
              label="打开方式"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="新标签页" unCheckedChildren="当前页" />
            </Form.Item>
          </>
        );

      case 'setValue':
        return (
          <>
            <Form.Item
              name={['actions', actionIndex, 'config', 'target']}
              label="变量名"
              rules={[{ required: true, message: '请输入变量名' }]}
            >
              <Input placeholder="myVariable" />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'value']}
              label="变量值"
            >
              <Input placeholder="123 或 {{otherVar}}" />
            </Form.Item>
          </>
        );

      case 'callApi':
        return (
          <>
            <Form.Item
              name={['actions', actionIndex, 'config', 'url']}
              label="API 地址"
              rules={[{ required: true, message: '请输入 API 地址' }]}
            >
              <Input placeholder="https://api.example.com/xxx" />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'method']}
              label="请求方法"
              initialValue="GET"
            >
              <Select options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
              ]} />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'params']}
              label="请求参数 (JSON)"
            >
              <Input.TextArea rows={2} placeholder='{"key": "value"}' style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </>
        );

      case 'showModal':
        return (
          <>
            <Form.Item
              name={['actions', actionIndex, 'config', 'modalId']}
              label="弹窗 ID"
              rules={[{ required: true, message: '请输入弹窗 ID' }]}
            >
              <Input placeholder="modal_confirm" />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'title']}
              label="弹窗标题"
            >
              <Input placeholder="确认操作" />
            </Form.Item>
          </>
        );

      case 'hideModal':
        return (
          <Form.Item
            name={['actions', actionIndex, 'config', 'modalId']}
            label="弹窗 ID"
            rules={[{ required: true, message: '请输入弹窗 ID' }]}
          >
            <Input placeholder="modal_confirm" />
          </Form.Item>
        );

      case 'download':
        return (
          <>
            <Form.Item
              name={['actions', actionIndex, 'config', 'url']}
              label="文件地址"
              rules={[{ required: true, message: '请输入文件地址' }]}
            >
              <Input placeholder="https://example.com/file.pdf" />
            </Form.Item>
            <Form.Item
              name={['actions', actionIndex, 'config', 'filename']}
              label="下载文件名"
            >
              <Input placeholder="export.pdf" />
            </Form.Item>
          </>
        );

      case 'triggerEvent':
        return (
          <Form.Item
            name={['actions', actionIndex, 'config', 'eventName']}
            label="事件名称"
            rules={[{ required: true, message: '请输入事件名称' }]}
          >
            <Input placeholder="myCustomEvent" />
          </Form.Item>
        );

      case 'script':
        return (
          <Form.Item
            name={['actions', actionIndex, 'config', 'script']}
            label="JavaScript 代码"
            rules={[{ required: true, message: '请输入脚本代码' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="console.log('Hello')"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        );

      default:
        return (
          <Form.Item name={['actions', actionIndex, 'config']} label="配置 (JSON)">
            <Input.TextArea rows={3} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <Text strong style={{ fontSize: 13 }}>事件绑定</Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            共 {bindings.length} 个事件
          </Text>
        </div>
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddBinding}>
          添加事件
        </Button>
      </div>

      {bindings.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ fontSize: 12 }}>
              暂无事件绑定，点击上方按钮添加事件
            </span>
          }
        />
      ) : (
        <List
          size="small"
          dataSource={bindings}
          renderItem={(binding, index) => (
            <List.Item
              key={binding.id}
              style={{
                padding: '8px 0',
                opacity: binding.enabled === false ? 0.5 : 1,
              }}
              actions={[
                <Button
                  key="edit"
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBinding(index)}
                />,
                <Popconfirm
                  key="delete"
                  title="确定删除该事件绑定？"
                  onConfirm={() => handleDeleteBinding(index)}
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Tag icon={<ThunderboltOutlined />} color="blue">
                    {binding.eventType}
                  </Tag>
                }
                title={
                  <Space>
                    <Text style={{ fontSize: 12 }}>{binding.eventType}</Text>
                    {binding.actions.length > 0 && (
                      <Tag style={{ fontSize: 10 }}>
                        {binding.actions.length} 个动作
                      </Tag>
                    )}
                    {binding.condition && (
                      <Tag style={{ fontSize: 10 }} color="orange">
                        条件: {binding.condition}
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  binding.actions.length > 0 && (
                    <Space size={4} wrap>
                      {binding.actions.map((action, i) => (
                        <Tag key={i} style={{ fontSize: 10 }}>
                          {ACTION_TYPES.find((a) => a.value === action.type)?.label || action.type}
                        </Tag>
                      ))}
                    </Space>
                  )
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* 编辑/新增事件绑定弹窗 */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined />
            <span>{editingIndex !== null ? '编辑事件绑定' : '新增事件绑定'}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSaveBinding}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="small">
          <Divider orientation="left" plain>触发条件</Divider>

          <Form.Item
            name="eventType"
            label="触发事件"
            rules={[{ required: true, message: '请选择触发事件' }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="选择或输入事件名称"
              options={getEventOptions()}
            />
          </Form.Item>

          <Form.Item name="condition" label="执行条件 (表达式)">
            <Input
              placeholder="例如: count > 0"
              suffix={
                <Text type="secondary" style={{ fontSize: 10 }}>
                  条件为真时才执行
                </Text>
              }
            />
          </Form.Item>

          <Form.Item name="enabled" label="是否启用" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Divider orientation="left" plain>执行动作</Divider>

          <Form.List name="actions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    title={
                      <Space>
                        <Tag color="blue">动作 {index + 1}</Tag>
                        <Form.Item
                          {...restField}
                          name={[name, 'type']}
                          style={{ marginBottom: 0, width: 160 }}
                        >
                          <Select
                            placeholder="选择动作"
                            options={ACTION_TYPES.map((a) => ({
                              label: (
                                <Space>
                                  <span style={{ color: a.color }}>{a.icon}</span>
                                  {a.label}
                                </Space>
                              ),
                              value: a.value,
                            }))}
                          />
                        </Form.Item>
                      </Space>
                    }
                    extra={
                      fields.length > 1 && (
                        <Button size="small" danger type="text" onClick={() => remove(name)}>
                          删除
                        </Button>
                      )
                    }
                    style={{ marginBottom: 8 }}
                  >
                    <Form.Item
                      name={[name, 'delay']}
                      label="延迟执行 (ms)"
                      initialValue={0}
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber min={0} step={100} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) =>
                      prev.actions?.[name]?.type !== curr.actions?.[name]?.type
                    }>
                      {() => {
                        const actionType = form.getFieldValue(['actions', name, 'type']);
                        return renderActionConfig(name, actionType);
                      }}
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ type: 'showMessage', config: { type: 'success', content: '' } })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 8 }}
                >
                  添加动作
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

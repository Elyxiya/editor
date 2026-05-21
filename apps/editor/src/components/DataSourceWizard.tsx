/**
 * Data Source Wizard
 *
 * 数据源向导 - 引导用户连接外部数据库，自动生成表格组件
 * 步骤：选择类型 → 填写连接串 → 测试连接 → 选择表 → 映射字段 → 完成
 */

import React, { useState, useCallback } from 'react';
import {
  Modal, Steps, Button, Form, Input, Select, Card, Table, Tag,
  Typography, Space, Alert, message, Spin, Empty, Descriptions, Divider,
} from 'antd';
import {
  DatabaseOutlined, CheckCircleOutlined, CloseCircleOutlined,
  TableOutlined, FieldStringOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import * as datasourceService from '@/services/datasource';

const { Text, Title } = Typography;

interface DataSourceWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: {
    tableSchema: any;
    dataSourceConfig: any;
  }) => void;
}

type DbType = 'mysql' | 'postgresql';

const DB_TYPE_OPTIONS = [
  { value: 'mysql', label: 'MySQL / MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
];

const DB_DEFAULT_PORTS: Record<DbType, number> = {
  mysql: 3306,
  postgresql: 5432,
};

export const DataSourceWizard: React.FC<DataSourceWizardProps> = ({
  open,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [connectionConfig, setConnectionConfig] = useState<{
    type: DbType; host: string; port: number; database: string;
    user: string; password: string;
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [tables, setTables] = useState<datasourceService.TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<datasourceService.ColumnInfo[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setConnectionConfig(null);
    setConnectionStatus('idle');
    setConnectionMessage('');
    setTables([]);
    setSelectedTable('');
    setColumns([]);
    setSelectedColumns([]);
    form.resetFields();
  }, [form]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleDbTypeChange = useCallback((type: DbType) => {
    form.setFieldsValue({ port: DB_DEFAULT_PORTS[type] });
  }, [form]);

  const handleTestConnection = useCallback(async () => {
    try {
      const values = await form.validateFields(['type', 'host', 'port', 'database', 'user', 'password']);
      const config = {
        type: values.type as DbType,
        host: values.host,
        port: Number(values.port),
        database: values.database,
        user: values.user,
        password: values.password,
      };
      setConnectionConfig(config);
      setConnectionStatus('testing');
      setConnectionMessage('正在测试连接...');

      const result = await datasourceService.testConnection(config);
      setConnectionStatus(result.success ? 'success' : 'error');
      setConnectionMessage(result.message);

      if (result.success) {
        message.success('数据库连接成功！');
      }
    } catch (err: any) {
      if (err.errorFields) return;
      setConnectionStatus('error');
      setConnectionMessage(err.message || '测试连接失败');
    }
  }, [form]);

  const handleNextToTables = useCallback(async () => {
    if (!connectionConfig || connectionStatus !== 'success') return;
    setLoadingTables(true);
    try {
      const result = await datasourceService.getTables(connectionConfig);
      if (result.success) {
        setTables(result.data);
        setCurrentStep(1);
      } else {
        message.error(result.success === false ? '获取表列表失败' : '未知错误');
      }
    } catch (err: any) {
      message.error('获取表列表失败: ' + (err.message || '未知错误'));
    } finally {
      setLoadingTables(false);
    }
  }, [connectionConfig, connectionStatus]);

  const handleSelectTable = useCallback(async (tableName: string) => {
    if (!connectionConfig) return;
    setSelectedTable(tableName);
    setLoadingColumns(true);
    try {
      const result = await datasourceService.getTableSchema(connectionConfig, tableName);
      if (result.success) {
        setColumns(result.data);
        setSelectedColumns(result.data.map(c => c.name));
        setCurrentStep(2);
      }
    } catch (err: any) {
      message.error('获取字段信息失败: ' + (err.message || '未知错误'));
    } finally {
      setLoadingColumns(false);
    }
  }, [connectionConfig]);

  const handleComplete = useCallback(async () => {
    if (!connectionConfig || !selectedTable) return;

    const filteredColumns = columns.filter(c => selectedColumns.includes(c.name));
    const tableSchema = datasourceService.generateTableSchemaFromColumns(
      selectedTable, filteredColumns
    );

    const result = {
      tableSchema,
      dataSourceConfig: {
        type: 'database',
        name: `${connectionConfig.database}_${selectedTable}`,
        config: {
          type: connectionConfig.type,
          host: connectionConfig.host,
          port: connectionConfig.port,
          database: connectionConfig.database,
          user: connectionConfig.user,
          password: connectionConfig.password,
          table: selectedTable,
        },
      },
    };

    onComplete(result);
    message.success(`已从 "${selectedTable}" 表生成表格组件`);
    reset();
  }, [connectionConfig, selectedTable, columns, selectedColumns, onComplete, reset]);

  const steps = [
    {
      title: '连接数据库',
      content: (
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <Alert
            message="连接外部数据库"
            description="输入数据库连接信息，系统将直连您的数据库并读取表结构。密码将加密存储。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Form
            form={form}
            layout="vertical"
            size="middle"
            initialValues={{
              type: 'mysql',
              port: 3306,
              host: 'localhost',
            }}
          >
            <Form.Item
              name="type"
              label="数据库类型"
              rules={[{ required: true, message: '请选择数据库类型' }]}
            >
              <Select options={DB_TYPE_OPTIONS} onChange={handleDbTypeChange} />
            </Form.Item>

            <Space style={{ width: '100%' }} size={12}>
              <Form.Item
                name="host"
                label="主机地址"
                rules={[{ required: true, message: '请输入主机地址' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="localhost 或 IP 地址" />
              </Form.Item>

              <Form.Item
                name="port"
                label="端口"
                rules={[{ required: true, message: '请输入端口' }]}
                style={{ width: 120 }}
              >
                <Input type="number" />
              </Form.Item>
            </Space>

            <Form.Item
              name="database"
              label="数据库名"
              rules={[{ required: true, message: '请输入数据库名' }]}
            >
              <Input placeholder="my_database" />
            </Form.Item>

            <Form.Item
              name="user"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="root" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
            >
              <Input.Password placeholder="输入密码" />
            </Form.Item>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleTestConnection}
                loading={connectionStatus === 'testing'}
                block
              >
                测试连接
              </Button>

              {connectionStatus === 'success' && (
                <Alert
                  type="success"
                  showIcon
                  message="连接成功"
                  description={connectionMessage}
                />
              )}
              {connectionStatus === 'error' && (
                <Alert
                  type="error"
                  showIcon
                  message="连接失败"
                  description={connectionMessage}
                />
              )}
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      title: '选择数据表',
      content: (
        <Spin spinning={loadingTables}>
          <Card style={{ maxWidth: 600, margin: '0 auto' }}>
            <Alert
              message="选择数据表"
              description={`数据库 ${connectionConfig?.database} 中共找到 ${tables.length} 张表，选择要使用的表。`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {tables.length === 0 ? (
              <Empty description="未找到任何数据表" />
            ) : (
              <Table
                dataSource={tables}
                columns={[
                  {
                    title: '表名',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name: string) => (
                      <Space>
                        <TableOutlined style={{ color: '#1890ff' }} />
                        <Text strong>{name}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: '注释',
                    dataIndex: 'comment',
                    key: 'comment',
                    render: (text: string) => text || '-',
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 120,
                    render: (_: any, record: datasourceService.TableInfo) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleSelectTable(record.name)}
                      >
                        选择
                      </Button>
                    ),
                  },
                ]}
                rowKey="name"
                size="small"
                pagination={false}
              />
            )}
          </Card>
        </Spin>
      ),
    },
    {
      title: '配置字段',
      content: (
        <Spin spinning={loadingColumns}>
          <Card style={{ maxWidth: 600, margin: '0 auto' }}>
            <Alert
              message={`配置表 "${selectedTable}" 的字段`}
              description="选择要在表格组件中展示的字段，系统将自动生成表格列配置。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={columns}
              columns={[
                {
                  title: '显示',
                  dataIndex: 'name',
                  key: 'selected',
                  width: 60,
                  render: (name: string) => (
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns(prev => [...prev, name]);
                        } else {
                          setSelectedColumns(prev => prev.filter(n => n !== name));
                        }
                      }}
                    />
                  ),
                },
                {
                  title: '字段名',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string) => (
                    <Space>
                      <FieldStringOutlined style={{ color: '#722ed1' }} />
                      <Text code>{name}</Text>
                    </Space>
                  ),
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 120,
                  render: (type: string) => <Tag>{type}</Tag>,
                },
                {
                  title: '主键',
                  dataIndex: 'isPrimaryKey',
                  key: 'isPrimaryKey',
                  width: 60,
                  render: (val: boolean) =>
                    val ? <Tag color="gold">PK</Tag> : null,
                },
                {
                  title: '可空',
                  dataIndex: 'nullable',
                  key: 'nullable',
                  width: 60,
                  render: (val: boolean) =>
                    val ? <Tag color="default">YES</Tag> : <Tag color="red">NO</Tag>,
                },
                {
                  title: '注释',
                  dataIndex: 'comment',
                  key: 'comment',
                  width: 150,
                  ellipsis: true,
                  render: (text: string) => text || '-',
                },
              ]}
              rowKey="name"
              size="small"
              pagination={false}
            />
            <Divider />
            <Descriptions title="即将生成的配置" size="small" column={1}>
              <Descriptions.Item label="数据源名称">
                {connectionConfig?.database}_{selectedTable}
              </Descriptions.Item>
              <Descriptions.Item label="选中字段">
                {selectedColumns.length} / {columns.length} 个
              </Descriptions.Item>
              <Descriptions.Item label="表格组件">
                自动生成包含 {selectedColumns.length} 列的 Table 组件
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Spin>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          <span>数据库接入向导</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={720}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24, marginTop: 8 }}
        items={[
          { title: '连接数据库', icon: <DatabaseOutlined /> },
          { title: '选择数据表', icon: <TableOutlined /> },
          { title: '配置字段', icon: <FieldStringOutlined /> },
        ]}
      />

      <div style={{ minHeight: 320 }}>
        {steps[currentStep].content}
      </div>

      <Divider style={{ margin: '16px 0 12px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(prev => prev - 1)}
        >
          上一步
        </Button>
        <Space>
          {currentStep < steps.length - 1 ? (
            <Button
              type="primary"
              onClick={currentStep === 0 ? handleNextToTables : undefined}
              disabled={
                (currentStep === 0 && connectionStatus !== 'success') ||
                loadingTables
              }
              icon={<ArrowRightOutlined />}
            >
              下一步
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleComplete}
              icon={<CheckCircleOutlined />}
              disabled={selectedColumns.length === 0}
            >
              完成 - 生成表格
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

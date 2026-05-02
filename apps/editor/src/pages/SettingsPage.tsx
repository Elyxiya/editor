import React, { useState } from 'react';
import { Card, Typography, Form, Input, Switch, Select, Divider, Space, Button, message } from 'antd';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('设置已保存');
    }, 500);
  };

  const handleImportComponent = () => {
    message.info('组件导入功能开发中');
  };

  const handleExportComponent = () => {
    message.info('组件导出功能开发中');
  };
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={3}>设置</Title>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="用户名">
            <Input defaultValue="admin" />
          </Form.Item>
          <Form.Item label="邮箱">
            <Input defaultValue="admin@example.com" />
          </Form.Item>
        </Form>
      </Card>

      <Card title="编辑器设置" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>自动保存</Text>
              <br />
              <Text type="secondary">编辑时自动保存页面</Text>
            </div>
            <Switch defaultChecked />
          </div>
          <Divider style={{ margin: 0 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>显示网格</Text>
              <br />
              <Text type="secondary">在画布上显示网格辅助线</Text>
            </div>
            <Switch defaultChecked />
          </div>
          <Divider style={{ margin: 0 }} />
          <Form.Item label="默认设备">
            <Select
              defaultValue="pc"
              options={[
                { label: '桌面端 (1920px)', value: 'pc' },
                { label: '平板端 (768px)', value: 'tablet' },
                { label: '移动端 (375px)', value: 'mobile' },
              ]}
            />
          </Form.Item>
        </Space>
      </Card>

      <Card title="组件库设置" style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={handleImportComponent}>导入组件</Button>
          <Button onClick={handleExportComponent}>导出组件</Button>
        </Space>
      </Card>

      <Space>
        <Button type="primary" onClick={handleSaveSettings} loading={loading}>保存设置</Button>
        <Button onClick={() => message.info('设置未保存')}>取消</Button>
      </Space>
    </div>
  );
};

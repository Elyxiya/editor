import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import styles from './LoginPage.module.css';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { token, user } = await authService.login(values);
      authService.setAuth(token, user);
      message.success('登录成功');
      navigate('/projects');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { username: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const { token, user } = await authService.register(values);
      authService.setAuth(token, user);
      message.success('注册成功');
      navigate('/projects');
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>低代码平台</Title>
          <Text type="secondary">可视化页面搭建工具</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  name="login"
                  onFinish={handleLogin}
                  layout="vertical"
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名或邮箱' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="用户名或邮箱"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form
                  name="register"
                  onFinish={handleRegister}
                  layout="vertical"
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少3个字符' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="用户名"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="邮箱"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少6个字符' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

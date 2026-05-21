import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, theme, Button, Space, Avatar, Dropdown, message, Typography } from 'antd';
import { HomeOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { authService } from '@/services/auth';

const { Text } = Typography;
const { Header, Content } = Layout;

export const EditorLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'userInfo',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>{user?.username}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header style={{ padding: '0 16px', background: colorBgContainer, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Button type="text" icon={<HomeOutlined />} onClick={() => navigate('/projects')} style={{ fontSize: 16 }}>首页</Button>
        <div style={{ flex: 1 }} />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" style={{ height: 48, padding: '4px 12px' }}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.username || '用户'}</span>
            </Space>
          </Button>
        </Dropdown>
      </Header>
      <Content style={{ padding: 0, background: '#f5f5f5', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

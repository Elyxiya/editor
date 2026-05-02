import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, theme, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { authService } from '@/services/auth';

const { Header, Content } = Layout;

export const EditorLayout: React.FC = () => {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header style={{ padding: '0 16px', background: colorBgContainer, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Button type="text" icon={<HomeOutlined />} onClick={() => navigate('/projects')} style={{ fontSize: 16 }}>首页</Button>
        <div style={{ flex: 1 }} />
      </Header>
      <Content style={{ padding: 0, background: '#f5f5f5', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

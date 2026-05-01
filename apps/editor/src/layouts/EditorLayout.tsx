import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, theme } from 'antd';

const { Header, Content } = Layout;

export const EditorLayout: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header style={{ padding: '0 16px', background: colorBgContainer, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>低代码平台</div>
        <div style={{ flex: 1 }} />
      </Header>
      <Content style={{ padding: 0, background: '#f5f5f5', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

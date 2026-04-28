import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, theme } from 'antd';

const { Header, Sider, Content } = Layout;

export const EditorLayout: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ padding: '0 16px', background: colorBgContainer, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>低代码平台</div>
        <div style={{ flex: 1 }} />
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
          {/* 组件库面板 */}
        </Sider>
        <Content style={{ padding: 0, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

import React from 'react';
import { Card, List, Button, Empty, Input, Space, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './ProjectListPage.module.css';

const { Title, Text } = Typography;

const mockProjects = [
  { id: '1', name: '企业内部管理系统', description: '用于企业内部办公管理', pageCount: 12, updatedAt: '2026-04-20' },
  { id: '2', name: '客户关系管理系统', description: 'CRM 客户管理', pageCount: 8, updatedAt: '2026-04-18' },
  { id: '3', name: '订单管理系统', description: '订单处理与跟踪', pageCount: 5, updatedAt: '2026-04-15' },
];

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/editor/new');
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/editor?project=${projectId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>我的项目</Title>
          <Text type="secondary">管理您的低代码项目</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
          新建项目
        </Button>
      </div>

      <Input
        placeholder="搜索项目..."
        prefix={<SearchOutlined />}
        style={{ width: 300, marginBottom: 24 }}
      />

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
        dataSource={mockProjects}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              onClick={() => handleOpenProject(item.id)}
              cover={
                <div className={styles.cardCover}>
                  <div className={styles.cardIcon}>LC</div>
                </div>
              }
            >
              <Card.Meta
                title={item.name}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" ellipsis={{ rows: 2 }}>
                      {item.description}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.pageCount} 个页面 · 更新于 {item.updatedAt}
                    </Text>
                  </Space>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      {mockProjects.length === 0 && (
        <Empty
          description="暂无项目"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={handleCreateProject}>
            创建第一个项目
          </Button>
        </Empty>
      )}
    </div>
  );
};

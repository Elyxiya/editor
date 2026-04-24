import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { PageRenderer } from './components/PageRenderer';
import type { PageSchema } from '@lowcode/types';

const App: React.FC = () => {
  const [schema, setSchema] = useState<PageSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get('page');

    if (pageId) {
      loadPage(pageId);
    } else {
      const demoSchema: PageSchema = {
        version: '1.0.0',
        page: {
          title: '演示页面',
          layout: 'flex',
          props: { padding: 16, background: '#ffffff' },
          components: [
            {
              id: 'demo-1',
              type: 'Text',
              label: '标题',
              props: { content: '欢迎使用低代码平台', level: 1 },
            },
            {
              id: 'demo-2',
              type: 'Button',
              label: '按钮',
              props: { text: '点击我', type: 'primary' },
            },
          ],
        },
        dataSources: {},
        logic: {},
      };
      setSchema(demoSchema);
      setLoading(false);
    }
  }, []);

  const loadPage = async (id: string) => {
    try {
      const res = await fetch(`/api/pages/${id}`);
      if (!res.ok) throw new Error('Failed to load page');
      const data = await res.json();
      setSchema(data.data.schema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ff4d4f' }}>
        加载失败: {error}
      </div>
    );
  }

  if (!schema) return null;

  return <PageRenderer schema={schema} />;
};

export default App;

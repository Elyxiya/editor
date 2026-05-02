import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { PageRenderer } from './components/PageRenderer';
import type { PageSchema } from '@lowcode/types';

const DEMO_SCHEMA: PageSchema = {
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

interface PageLoaderProps {
  schemaParam?: string;
  pageIdParam?: string;
  previewMode?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({ schemaParam, pageIdParam, previewMode }) => {
  const [schema, setSchema] = useState<PageSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFromUrl = useCallback(async (schemaP: string | undefined, pageIdP: string | undefined) => {
    setLoading(true);
    setError(null);

    try {
      // Priority 1: schema from URL parameter (editor inline preview)
      if (schemaP) {
        try {
          const decoded = decodeURIComponent(schemaP);
          const parsed = JSON.parse(decoded) as PageSchema;
          setSchema(parsed);
        } catch {
          try {
            const decoded = atob(schemaP);
            const parsed = JSON.parse(decoded) as PageSchema;
            setSchema(parsed);
          } catch {
            setError('Schema 解析失败，请检查链接是否有效');
          }
        }
        setLoading(false);
        return;
      }

      // Priority 2: pageId from URL (load published page)
      if (pageIdP) {
        const res = await fetch(`/api/pages/${pageIdP}`);
        if (!res.ok) throw new Error(`页面加载失败 (${res.status})`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || '加载失败');
        setSchema(data.data.schema as PageSchema);
        setLoading(false);
        return;
      }

      // Priority 3: preview mode → wait for postMessage from editor
      if (previewMode) {
        setLoading(false);
        return;
      }

      // Priority 4: load demo schema
      setSchema(DEMO_SCHEMA);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setLoading(false);
    }
  }, [previewMode]);

  // Load data when URL params change
  useEffect(() => {
    loadFromUrl(schemaParam, pageIdParam);
  }, [loadFromUrl, schemaParam, pageIdParam]);

  // Listen for schema sent via postMessage from editor's PreviewPanel
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'preview-schema' && event.data.schema) {
        setSchema(event.data.schema as PageSchema);
        setLoading(false);
        setError(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip={previewMode ? '等待编辑器数据...' : '加载页面数据...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            previewMode ? (
              <Button type="primary" onClick={() => window.location.reload()}>
                重试
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (!schema) return null;

  return <PageRenderer schema={schema} />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageLoader
            pageIdParam={undefined}
            schemaParam={undefined}
            previewMode={false}
          />
        }
      />
      <Route
        path="/preview"
        element={<PreviewPage />}
      />
    </Routes>
  );
};

const PreviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const schemaParam = searchParams.get('schema') || undefined;
  const pageIdParam = searchParams.get('pageId') || undefined;
  const previewMode = searchParams.get('previewMode') === 'true';

  return (
    <PageLoader
      schemaParam={schemaParam}
      pageIdParam={pageIdParam}
      previewMode={previewMode}
    />
  );
};

export default App;

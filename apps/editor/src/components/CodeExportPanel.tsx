/**
 * 代码导出面板 - Code Export Panel
 * 显示生成的代码并允许用户复制和下载
 */

import React, { useState, useMemo } from 'react';
import { Modal, Button, message, Empty, Collapse, Typography, Space, Tag } from 'antd';
import {
  CopyOutlined, DownloadOutlined, FileTextOutlined, BranchesOutlined,
  CheckOutlined, FileZipOutlined
} from '@ant-design/icons';
import type { PageSchema, Page } from '@lowcode/types';
import { generateCode, type CodeGenOptions } from '@lowcode/codegen';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface CodeExportPanelProps {
  open: boolean;
  onClose: () => void;
  schema: PageSchema;
  page: Page;
}

interface GeneratedFile {
  path: string;
  content: string;
  language: 'tsx' | 'ts' | 'css' | 'json' | 'md' | 'html';
}

export const CodeExportPanel: React.FC<CodeExportPanelProps> = ({
  open,
  onClose,
  schema,
  page
}) => {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // 生成代码
  const codeResult = useMemo(() => {
    const pageName = page.name || page.title || 'page';
    const codegenOptions: CodeGenOptions = {
      projectName: page.title || 'exported-project',
      pageName: pageName,
      useTypeScript: true,
      useCSSModules: false,
      useTailwind: false
    };

    return generateCode(schema, codegenOptions);
  }, [schema, page]);

  const files: GeneratedFile[] = codeResult.files;
  const mainFile = files.find(f => f.path.endsWith('.tsx') && f.path.includes('/pages/'));
  const configFiles = files.filter(f => ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html'].includes(f.path.split('/').pop() || ''));
  const styleFiles = files.filter(f => f.path.endsWith('.css'));

  // 复制代码到剪贴板
  const handleCopy = async (file: GeneratedFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedFile(file.path);
      message.success('代码已复制到剪贴板');
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      message.error('复制失败，请手动选择代码复制');
    }
  };

  // 下载单个文件
  const handleDownloadFile = (file: GeneratedFile) => {
    const filename = file.path.split('/').pop() || 'file.txt';
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 下载所有代码为 ZIP 包
  const handleDownloadBundle = async () => {
    try {
      const zip = new JSZip();
      const folder = zip.folder(page.name || 'exported-page') || zip;

      files.forEach((file) => {
        folder.file(file.path, file.content);
      });

      // 添加说明文件
      const readme = `# ${page.title || '导出页面'} - 代码包说明

> 由低代码平台自动生成
> 生成时间: ${new Date().toISOString()}

## 包含文件

${files.map((f) => `- \`${f.path}\``).join('\n')}

## 使用方法

1. 解压此 ZIP 文件
2. 进入解压后的目录
3. 执行 \`npm install\` 安装依赖
4. 执行 \`npm run dev\` 启动开发服务器

## 技术栈

- React 18 + TypeScript
- Ant Design 5
- Vite

---
低代码平台 | Low-Code Platform
`;
      folder.file('README.md', readme);

      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `${(page.name || 'page').toLowerCase()}-export.zip`;
      saveAs(content, filename);
      message.success('代码包已下载为 ZIP 格式');
    } catch {
      message.error('下载失败，请重试');
    }
  };

  // 获取语言标签颜色
  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      tsx: 'blue',
      ts: 'cyan',
      css: 'green',
      json: 'orange',
      md: 'purple',
      html: 'red'
    };
    return colors[lang] || 'default';
  };

  // 获取文件图标
  const getFileIcon = (path: string) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) return <FileTextOutlined />;
    if (path.endsWith('.css')) return <BranchesOutlined />;
    if (path.endsWith('.json')) return <FileTextOutlined />;
    if (path.endsWith('.md')) return <FileTextOutlined />;
    return <FileTextOutlined />;
  };

  const renderFileContent = (file: GeneratedFile) => {
    const isCopied = copiedFile === file.path;

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 文件头部 */}
        <div style={{
          padding: '8px 12px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space>
            {getFileIcon(file.path)}
            <Text strong style={{ fontSize: 13 }}>{file.path.split('/').pop()}</Text>
            <Tag color={getLanguageColor(file.language)}>{file.language.toUpperCase()}</Tag>
          </Space>
          <Space>
            <Button
              size="small"
              icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopy(file)}
              type={isCopied ? 'primary' : 'default'}
            >
              {isCopied ? '已复制' : '复制'}
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadFile(file)}>
              下载
            </Button>
          </Space>
        </div>

        {/* 代码内容 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: '#1e1e1e',
          padding: 16,
          margin: 0
        }}>
          <pre style={{
            margin: 0,
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            fontSize: 12,
            lineHeight: 1.6,
            color: '#d4d4d4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {file.content}
          </pre>
        </div>
      </div>
    );
  };

  const fileListItems = files.map((file) => {
    const isActive = activeFile === file.path;
    const isMain = file.path === mainFile?.path;

    return (
      <div
        key={file.path}
        onClick={() => setActiveFile(file.path)}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          background: isActive ? '#e6f7ff' : 'transparent',
          borderLeft: isMain ? '3px solid #1677ff' : '3px solid transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }}
      >
        {getFileIcon(file.path)}
        <Text style={{
          fontSize: 12,
          color: isActive ? '#1677ff' : '#333',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {file.path}
        </Text>
        {isMain && <Tag color="blue" style={{ fontSize: 10 }}>入口</Tag>}
        <Tag color={getLanguageColor(file.language)} style={{ fontSize: 10 }}>
          {file.language}
        </Tag>
      </div>
    );
  });

  return (
    <Modal
      title={
        <Space>
          <FileZipOutlined />
          <span>导出代码 - {page.title}</span>
          <Tag color="green">{files.length} 个文件</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadBundle}
          >
            下载完整代码包
          </Button>
        </Space>
      }
      width={1100}
      style={{ top: 20 }}
      styles={{ body: { padding: 0, height: '70vh' } }}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* 左侧文件列表 */}
        <div style={{
          width: 280,
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
          background: '#fafafa'
        }}>
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #f0f0f0' }}>
            <Paragraph type="secondary" style={{ marginBottom: 4, fontSize: 12 }}>
              文件列表
            </Paragraph>
            <Space wrap size={[4, 4]}>
              <Tag>TypeScript: {files.filter(f => f.language === 'tsx' || f.language === 'ts').length}</Tag>
              <Tag>Config: {configFiles.length}</Tag>
              <Tag>Styles: {styleFiles.length}</Tag>
            </Space>
          </div>

          <Collapse
            defaultActiveKey={['pages', 'configs', 'styles', 'docs']}
            ghost
            size="small"
          >
            <Panel header="页面组件" key="pages" style={{ padding: 0 }}>
              {fileListItems.filter((_, i) =>
                files[i].path.includes('/pages/')
              )}
            </Panel>
            <Panel header="配置文件" key="configs">
              {fileListItems.filter((_, i) =>
                ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html'].includes(
                  files[i].path.split('/').pop() || ''
                )
              )}
            </Panel>
            <Panel header="样式文件" key="styles">
              {fileListItems.filter((_, i) =>
                files[i].language === 'css'
              )}
            </Panel>
            <Panel header="文档" key="docs">
              {fileListItems.filter((_, i) =>
                files[i].language === 'md'
              )}
            </Panel>
          </Collapse>
        </div>

        {/* 右侧代码预览 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeFile ? (
            renderFileContent(files.find(f => f.path === activeFile)!)
          ) : mainFile ? (
            renderFileContent(mainFile)
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="选择一个文件查看代码"
              style={{ margin: 'auto' }}
            />
          )}
        </div>
      </div>

      {/* 底部说明 */}
      <div style={{
        padding: '12px 16px',
        background: '#f6f8fa',
        borderTop: '1px solid #f0f0f0',
        fontSize: 12,
        color: '#666'
      }}>
        <Space split={<span style={{ color: '#ddd' }}>|</span>}>
          <span>共 {files.length} 个文件</span>
          <span>入口文件: {mainFile?.path}</span>
          <span>生成时间: {new Date().toLocaleString()}</span>
        </Space>
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 11 }}>
          提示: 点击"下载完整代码包"可获取包含所有文件的 JSON 包，其中包含了完整的使用说明。
          导出的代码基于 React + TypeScript + Ant Design 5，可直接在 Vite 项目中使用。
        </Paragraph>
      </div>
    </Modal>
  );
};

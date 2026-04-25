/**
 * 版本历史面板 - Version History Panel
 * 显示页面版本历史，支持版本对比和回滚
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Timeline, Button, Space, Tag, Typography, Empty, message,
  Popconfirm, Divider, Card, Descriptions, Badge, Tooltip
} from 'antd';
import {
  HistoryOutlined, RollbackOutlined, EyeOutlined, CopyOutlined,
  SaveOutlined, ArrowUpOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import type { PageSchema, Page } from '@lowcode/types';
import { getPageVersions, rollbackPage, getPageVersion, type PageVersion } from '@/services/page';

const { Text, Paragraph, Title } = Typography;

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  page: Page;
  onRollback: (schema: PageSchema, version: number) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  open,
  onClose,
  page,
  onRollback
}) => {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingVersion, setRollingVersion] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // 加载版本历史
  useEffect(() => {
    if (open && page.id) {
      loadVersions();
    }
  }, [open, page.id]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await getPageVersions(page.id);
      setVersions(data.sort((a, b) => b.version - a.version));
    } catch (error) {
      message.error('加载版本历史失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 查看版本详情
  const handleViewVersion = async (version: PageVersion) => {
    try {
      const fullVersion = await getPageVersion(page.id, version.version);
      if (fullVersion) {
        setSelectedVersion(fullVersion);
        setPreviewMode(true);
      }
    } catch {
      message.error('加载版本详情失败');
    }
  };

  // 回滚到指定版本
  const handleRollback = async (version: PageVersion) => {
    setRollingVersion(version.version);
    try {
      const result = await rollbackPage(page.id, version.version);
      message.success(result.message);
      setVersions(prev => [{
        ...prev[0],
        comment: '当前版本'
      }, {
        version: result.data.version,
        schema: JSON.stringify(result.data.schema),
        createdAt: new Date().toISOString(),
        comment: '回滚目标版本'
      }, ...prev.slice(1)]);
      // 通知父组件更新
      const schema = JSON.parse(versions.find(v => v.version === version.version)?.schema || '{}');
      onRollback(result.data.schema, result.data.version);
    } catch {
      message.error('回滚失败');
    } finally {
      setRollingVersion(null);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取版本标签类型
  const getVersionTagType = (version: PageVersion, index: number): 'success' | 'warning' | 'normal' => {
    if (index === 0) return 'success';  // 最新版本
    if (version.comment?.includes('回滚')) return 'warning';
    return 'normal';
  };

  // 预览版本内容
  const renderVersionPreview = () => {
    if (!selectedVersion) return null;

    let schema: PageSchema;
    try {
      schema = JSON.parse(selectedVersion.schema);
    } catch {
      return <Text type="danger">版本数据解析失败</Text>;
    }

    const componentCount = countComponents(schema.page.components);
    const componentTypes = getComponentTypes(schema.page.components);

    return (
      <div>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="版本号">v{selectedVersion.version}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="组件数量">{componentCount}</Descriptions.Item>
          <Descriptions.Item label="页面标题">{schema.page.title}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">组件列表</Divider>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {componentTypes.map((type, i) => (
            <Tag key={i} color="blue">{type}</Tag>
          ))}
          {componentTypes.length === 0 && <Text type="secondary">无组件</Text>}
        </div>

        <Divider orientation="left">Schema 预览</Divider>

        <div style={{
          background: '#fafafa',
          padding: 12,
          borderRadius: 4,
          maxHeight: 300,
          overflow: 'auto'
        }}>
          <pre style={{
            margin: 0,
            fontSize: 11,
            fontFamily: 'Monaco, Menlo, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // 统计组件数量
  const countComponents = (components: any[]): number => {
    let count = 0;
    const traverse = (list: any[]) => {
      list.forEach(comp => {
        count++;
        if (comp.children) traverse(comp.children);
      });
    };
    traverse(components);
    return count;
  };

  // 获取组件类型列表
  const getComponentTypes = (components: any[]): string[] => {
    const types = new Set<string>();
    const traverse = (list: any[]) => {
      list.forEach(comp => {
        types.add(comp.type);
        if (comp.children) traverse(comp.children);
      });
    };
    traverse(components);
    return Array.from(types);
  };

  // 关闭预览模式
  const handleClosePreview = () => {
    setPreviewMode(false);
    setSelectedVersion(null);
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>版本历史 - {page.title}</span>
          <Tag color="blue">当前 v{page.version}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      styles={{ body: { padding: 0, maxHeight: '70vh', overflow: 'auto' } }}
    >
      {previewMode && selectedVersion ? (
        // 预览模式
        <div style={{ padding: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Title level={5} style={{ margin: 0 }}>
              版本 {selectedVersion.version} 详情
            </Title>
            <Button onClick={handleClosePreview}>返回列表</Button>
          </div>
          {renderVersionPreview()}
        </div>
      ) : (
        // 版本列表模式
        <div style={{ padding: '16px 24px' }}>
          {/* 统计信息 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space size="large">
              <div>
                <Text type="secondary">历史版本</Text>
                <Title level={4} style={{ margin: 0 }}>{versions.length}</Title>
              </div>
              <Divider type="vertical" style={{ height: 40 }} />
              <div>
                <Text type="secondary">当前版本</Text>
                <Title level={4} style={{ margin: 0 }}>v{page.version}</Title>
              </div>
            </Space>
          </Card>

          {/* 版本列表 */}
          {versions.length > 0 ? (
            <Timeline
              mode="left"
              items={versions.map((version, index) => ({
                color: index === 0 ? 'green' : 'blue',
                dot: index === 0 ? <Badge status="success" /> : <Badge status="processing" />,
                children: (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 0,
                      borderColor: index === 0 ? '#52c41a' : undefined,
                      background: index === 0 ? '#f6ffed' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Space>
                          <Text strong>v{version.version}</Text>
                          {index === 0 && <Tag color="success">最新</Tag>}
                          {version.comment?.includes('回滚') && <Tag color="warning">回滚</Tag>}
                        </Space>
                        <Paragraph type="secondary" style={{ marginBottom: 4, marginTop: 4, fontSize: 12 }}>
                          {version.comment || `版本 ${version.version}`}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatTime(version.createdAt)}
                        </Text>
                      </div>
                      <Space>
                        <Tooltip title="查看版本详情">
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewVersion(version)}
                          />
                        </Tooltip>
                        {index !== 0 && (
                          <Popconfirm
                            title="确认回滚"
                            description={
                              <span>
                                确定要回滚到 v{version.version} 吗？<br />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  回滚前会保存当前版本作为备份
                                </Text>
                              </span>
                            }
                            onConfirm={() => handleRollback(version)}
                            okText="确认回滚"
                            cancelText="取消"
                          >
                            <Button
                              size="small"
                              type="primary"
                              icon={<RollbackOutlined />}
                              loading={rollingVersion === version.version}
                            >
                              回滚
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                  </Card>
                )
              }))}
            />
          ) : (
            <Empty
              description={
                loading ? '加载中...' : '暂无版本历史'
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}

          {/* 说明 */}
          <Divider />
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              每次保存页面都会自动创建一个新版本。版本历史最多保存 50 个版本。
              回滚操作会保留当前版本作为备份，您可以根据需要随时回滚到任意历史版本。
            </Text>
          </Paragraph>
        </div>
      )}
    </Modal>
  );
};

// 补充图标
const InfoCircleOutlined: React.FC<{ style?: React.CSSProperties }> = (props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 1024 1024"
    fill="currentColor"
    style={{ verticalAlign: 'middle', ...props.style }}
  >
    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-204.2 0-372-167.8-372-372s167.8-372 372-372 372 167.8 372 372-167.8 372-372 372zm-32-604h64c9.4 0 17 7.6 17 17s-7.6 17-17 17H480c-9.4 0-17-7.6-17-17s7.6-17 17-17zm24 312h-32c-9.4 0-17-7.6-17-17s7.6-17 17-17h32c9.4 0 17 7.6 17 17s-7.6 17-17 17z" />
  </svg>
);

/**
 * Page Management Panel
 *
 * 多页面管理面板 - 创建、切换、重命名、删除页面
 */

import React, { useState, useCallback } from 'react';
import {
  Modal, Button, Space, Tag, Typography, Input, Dropdown, Empty,
  message, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined,
  MoreOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, EyeOutlined,
} from '@ant-design/icons';

interface PageItem {
  id: string;
  title: string;
  name: string;
  version: number;
  isPublished: boolean;
  updatedAt: string;
}

const { Text, Paragraph } = Typography;

interface PageManagementPanelProps {
  open: boolean;
  onClose: () => void;
  pages: PageItem[];
  currentPageId: string | null;
  onSwitchPage: (pageId: string) => void;
  onCreatePage: (title: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onDeletePage: (pageId: string) => void;
  onDuplicatePage: (pageId: string) => void;
}

export const PageManagementPanel: React.FC<PageManagementPanelProps> = ({
  open,
  onClose,
  pages,
  currentPageId,
  onSwitchPage,
  onCreatePage,
  onRenamePage,
  onDeletePage,
  onDuplicatePage,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');

  const handleAddPage = useCallback(() => {
    setNewPageTitle('新页面');
    setModalOpen(true);
  }, []);

  const handleConfirmAdd = useCallback(() => {
    if (!newPageTitle.trim()) {
      message.warning('请输入页面名称');
      return;
    }
    onCreatePage(newPageTitle.trim());
    setModalOpen(false);
    setNewPageTitle('');
  }, [newPageTitle, onCreatePage]);

  const handleStartRename = useCallback((page: PageItem) => {
    setEditingId(page.id);
    setEditingTitle(page.title);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (!editingId || !editingTitle.trim()) return;
    onRenamePage(editingId, editingTitle.trim());
    setEditingId(null);
    setEditingTitle('');
  }, [editingId, editingTitle, onRenamePage]);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditingTitle('');
  }, []);

  const handleDelete = useCallback((pageId: string) => {
    if (pages.length <= 1) {
      message.warning('至少保留一个页面');
      return;
    }
    onDeletePage(pageId);
  }, [pages.length, onDeletePage]);

  const getMenuItems = (page: PageItem) => [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: () => handleStartRename(page),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: '复制页面',
      onClick: () => onDuplicatePage(page.id),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      disabled: pages.length <= 1,
      onClick: () => handleDelete(page.id),
    },
  ];

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>页面管理</span>
            <Tag color="blue">{pages.length} 个页面</Tag>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={
          <Space>
            <Button onClick={onClose}>关闭</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPage}>
              新建页面
            </Button>
          </Space>
        }
        width={700}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {pages.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无页面，点击新建页面开始"
              style={{ padding: 40 }}
            />
          ) : (
            <div style={{ padding: '8px 0' }}>
              {pages.map((page) => (
                <div
                  key={page.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    margin: '0 8px 4px',
                    borderRadius: 8,
                    background: currentPageId === page.id ? '#e6f7ff' : 'transparent',
                    border: `1px solid ${currentPageId === page.id ? '#1677ff' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => onSwitchPage(page.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === page.id ? (
                      <Space>
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onPressEnter={handleConfirmRename}
                          autoFocus
                          size="small"
                          style={{ width: 200 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<CheckOutlined />}
                          onClick={(e) => { e.stopPropagation(); handleConfirmRename(); }}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={(e) => { e.stopPropagation(); handleCancelRename(); }}
                        />
                      </Space>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text
                            strong={currentPageId === page.id}
                            style={{
                              fontSize: 14,
                              color: currentPageId === page.id ? '#1677ff' : '#333',
                            }}
                          >
                            {page.title}
                          </Text>
                          {page.isPublished && (
                            <Tag color="green" style={{ fontSize: 10 }}>已发布</Tag>
                          )}
                          {currentPageId === page.id && (
                            <Tag color="blue" style={{ fontSize: 10 }}>当前</Tag>
                          )}
                        </div>
                        <Space size={12} style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            v{page.version}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatTime(page.updatedAt)}
                          </Text>
                        </Space>
                      </>
                    )}
                  </div>

                  <Space onClick={(e) => e.stopPropagation()}>
                    {editingId !== page.id && (
                      <>
                        <Button
                          size="small"
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => onSwitchPage(page.id)}
                          title="预览"
                        />
                        <Dropdown menu={{ items: getMenuItems(page) }} trigger={['click']}>
                          <Button size="small" type="text" icon={<MoreOutlined />} />
                        </Dropdown>
                      </>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ padding: '0 16px 8px' }}>
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
            提示：点击页面名称可直接进入编辑。双击可重命名。删除页面会同时删除其所有历史版本。
          </Paragraph>
        </div>
      </Modal>

      {/* 新建页面弹窗 */}
      <Modal
        title="新建页面"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setNewPageTitle(''); }}
        onOk={handleConfirmAdd}
        okText="创建"
        cancelText="取消"
        width={400}
      >
        <div style={{ padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            请输入页面名称
          </Text>
          <Input
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onPressEnter={handleConfirmAdd}
            placeholder="例如：首页、商品详情"
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
};

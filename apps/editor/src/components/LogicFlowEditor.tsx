/**
 * Logic Flow Editor
 * 
 * 逻辑流程编辑器 - 可视化编辑逻辑流程
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Button, Space, Tag, Empty, Tooltip, Input, Select, Typography, Divider } from 'antd';
import { ThunderboltOutlined, PlayCircleOutlined, DatabaseOutlined, BranchesOutlined } from '@ant-design/icons';
import type { LogicFlow, LogicNode } from '@lowcode/logic-engine';
import {
  createFlowBuilder,
  createTriggerNode,
  createActionNode,
  createLogicNode,
  createDataNode,
  validateFlow,
  autoLayoutFlow
} from '@lowcode/logic-engine';
import { nodeRegistry, NODE_CATEGORIES } from '@lowcode/logic-engine';

const { Text } = Typography;

// ============================================================
// 类型定义
// ============================================================

interface LogicFlowEditorProps {
  open: boolean;
  onClose: () => void;
  flow?: LogicFlow;
  onSave: (flow: LogicFlow) => void;
}

// ============================================================
// 节点颜色映射
// ============================================================

const NODE_COLORS: Record<string, string> = {
  trigger: '#1890ff',
  action: '#52c41a',
  logic: '#faad14',
  data: '#722ed1',
};

// ============================================================
// 组件实现
// ============================================================

export const LogicFlowEditor: React.FC<LogicFlowEditorProps> = ({
  open,
  onClose,
  flow,
  onSave,
}) => {
  const [currentFlow, setCurrentFlow] = useState<LogicFlow>(() => 
    flow || createFlowBuilder({
      name: '新流程',
      trigger: '',
      nodes: [],
      connections: [],
    }).build()
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 选中的节点
  const selectedNode = useMemo(() => 
    currentFlow.nodes.find(n => n.id === selectedNodeId),
    [currentFlow.nodes, selectedNodeId]
  );

  // 添加节点
  const handleAddNode = useCallback((type: string, category: string) => {
    let node: LogicNode;
    
    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    };

    switch (category) {
      case 'trigger':
        node = createTriggerNode(type as any, position);
        break;
      case 'action':
        node = createActionNode(type as any, {}, position);
        break;
      case 'logic':
        node = createLogicNode(type as any, {}, position);
        break;
      case 'data':
        node = createDataNode(type as any, {}, position);
        break;
      default:
        return;
    }

    setCurrentFlow(prev => createFlowBuilder(prev).addNode(node).build());
    setSelectedNodeId(node.id);
  }, []);

  // 删除节点
  const handleDeleteNode = useCallback((nodeId: string) => {
    setCurrentFlow(prev => createFlowBuilder(prev).removeNode(nodeId).build());
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  // 更新节点配置
  const handleUpdateNodeConfig = useCallback((nodeId: string, params: Record<string, unknown>) => {
    setCurrentFlow(prev => 
      createFlowBuilder(prev)
        .updateNode(nodeId, {
          config: {
            ...prev.nodes.find(n => n.id === nodeId)?.config,
            params: {
              ...prev.nodes.find(n => n.id === nodeId)?.config.params,
              ...params,
            },
          },
        })
        .build()
    );
  }, []);

  // 更新节点标签
  const handleUpdateNodeLabel = useCallback((nodeId: string, label: string) => {
    setCurrentFlow(prev => createFlowBuilder(prev).updateNode(nodeId, { label }).build());
  }, []);

  // 自动布局
  const handleAutoLayout = useCallback(() => {
    setCurrentFlow(prev => autoLayoutFlow(prev, 'vertical'));
  }, []);

  // 复制节点
  const handleDuplicateNode = useCallback((nodeId: string) => {
    const node = currentFlow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newNode = {
      ...node,
      id: `node_${Date.now()}`,
      position: {
        x: (node.position?.x || 0) + 50,
        y: (node.position?.y || 0) + 50,
      },
    };

    setCurrentFlow(prev => createFlowBuilder(prev).addNode(newNode).build());
  }, [currentFlow.nodes]);

  // 保存流程
  const handleSave = useCallback(() => {
    const validation = validateFlow(currentFlow);
    if (!validation.valid) {
      console.warn('Flow validation failed:', validation.errors);
    }
    onSave(currentFlow);
    onClose();
  }, [currentFlow, onSave, onClose]);

  // 渲染节点库
  const renderNodePalette = () => {
    const filteredCategories = NODE_CATEGORIES.map(cat => {
      const nodes = nodeRegistry.getByCategory(cat.key);
      const filteredNodes = searchTerm
        ? nodes.filter(n => 
            n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.type.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : nodes;

      return { ...cat, nodes: filteredNodes };
    }).filter(cat => cat.nodes.length > 0);

    return (
      <div style={{ width: 240, borderRight: '1px solid #f0f0f0', padding: 12 }}>
        <Input
          placeholder="搜索节点..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />

        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
          {filteredCategories.map(cat => (
            <div key={cat.key} style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                marginBottom: 8,
                color: cat.color,
                fontWeight: 500,
                fontSize: 12,
              }}>
                {cat.key === 'trigger' && <ThunderboltOutlined />}
                {cat.key === 'action' && <PlayCircleOutlined />}
                {cat.key === 'logic' && <BranchesOutlined />}
                {cat.key === 'data' && <DatabaseOutlined />}
                {cat.label}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cat.nodes.map(node => (
                  <Tooltip key={node.type} title={node.description || node.label}>
                    <Button
                      size="small"
                      onClick={() => handleAddNode(node.type, cat.key)}
                      style={{
                        borderColor: cat.color,
                        color: cat.color,
                      }}
                    >
                      {node.label}
                    </Button>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染流程画布
  const renderCanvas = () => {
    return (
      <div style={{ 
        flex: 1, 
        background: '#fafafa',
        position: 'relative',
        minHeight: 400,
      }}>
        {currentFlow.nodes.length === 0 ? (
          <Empty
            description="从左侧拖拽节点到此处"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        ) : (
          <div style={{ 
            padding: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignContent: 'flex-start',
          }}>
            {currentFlow.nodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => setSelectedNodeId(node.id)}
                onDelete={() => handleDeleteNode(node.id)}
                onDuplicate={() => handleDuplicateNode(node.id)}
              />
            ))}
          </div>
        )}

        {/* 连接线显示 */}
        {currentFlow.connections.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'white',
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #f0f0f0',
            fontSize: 12,
          }}>
            <Space>
              <Text type="secondary">连接线:</Text>
              <Tag>{currentFlow.connections.length} 条</Tag>
            </Space>
          </div>
        )}
      </div>
    );
  };

  // 渲染属性面板
  const renderPropertyPanel = () => {
    if (!selectedNode) {
      return (
        <div style={{ 
          width: 280, 
          borderLeft: '1px solid #f0f0f0', 
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text type="secondary">选择一个节点查看属性</Text>
        </div>
      );
    }

    const definition = nodeRegistry.get(selectedNode.type as any);

    return (
      <div style={{ width: 280, borderLeft: '1px solid #f0f0f0', padding: 16, overflow: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>节点属性</Text>
          <Tag color={NODE_COLORS[selectedNode.category]}>
            {definition?.label || selectedNode.type}
          </Tag>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            节点名称
          </Text>
          <Input
            value={selectedNode.label}
            onChange={e => handleUpdateNodeLabel(selectedNode.id, e.target.value)}
            placeholder="输入节点名称"
          />
        </div>

        {definition?.description && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
              描述
            </Text>
            <Text>{definition.description}</Text>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            节点配置
          </Text>
          
          {selectedNode.type === 'callApi' && (
            <NodeConfigField
              label="API 地址"
              value={selectedNode.config.params?.url as string || ''}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { url: v })}
              placeholder="https://api.example.com/data"
            />
          )}

          {selectedNode.type === 'callApi' && (
            <NodeConfigField
              label="请求方法"
              value={selectedNode.config.params?.method as string || 'GET'}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { method: v })}
              options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']}
            />
          )}

          {selectedNode.type === 'showMessage' && (
            <NodeConfigField
              label="消息内容"
              value={selectedNode.config.params?.content as string || ''}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { content: v })}
              placeholder="输入消息内容"
            />
          )}

          {selectedNode.type === 'showMessage' && (
            <NodeConfigField
              label="消息类型"
              value={selectedNode.config.params?.type as string || 'info'}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { type: v })}
              options={['success', 'info', 'warning', 'error']}
            />
          )}

          {selectedNode.type === 'navigate' && (
            <NodeConfigField
              label="跳转路径"
              value={selectedNode.config.params?.path as string || ''}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { path: v })}
              placeholder="/page/home"
            />
          )}

          {selectedNode.type === 'condition' && (
            <NodeConfigField
              label="条件表达式"
              value={selectedNode.config.params?.expression as string || ''}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { expression: v })}
              placeholder="value > 0"
            />
          )}

          {selectedNode.type === 'setValue' && (
            <>
              <NodeConfigField
                label="变量名"
                value={selectedNode.config.params?.variableName as string || ''}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { variableName: v })}
                placeholder="myVariable"
              />
              <NodeConfigField
                label="变量值"
                value={selectedNode.config.params?.defaultValue as string || ''}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { defaultValue: v })}
                placeholder="初始值"
              />
            </>
          )}

          {selectedNode.type === 'delay' && (
            <NodeConfigField
              label="延迟时间 (ms)"
              value={String(selectedNode.config.params?.duration || 1000)}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { duration: parseInt(v) || 1000 })}
              placeholder="1000"
            />
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            节点 ID
          </Text>
          <Text code style={{ fontSize: 11 }}>{selectedNode.id}</Text>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined />
          <span>逻辑流程编辑器</span>
          <Tag>{currentFlow.name}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={1000}
      style={{ top: 20 }}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ display: 'flex', height: 500 }}>
        {renderNodePalette()}
        {renderCanvas()}
        {renderPropertyPanel()}
      </div>

      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Space>
          <Text type="secondary">
            共 {currentFlow.nodes.length} 个节点，{currentFlow.connections.length} 条连接线
          </Text>
        </Space>
        <Space>
          <Button size="small" onClick={handleAutoLayout}>
            自动布局
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

// ============================================================
// 辅助组件
// ============================================================

interface NodeCardProps {
  node: LogicNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}) => {
  const definition = nodeRegistry.get(node.type as any);

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px 16px',
        background: 'white',
        border: `2px solid ${isSelected ? '#1890ff' : '#e8e8e8'}`,
        borderRadius: 8,
        cursor: 'pointer',
        minWidth: 160,
        boxShadow: isSelected ? '0 2px 8px rgba(24,144,255,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: NODE_COLORS[node.category],
        }} />
        <Text strong style={{ fontSize: 13 }}>{node.label || definition?.label}</Text>
      </div>

      <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>
        {definition?.description || node.type}
      </div>

      {Object.keys(node.config.params || {}).length > 0 && (
        <div style={{ fontSize: 10, color: '#666' }}>
          {Object.entries(node.config.params || {}).slice(0, 2).map(([k, v]) => (
            <div key={k}>
              <Text type="secondary">{k}:</Text> {String(v).substring(0, 20)}
            </div>
          ))}
        </div>
      )}

      {isSelected && (
        <div style={{ 
          display: 'flex', 
          gap: 4, 
          marginTop: 8,
          borderTop: '1px solid #f0f0f0',
          paddingTop: 8,
        }}>
          <Button size="small" danger onClick={onDelete}>
            删除
          </Button>
          <Button size="small" onClick={onDuplicate}>
            复制
          </Button>
        </div>
      )}
    </div>
  );
};

interface NodeConfigFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: string[];
}

const NodeConfigField: React.FC<NodeConfigFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  options,
}) => (
  <div style={{ marginBottom: 12 }}>
    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
      {label}
    </Text>
    {options ? (
      <Select
        value={value}
        onChange={onChange}
        options={options.map(o => ({ label: o, value: o }))}
        style={{ width: '100%' }}
        size="small"
      />
    ) : (
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        size="small"
      />
    )}
  </div>
);

// ============================================================
// 导出
// ============================================================

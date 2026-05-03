/**
 * Logic Flow Editor
 *
 * 可视化逻辑流程编辑器 - 基于 React Flow 画布
 * 支持节点拖拽、SVG 连线、自动布局
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Modal, Button, Space, Tag, Empty, Tooltip, Input, Select, Typography, Divider, Popconfirm } from 'antd';
import { ThunderboltOutlined, PlayCircleOutlined, DatabaseOutlined, BranchesOutlined } from '@ant-design/icons';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { LogicFlow, LogicNode } from '@lowcode/logic-engine';
import {
  createFlowBuilder,
  createTriggerNode,
  createActionNode,
  createLogicNode,
  createDataNode,
  validateFlow,
  autoLayoutFlow,
} from '@lowcode/logic-engine';
import { nodeRegistry, NODE_CATEGORIES } from '@lowcode/logic-engine';

const { Text } = Typography;

// ============================================================
// 常量
// ============================================================

interface LogicFlowEditorProps {
  open: boolean;
  onClose: () => void;
  flow?: LogicFlow;
  onSave: (flow: LogicFlow) => void;
}

const NODE_COLORS: Record<string, string> = {
  trigger: '#1890ff',
  action: '#52c41a',
  logic: '#faad14',
  data: '#722ed1',
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

// ============================================================
// 工具函数
// ============================================================

function logicNodeToRFNode(node: LogicNode): Node {
  const def = nodeRegistry.get(node.type as any);
  return {
    id: node.id,
    type: 'logicNode',
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.label || def?.label || node.type,
      category: node.category,
      type: node.type,
      description: def?.description || '',
      config: node.config,
    },
    draggable: true,
  };
}

function rfNodeToLogicNode(rfNode: Node, original?: LogicNode): LogicNode {
  return {
    id: rfNode.id,
    type: rfNode.data.type as string,
    category: rfNode.data.category,
    label: rfNode.data.label,
    position: rfNode.position,
    config: rfNode.data.config || original?.config || {},
  };
}

function rfEdgeToConnection(edge: Edge) {
  return {
    from: edge.source,
    to: edge.target,
    fromPort: edge.sourceHandle || 'default',
    toPort: edge.targetHandle || 'default',
  };
}

// ============================================================
// 自定义节点组件
// ============================================================

interface LogicNodeData {
  label: string;
  category: string;
  type: string;
  description: string;
  config: Record<string, unknown>;
}

function LogicFlowNode({ data, selected }: { data: LogicNodeData; selected: boolean }) {
  const color = NODE_COLORS[data.category] || '#999';

  return (
    <div
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: '#fff',
        border: `2px solid ${selected ? color : '#e8e8e8'}`,
        borderRadius: 8,
        padding: '10px 12px',
        boxShadow: selected
          ? `0 0 0 2px ${color}33, 0 4px 12px rgba(0,0,0,0.15)`
          : '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8, border: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.label}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#999',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}
          >
            {data.description || data.type}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: 8, height: 8, border: 'none' }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  logicNode: LogicFlowNode,
};

// ============================================================
// 节点配置字段组件
// ============================================================

interface NodeConfigFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: string[];
}

function NodeConfigField({ label, value, onChange, placeholder, options }: NodeConfigFieldProps) {
  return (
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
}

// ============================================================
// 主组件
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

  const [searchTerm, setSearchTerm] = useState('');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 初始化 React Flow nodes/edges
  const initialNodes = useMemo(() =>
    currentFlow.nodes.map(logicNodeToRFNode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const initialEdges = useMemo(() =>
    currentFlow.connections.map(conn => ({
      id: `${conn.from}-${conn.fromPort}-${conn.to}-${conn.toPort}`,
      source: conn.from,
      sourceHandle: conn.fromPort,
      target: conn.to,
      targetHandle: conn.toPort,
      type: 'smoothstep',
      animated: true,
      style: { stroke: NODE_COLORS[currentFlow.nodes.find(n => n.id === conn.from)?.category || 'trigger'] || '#1890ff', strokeWidth: 2 },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 同步 nodes 变化回 flow
  const syncNodesToFlow = useCallback((updatedNodes: Node[]) => {
    setCurrentFlow(prev => {
      const logicNodes = updatedNodes.map(rfNode =>
        rfNodeToLogicNode(rfNode, prev.nodes.find(n => n.id === rfNode.id))
      );
      return createFlowBuilder(prev)
        .setNodes(logicNodes)
        .build();
    });
  }, []);

  const onNodesChangeHandler = useCallback((changes: any[]) => {
    onNodesChange(changes);
    // 位置变化后同步
    const positionChanges = changes.filter(c => c.type === 'position' && c.position);
    if (positionChanges.length > 0) {
      setTimeout(() => {
        setNodes(currentNodes => {
          syncNodesToFlow(currentNodes);
          return currentNodes;
        });
      }, 0);
    }
  }, [onNodesChange, setNodes, syncNodesToFlow]);

  const onEdgesChangeHandler = useCallback((changes: any[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // 连接
  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    const newConn = createConnection(params.source, params.target, {
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
    });
    setCurrentFlow(prev => {
      const existing = prev.connections.some(
        c => c.source === newConn.source && c.target === newConn.target
      );
      if (existing) return prev;
      return createFlowBuilder(prev)
        .addConnection(newConn)
        .build();
    });
    const rfEdgeId = `${params.source}-${params.sourceHandle || 'default'}-${params.target}-${params.targetHandle || 'default'}`;
    const sourceCategory = nodes.find(n => n.id === params.source)?.data.category || 'trigger';
    setEdges(eds => addEdge({
      ...params,
      id: rfEdgeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: NODE_COLORS[sourceCategory] || '#1890ff', strokeWidth: 2 },
    }, eds));
  }, [setEdges, nodes]);

  // 删除节点
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setCurrentFlow(prev =>
      createFlowBuilder(prev)
        .removeNode(nodeId)
        .build()
    );
  }, [setNodes, setEdges]);

  // 删除边
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    setCurrentFlow(prev => {
      const conn = prev.connections.find(
        c => `${c.source}-${c.sourceHandle || 'default'}-${c.target}-${c.targetHandle || 'default'}` === edgeId ||
             c.id === edgeId
      );
      if (!conn) return prev;
      return createFlowBuilder(prev)
        .removeConnection(conn.id)
        .build();
    });
  }, [setEdges]);

  // 添加节点
  const handleAddNode = useCallback((type: string, category: string) => {
    let node: LogicNode;
    const baseX = 100;
    const baseY = 50 + currentFlow.nodes.length * 100;

    switch (category) {
      case 'trigger':
        node = createTriggerNode(type as any, { x: baseX, y: baseY });
        break;
      case 'action':
        node = createActionNode(type as any, {}, { x: baseX, y: baseY });
        break;
      case 'logic':
        node = createLogicNode(type as any, {}, { x: baseX, y: baseY });
        break;
      case 'data':
        node = createDataNode(type as any, {}, { x: baseX, y: baseY });
        break;
      default:
        return;
    }

    const rfNode = logicNodeToRFNode(node);
    setNodes(nds => [...nds, rfNode]);
    setCurrentFlow(prev => createFlowBuilder(prev).addNode(node).build());
  }, [currentFlow.nodes.length, setNodes]);

  // 自动布局
  const handleAutoLayout = useCallback(() => {
    const layoutedFlow = autoLayoutFlow(currentFlow, 'vertical');
    setCurrentFlow(layoutedFlow);
    setNodes(layoutedFlow.nodes.map(logicNodeToRFNode));
    setEdges(eds => {
      return layoutedFlow.connections.map(conn => ({
        id: `${conn.from}-${conn.fromPort}-${conn.to}-${conn.toPort}`,
        source: conn.from,
        sourceHandle: conn.fromPort,
        target: conn.to,
        targetHandle: conn.toPort,
        type: 'smoothstep',
        animated: true,
        style: { stroke: NODE_COLORS[layoutedFlow.nodes.find(n => n.id === conn.from)?.category || 'trigger'] || '#1890ff', strokeWidth: 2 },
      }));
    });
  }, [currentFlow, setNodes, setEdges]);

  // 清空
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setCurrentFlow(prev => createFlowBuilder(prev).setNodes([]).setConnections([]).build());
  }, [setNodes, setEdges]);

  // 保存
  const handleSave = useCallback(() => {
    const validation = validateFlow(currentFlow);
    if (!validation.valid) {
      console.warn('Flow validation failed:', validation.errors);
    }
    onSave(currentFlow);
    onClose();
  }, [currentFlow, onSave, onClose]);

  // 选中的节点
  const selectedNode = useMemo(() => {
    const selected = nodes.find(n => {
      const el = document.querySelector(`[data-id="${n.id}"]`);
      return el?.getAttribute('aria-selected') === 'true';
    });
    return selected ? currentFlow.nodes.find(n => n.id === selected.id) : null;
  }, [nodes, currentFlow.nodes]);

  // 更新节点配置
  const handleUpdateNodeConfig = useCallback((nodeId: string, params: Record<string, unknown>) => {
    setNodes(nds =>
      nds.map(n => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          data: {
            ...n.data,
            config: {
              ...n.data.config,
              params: {
                ...((n.data.config as any)?.params || {}),
                ...params,
              },
            },
          },
        };
      })
    );
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
  }, [setNodes]);

  // 更新节点标签
  const handleUpdateNodeLabel = useCallback((nodeId: string, label: string) => {
    setNodes(nds =>
      nds.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, label } } : n))
    );
    setCurrentFlow(prev =>
      createFlowBuilder(prev).updateNode(nodeId, { label }).build()
    );
  }, [setNodes]);

  // 渲染节点面板
  const renderNodePalette = () => {
    const filteredCategories = NODE_CATEGORIES.map(cat => {
      const items = nodeRegistry.getByCategory(cat.key);
      const filtered = searchTerm
        ? items.filter(
            n =>
              n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              n.type.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : items;
      return { ...cat, nodes: filtered };
    }).filter(cat => cat.nodes.length > 0);

    return (
      <div style={{ width: 220, borderRight: '1px solid #f0f0f0', padding: 12, overflow: 'auto' }}>
        <Input
          placeholder="搜索节点..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
          size="small"
        />
        {filteredCategories.map(cat => (
          <div key={cat.key} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                color: cat.color,
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              {cat.key === 'trigger' && <ThunderboltOutlined />}
              {cat.key === 'action' && <PlayCircleOutlined />}
              {cat.key === 'logic' && <BranchesOutlined />}
              {cat.key === 'data' && <DatabaseOutlined />}
              {cat.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {cat.nodes.map(item => (
                <Tooltip key={item.type} title={item.description || item.label} placement="right">
                  <Button
                    size="small"
                    block
                    onClick={() => handleAddNode(item.type, cat.key)}
                    style={{
                      borderColor: cat.color,
                      color: cat.color,
                      textAlign: 'left',
                    }}
                  >
                    {item.label}
                  </Button>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染属性面板
  const renderPropertyPanel = () => {
    if (!selectedNode) {
      return (
        <div
          style={{
            width: 260,
            borderLeft: '1px solid #f0f0f0',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
          }}
        >
          <Text type="secondary" style={{ textAlign: 'center' }}>
            点击画布中的节点<br />查看和编辑属性
          </Text>
        </div>
      );
    }

    const definition = nodeRegistry.get(selectedNode.type as any);
    const nodeData = nodes.find(n => n.id === selectedNode.id)?.data as LogicNodeData;

    return (
      <div style={{ width: 260, borderLeft: '1px solid #f0f0f0', padding: 16, overflow: 'auto', background: '#fafafa' }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>节点属性</Text>
          <Tag color={NODE_COLORS[selectedNode.category]}>
            {definition?.label || selectedNode.type}
          </Tag>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            节点名称
          </Text>
          <Input
            value={nodeData?.label || ''}
            onChange={e => handleUpdateNodeLabel(selectedNode.id, e.target.value)}
            placeholder="输入节点名称"
            size="small"
          />
        </div>

        {definition?.description && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
              描述
            </Text>
            <Text style={{ fontSize: 12 }}>{definition.description}</Text>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            节点配置
          </Text>

          {selectedNode.type === 'callApi' && (
            <>
              <NodeConfigField
                label="API 地址"
                value={(selectedNode.config.params?.url as string) || ''}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { url: v })}
                placeholder="https://api.example.com/data"
              />
              <NodeConfigField
                label="请求方法"
                value={(selectedNode.config.params?.method as string) || 'GET'}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { method: v })}
                options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']}
              />
            </>
          )}

          {selectedNode.type === 'showMessage' && (
            <>
              <NodeConfigField
                label="消息内容"
                value={(selectedNode.config.params?.content as string) || ''}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { content: v })}
                placeholder="输入消息内容"
              />
              <NodeConfigField
                label="消息类型"
                value={(selectedNode.config.params?.type as string) || 'info'}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { type: v })}
                options={['success', 'info', 'warning', 'error']}
              />
            </>
          )}

          {selectedNode.type === 'navigate' && (
            <NodeConfigField
              label="跳转路径"
              value={(selectedNode.config.params?.path as string) || ''}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { path: v })}
              placeholder="/page/home"
            />
          )}

          {selectedNode.type === 'condition' && (
            <NodeConfigField
              label="条件表达式"
              value={(selectedNode.config.params?.expression as string) || ''}
              onChange={v => handleUpdateNodeConfig(selectedNode.id, { expression: v })}
              placeholder="value > 0"
            />
          )}

          {selectedNode.type === 'setValue' && (
            <>
              <NodeConfigField
                label="变量名"
                value={(selectedNode.config.params?.variableName as string) || ''}
                onChange={v => handleUpdateNodeConfig(selectedNode.id, { variableName: v })}
                placeholder="myVariable"
              />
              <NodeConfigField
                label="变量值"
                value={(selectedNode.config.params?.defaultValue as string) || ''}
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

        <div style={{ display: 'flex', gap: 8 }}>
          <Popconfirm
            title="确定删除此节点？"
            onConfirm={() => handleDeleteNode(selectedNode.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger block>
              删除节点
            </Button>
          </Popconfirm>
        </div>

        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>
            节点 ID
          </Text>
          <Text code style={{ fontSize: 10, wordBreak: 'break-all' }}>
            {selectedNode.id}
          </Text>
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
      width={1100}
      style={{ top: 20 }}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ display: 'flex', height: 520 }}>
        {renderNodePalette()}

        <div
          ref={reactFlowWrapper}
          style={{ flex: 1, position: 'relative' }}
        >
          {nodes.length === 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
                zIndex: 1,
              }}
            >
              <Empty
                description={
                  <span>
                    从左侧面板点击添加节点<br />
                    或拖拽节点右侧端口连接到其他节点
                  </span>
                }
              />
            </div>
          ) : null}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Backspace', 'Delete']}
            onEdgesDelete={(deletedEdges) => {
              deletedEdges.forEach(e => handleDeleteEdge(e.id));
            }}
            style={{ background: '#fafafa' }}
          >
            <Controls />
            <MiniMap
              nodeColor={(n) => NODE_COLORS[(n.data as LogicNodeData)?.category] || '#999'}
              maskColor="rgba(240, 240, 240, 0.8)"
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Panel position="top-right">
              <Space>
                <Button size="small" onClick={handleAutoLayout}>
                  自动布局
                </Button>
                <Popconfirm
                  title="确定清空所有节点？"
                  onConfirm={handleClear}
                  okText="清空"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger>
                    清空
                  </Button>
                </Popconfirm>
              </Space>
            </Panel>
          </ReactFlow>
        </div>

        {renderPropertyPanel()}
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafafa',
        }}
      >
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            共 {nodes.length} 个节点，{edges.length} 条连接
          </Text>
        </Space>
        <Text type="secondary" style={{ fontSize: 11 }}>
          按 Delete 键可删除选中的节点或连接
        </Text>
      </div>
    </Modal>
  );
};

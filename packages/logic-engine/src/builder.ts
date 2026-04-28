/**
 * Logic Flow Builder
 * 
 * 逻辑流程构建器 - 用于创建和操作逻辑流程
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  LogicNode,
  LogicConnection,
  LogicFlow,
  NodeDefinition,
  NodeSubtype,
  FlowMetadata,
} from './types';
import { nodeRegistry } from './registry';

// ============================================================
// 节点构建器
// ============================================================

export interface NodeBuilder {
  setType(type: NodeSubtype): NodeBuilder;
  setLabel(label: string): NodeBuilder;
  setPosition(x: number, y: number): NodeBuilder;
  setConfig(params: Record<string, unknown>): NodeBuilder;
  setInputMap(map: Record<string, string>): NodeBuilder;
  setOutputMap(map: Record<string, string>): NodeBuilder;
  build(): LogicNode;
}

/**
 * 创建节点构建器
 */
export function createNodeBuilder(): NodeBuilder {
  const state: Partial<LogicNode> = {
    id: uuidv4(),
    category: 'action',
    label: '',
    config: {
      inputs: [],
      outputs: [],
      params: {},
      inputMap: {},
      outputMap: {},
    },
    position: { x: 0, y: 0 },
  };

  return {
    setType(type: NodeSubtype) {
      state.type = type;
      const definition = nodeRegistry.get(type);
      if (definition) {
        state.category = definition.category;
        state.label = definition.label;
        state.config = {
          inputs: definition.inputs.map((p) => ({ ...p })),
          outputs: definition.outputs.map((p) => ({ ...p })),
          params: { ...definition.defaultConfig?.params },
          inputMap: {},
          outputMap: {},
        };
      }
      return this;
    },

    setLabel(label) {
      state.label = label;
      return this;
    },

    setPosition(x, y) {
      state.position = { x, y };
      return this;
    },

    setConfig(params) {
      if (state.config) {
        state.config.params = { ...state.config.params, ...params };
      }
      return this;
    },

    setInputMap(map) {
      if (state.config) {
        state.config.inputMap = map;
      }
      return this;
    },

    setOutputMap(map) {
      if (state.config) {
        state.config.outputMap = map;
      }
      return this;
    },

    build() {
      if (!state.id || !state.category || !state.type) {
        throw new Error('Missing required node properties');
      }
      return state as LogicNode;
    },
  };
}

/**
 * 从节点定义创建节点
 */
export function createNodeFromDefinition(
  definition: NodeDefinition,
  position: { x: number; y: number } = { x: 0, y: 0 }
): LogicNode {
  return createNodeBuilder()
    .setType(definition.type)
    .setPosition(position.x, position.y)
    .build();
}

/**
 * 创建触发器节点
 */
export function createTriggerNode(
  subtype: 'onClick' | 'onChange' | 'onSubmit' | 'onLoad' | 'onMounted' | 'onTimer',
  position: { x: number; y: number } = { x: 100, y: 100 }
): LogicNode {
  return createNodeFromDefinition(
    nodeRegistry.get(subtype)!,
    position
  );
}

/**
 * 创建动作节点
 */
export function createActionNode(
  subtype: 'setValue' | 'callApi' | 'showMessage' | 'showModal' | 'hideModal' | 'navigate' | 'download' | 'upload',
  params: Record<string, unknown> = {},
  position: { x: number; y: number } = { x: 100, y: 100 }
): LogicNode {
  return createNodeBuilder()
    .setType(subtype)
    .setPosition(position.x, position.y)
    .setConfig(params)
    .build();
}

/**
 * 创建逻辑节点
 */
export function createLogicNode(
  subtype: 'condition' | 'switch' | 'loop' | 'delay' | 'parallel' | 'sequence',
  params: Record<string, unknown> = {},
  position: { x: number; y: number } = { x: 100, y: 100 }
): LogicNode {
  return createNodeBuilder()
    .setType(subtype)
    .setPosition(position.x, position.y)
    .setConfig(params)
    .build();
}

/**
 * 创建数据节点
 */
export function createDataNode(
  subtype: 'getVariable' | 'setVariable' | 'transform' | 'filter' | 'sort' | 'aggregate',
  params: Record<string, unknown> = {},
  position: { x: number; y: number } = { x: 100, y: 100 }
): LogicNode {
  return createNodeBuilder()
    .setType(subtype)
    .setPosition(position.x, position.y)
    .setConfig(params)
    .build();
}

// ============================================================
// 连接构建器
// ============================================================

export interface ConnectionBuilder {
  setSource(sourceId: string, handle?: string): ConnectionBuilder;
  setTarget(targetId: string, handle?: string): ConnectionBuilder;
  setCondition(condition: string): ConnectionBuilder;
  setDefault(isDefault: boolean): ConnectionBuilder;
  setLineStyle(style: 'solid' | 'dashed' | 'dotted'): ConnectionBuilder;
  build(): LogicConnection;
}

/**
 * 创建连接构建器
 */
export function createConnectionBuilder(): ConnectionBuilder {
  const state: Partial<LogicConnection> = {
    id: uuidv4(),
    type: 'flow',
    lineStyle: 'solid',
  };

  return {
    setSource(sourceId, handle) {
      state.source = sourceId;
      state.sourceHandle = handle;
      return this;
    },

    setTarget(targetId, handle) {
      state.target = targetId;
      state.targetHandle = handle;
      return this;
    },

    setCondition(condition) {
      state.type = 'flow';
      state.condition = condition;
      return this;
    },

    setDefault(isDefault) {
      state.isDefault = isDefault;
      return this;
    },

    setLineStyle(style) {
      state.lineStyle = style;
      return this;
    },

    build() {
      if (!state.id || !state.source || !state.target) {
        throw new Error('Missing required connection properties');
      }
      return state as LogicConnection;
    },
  };
}

/**
 * 创建连接
 */
export function createConnection(
  sourceId: string,
  targetId: string,
  options?: {
    sourceHandle?: string;
    targetHandle?: string;
    condition?: string;
    isDefault?: boolean;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
  }
): LogicConnection {
  return createConnectionBuilder()
    .setSource(sourceId, options?.sourceHandle)
    .setTarget(targetId, options?.targetHandle)
    .setCondition(options?.condition || '')
    .setDefault(options?.isDefault || false)
    .setLineStyle(options?.lineStyle || 'solid')
    .build();
}

// ============================================================
// 流程构建器
// ============================================================

export interface FlowBuilder {
  setId(id: string): FlowBuilder;
  setName(name: string): FlowBuilder;
  setDescription(description: string): FlowBuilder;
  setTrigger(trigger: string): FlowBuilder;
  addNode(node: LogicNode): FlowBuilder;
  addNodes(nodes: LogicNode[]): FlowBuilder;
  removeNode(nodeId: string): FlowBuilder;
  updateNode(nodeId: string, updates: Partial<LogicNode>): FlowBuilder;
  addConnection(connection: LogicConnection): FlowBuilder;
  addConnectionBatch(connections: LogicConnection[]): FlowBuilder;
  removeConnection(connectionId: string): FlowBuilder;
  setMetadata(metadata: FlowMetadata): FlowBuilder;
  build(): LogicFlow;
}

/**
 * 创建流程构建器
 */
export function createFlowBuilder(initial?: Partial<LogicFlow>): FlowBuilder {
  const state: Partial<LogicFlow> & { nodes: LogicNode[]; connections: LogicConnection[] } = {
    id: initial?.id || uuidv4(),
    name: initial?.name || '未命名流程',
    trigger: initial?.trigger || '',
    nodes: initial?.nodes || [],
    connections: initial?.connections || [],
    metadata: initial?.metadata,
  };

  return {
    setId(id) {
      state.id = id;
      return this;
    },

    setName(name) {
      state.name = name;
      if (state.metadata) {
        state.metadata.name = name;
      }
      return this;
    },

    setDescription(description) {
      if (!state.metadata) {
        state.metadata = { name: '' };
      }
      state.metadata.description = description;
      return this;
    },

    setTrigger(trigger) {
      state.trigger = trigger;
      return this;
    },

    addNode(node) {
      // 避免重复添加
      if (!state.nodes.find((n) => n.id === node.id)) {
        state.nodes.push(node);
      }
      return this;
    },

    addNodes(nodes) {
      nodes.forEach((node) => {
        if (!state.nodes.find((n) => n.id === node.id)) {
          state.nodes.push(node);
        }
      });
      return this;
    },

    removeNode(nodeId) {
      state.nodes = state.nodes.filter((n) => n.id !== nodeId);
      // 同时删除相关的连接
      state.connections = state.connections.filter(
        (c) => c.source !== nodeId && c.target !== nodeId
      );
      return this;
    },

    updateNode(nodeId, updates) {
      const index = state.nodes.findIndex((n) => n.id === nodeId);
      if (index !== -1) {
        state.nodes[index] = { ...state.nodes[index], ...updates };
      }
      return this;
    },

    addConnection(connection) {
      if (!state.connections.find((c) => c.id === connection.id)) {
        state.connections.push(connection);
      }
      return this;
    },

    addConnectionBatch(connections) {
      connections.forEach((conn) => {
        if (!state.connections.find((c) => c.id === conn.id)) {
          state.connections.push(conn);
        }
      });
      return this;
    },

    removeConnection(connectionId) {
      state.connections = state.connections.filter((c) => c.id !== connectionId);
      return this;
    },

    setMetadata(metadata) {
      state.metadata = metadata;
      return this;
    },

    build() {
      if (!state.id || !state.name) {
        throw new Error('Missing required flow properties');
      }
      return {
        id: state.id,
        name: state.name,
        trigger: state.trigger || '',
        nodes: state.nodes,
        connections: state.connections,
        metadata: state.metadata,
      };
    },
  };
}

// ============================================================
// 流程模板
// ============================================================

/**
 * 创建简单的点击事件流程
 */
export function createClickEventFlow(
  componentId: string,
  actions: Array<{
    type: 'showMessage' | 'navigate' | 'callApi';
    params: Record<string, unknown>;
    position?: { x: number; y: number };
  }>
): LogicFlow {
  const trigger = createTriggerNode('onClick', { x: 100, y: 100 });
  trigger.config.params = { componentId };

  const builder = createFlowBuilder({
    name: '点击事件流程',
    trigger: `component:${componentId}:onClick`,
    nodes: [trigger],
    connections: [],
  });

  let lastNode = trigger;
  let yOffset = 200;

  actions.forEach((action, index) => {
    const actionNode = createActionNode(
      action.type,
      action.params,
      { x: 100, y: yOffset + index * 150 }
    );

    builder.addNode(actionNode);
    builder.addConnection(createConnection(lastNode.id, actionNode.id));

    lastNode = actionNode;
  });

  return builder.build();
}

/**
 * 创建表单提交流程
 */
export function createFormSubmitFlow(
  formId: string,
  config: {
    validate?: boolean;
    submitApi?: string;
    successMessage?: string;
    redirectPath?: string;
  }
): LogicFlow {
  const trigger = createTriggerNode('onSubmit', { x: 100, y: 100 });
  trigger.config.params = { formId };

  const nodes: LogicNode[] = [trigger];
  const connections: LogicConnection[] = [];

  let lastNode = trigger;

  // 添加条件判断（如果需要验证）
  if (config.validate !== false) {
    const condition = createLogicNode('condition', {
      expression: 'values.isValid === true',
    }, { x: 100, y: 250 });
    condition.label = '验证表单';

    nodes.push(condition);
    connections.push(createConnection(lastNode.id, condition.id));
    lastNode = condition;
  }

  // 添加 API 调用
  if (config.submitApi) {
    const apiNode = createActionNode('callApi', {
      url: config.submitApi,
      method: 'POST',
    }, { x: 100, y: 400 });

    nodes.push(apiNode);
    connections.push(createConnection(lastNode.id, apiNode.id));
    lastNode = apiNode;
  }

  // 添加成功消息
  if (config.successMessage) {
    const messageNode = createActionNode('showMessage', {
      content: config.successMessage,
      type: 'success',
    }, { x: 100, y: 550 });

    nodes.push(messageNode);
    connections.push(createConnection(lastNode.id, messageNode.id, { sourceHandle: 'success' }));
    lastNode = messageNode;
  }

  // 添加页面跳转
  if (config.redirectPath) {
    const navigateNode = createActionNode('navigate', {
      path: config.redirectPath,
    }, { x: 100, y: 700 });

    nodes.push(navigateNode);
    connections.push(createConnection(lastNode.id, navigateNode.id));
  }

  return createFlowBuilder({
    name: '表单提交流程',
    trigger: `form:${formId}:onSubmit`,
    nodes,
    connections,
  }).build();
}

/**
 * 创建数据列表加载流程
 */
export function createListLoadFlow(
  listId: string,
  config: {
    apiUrl?: string;
    pageSize?: number;
    onSuccess?: string;
  }
): LogicFlow {
  const trigger = createTriggerNode('onLoad', { x: 100, y: 100 });
  trigger.config.params = { listId };

  const nodes: LogicNode[] = [trigger];
  const connections: LogicConnection[] = [];

  let lastNode = trigger;

  // 添加 API 调用
  if (config.apiUrl) {
    const apiNode = createActionNode('callApi', {
      url: config.apiUrl,
      method: 'GET',
    }, { x: 100, y: 250 });
    apiNode.label = '加载数据';

    nodes.push(apiNode);
    connections.push(createConnection(lastNode.id, apiNode.id));
    lastNode = apiNode;
  }

  // 添加变量设置
  const setDataNode = createDataNode('setVariable', {
    variableName: `${listId}_data`,
    defaultValue: null,
  }, { x: 100, y: 400 });
  setDataNode.label = '保存数据';

  nodes.push(setDataNode);
  connections.push(createConnection(lastNode.id, setDataNode.id, { sourceHandle: 'data' }));

  return createFlowBuilder({
    name: '列表加载流程',
    trigger: `list:${listId}:onLoad`,
    nodes,
    connections,
  }).build();
}

// ============================================================
// 流程操作工具
// ============================================================

/**
 * 复制流程
 */
export function cloneFlow(flow: LogicFlow, newName?: string): LogicFlow {
  // 创建 ID 映射
  const idMap = new Map<string, string>();

  // 生成新 ID
  flow.nodes.forEach((node) => {
    idMap.set(node.id, uuidv4());
  });

  // 复制节点
  const clonedNodes = flow.nodes.map((node) => ({
    ...node,
    id: idMap.get(node.id)!,
    position: node.position ? { ...node.position } : undefined,
    config: {
      ...node.config,
      params: { ...node.config.params },
      inputMap: { ...node.config.inputMap },
      outputMap: { ...node.config.outputMap },
    },
  }));

  // 复制连接
  const clonedConnections = flow.connections.map((conn) => ({
    ...conn,
    id: uuidv4(),
    source: idMap.get(conn.source) || conn.source,
    target: idMap.get(conn.target) || conn.target,
  }));

  return createFlowBuilder({
    ...flow,
    id: uuidv4(),
    name: newName || `${flow.name} (副本)`,
    nodes: clonedNodes,
    connections: clonedConnections,
  }).build();
}

/**
 * 导出流程为 JSON
 */
export function exportFlowToJson(flow: LogicFlow): string {
  return JSON.stringify(flow, null, 2);
}

/**
 * 从 JSON 导入流程
 */
export function importFlowFromJson(json: string): LogicFlow {
  try {
    const data = JSON.parse(json);
    return createFlowBuilder(data).build();
  } catch (error) {
    throw new Error(`Failed to parse flow JSON: ${(error as Error).message}`);
  }
}

/**
 * 验证流程的完整性
 */
export function validateFlow(flow: LogicFlow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查是否有触发器
  const triggers = flow.nodes.filter((n) => n.category === 'trigger');
  if (triggers.length === 0) {
    errors.push('流程必须至少有一个触发器节点');
  }
  if (triggers.length > 1) {
    errors.push('流程不应有多个触发器节点');
  }

  // 检查连接的有效性
  const nodeIds = new Set(flow.nodes.map((n) => n.id));
  flow.connections.forEach((conn) => {
    if (!nodeIds.has(conn.source)) {
      errors.push(`连接 ${conn.id} 的源节点 ${conn.source} 不存在`);
    }
    if (!nodeIds.has(conn.target)) {
      errors.push(`连接 ${conn.id} 的目标节点 ${conn.target} 不存在`);
    }
  });

  // 检查节点配置的验证
  flow.nodes.forEach((node) => {
    const definition = nodeRegistry.get(node.type);
    if (definition?.validate) {
      const result = definition.validate(node.config);
      if (!result.valid && result.errors) {
        errors.push(...result.errors.map((e) => `节点 ${node.label || node.type}: ${e}`));
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 计算节点的边界框
 */
export function calculateFlowBounds(flow: LogicFlow): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const nodesWithPosition = flow.nodes.filter((n) => n.position);

  if (nodesWithPosition.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...nodesWithPosition.map((n) => n.position!.x));
  const minY = Math.min(...nodesWithPosition.map((n) => n.position!.y));
  const maxX = Math.max(...nodesWithPosition.map((n) => n.position!.x + (n.style?.width || 180)));
  const maxY = Math.max(...nodesWithPosition.map((n) => n.position!.y + (n.style?.height || 60)));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 自动布局节点
 */
export function autoLayoutFlow(
  flow: LogicFlow,
  direction: 'horizontal' | 'vertical' = 'vertical'
): LogicFlow {
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 80;
  const GAP_X = 100;
  const GAP_Y = 60;

  // 按层级分组节点
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  function calculateLevel(nodeId: string, level: number): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    levels.set(nodeId, Math.max(levels.get(nodeId) || 0, level));

    const outgoingConnections = flow.connections.filter((c) => c.source === nodeId);
    outgoingConnections.forEach((conn) => {
      calculateLevel(conn.target, level + 1);
    });
  }

  // 从触发器开始计算层级
  const triggers = flow.nodes.filter((n) => n.category === 'trigger');
  triggers.forEach((trigger) => calculateLevel(trigger.id, 0));

  // 为未访问的节点设置默认层级
  flow.nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });

  // 按层级分组
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });

  // 计算新位置
  const updatedNodes = flow.nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = levelGroups.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);

    if (direction === 'vertical') {
      return {
        ...node,
        position: {
          x: 50 + level * (NODE_WIDTH + GAP_X),
          y: 50 + indexInLevel * (NODE_HEIGHT + GAP_Y),
        },
      };
    } else {
      return {
        ...node,
        position: {
          x: 50 + indexInLevel * (NODE_WIDTH + GAP_X),
          y: 50 + level * (NODE_HEIGHT + GAP_Y),
        },
      };
    }
  });

  return createFlowBuilder({
    ...flow,
    nodes: updatedNodes,
  }).build();
}

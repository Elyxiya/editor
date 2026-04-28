/**
 * Logic Engine Types
 * 
 * 定义逻辑编排引擎中使用的核心类型
 */

import type { LogicNode as BaseLogicNode, LogicFlow as BaseLogicFlow, LogicConnection as BaseLogicConnection } from '@lowcode/types';

// ============================================================
// 节点类型定义
// ============================================================

/** 节点分类 */
export type NodeCategory = 'trigger' | 'action' | 'logic' | 'data';

/** 节点子类型 */
export type NodeSubtype = 
  // 触发器
  | 'onClick' | 'onChange' | 'onSubmit' | 'onLoad' | 'onMounted' | 'onUnmounted' | 'onTimer' | 'onWebSocket'
  // 动作
  | 'setValue' | 'callApi' | 'showMessage' | 'showModal' | 'hideModal' | 'navigate' | 'download' | 'upload'
  // 逻辑
  | 'condition' | 'switch' | 'loop' | 'delay' | 'parallel' | 'sequence'
  // 数据
  | 'getVariable' | 'setVariable' | 'transform' | 'filter' | 'sort' | 'aggregate';

/** 节点配置 */
export interface NodeConfig {
  /** 输入端口定义 */
  inputs?: PortDefinition[];
  /** 输出端口定义 */
  outputs?: PortDefinition[];
  /** 配置参数 */
  params?: Record<string, unknown>;
  /** 输入数据映射 */
  inputMap?: Record<string, string>;
  /** 输出数据映射 */
  outputMap?: Record<string, string>;
}

/** 端口定义 */
export interface PortDefinition {
  id: string;
  name: string;
  label: string;
  type: 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void';
  required?: boolean;
  defaultValue?: unknown;
}

/** 扩展的逻辑节点 */
export interface LogicNode extends Omit<BaseLogicNode, 'type' | 'config'> {
  /** 节点分类 */
  category: NodeCategory;
  /** 节点子类型 */
  type: NodeSubtype;
  /** 节点配置 */
  config: NodeConfig;
  /** 位置信息（用于编辑器） */
  position?: { x: number; y: number };
  /** 节点样式（用于编辑器） */
  style?: NodeStyle;
}

/** 节点样式 */
export interface NodeStyle {
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  icon?: string;
}

/** 节点执行状态 */
export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

/** 节点执行结果 */
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeStatus;
  output?: Record<string, unknown>;
  error?: Error;
  duration?: number;
}

// ============================================================
// 连接类型定义
// ============================================================

/** 逻辑连接 */
export interface LogicConnection extends Omit<BaseLogicConnection, 'condition'> {
  /** 连接类型 */
  type: 'flow' | 'data';
  /** 条件表达式（仅用于条件连接） */
  condition?: string;
  /** 是否是默认路径（仅用于条件节点） */
  isDefault?: boolean;
  /** 线条样式（用于编辑器） */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

// ============================================================
// 流程类型定义
// ============================================================

/** 逻辑流程 */
export interface LogicFlow extends Omit<BaseLogicFlow, 'nodes' | 'connections'> {
  /** 节点列表 */
  nodes: LogicNode[];
  /** 连接列表 */
  connections: LogicConnection[];
  /** 流程元数据 */
  metadata?: FlowMetadata;
}

/** 流程元数据 */
export interface FlowMetadata {
  name: string;
  description?: string;
  version?: string;
  tags?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// 执行上下文
// ============================================================

/** 执行上下文 */
export interface ExecutionContext {
  /** 流程ID */
  flowId: string;
  /** 执行ID */
  executionId: string;
  /** 全局变量 */
  variables: Record<string, unknown>;
  /** 触发事件信息 */
  trigger?: TriggerInfo;
  /** 执行时间戳 */
  startTime: number;
  /** 自定义数据 */
  customData?: Record<string, unknown>;
}

/** 触发器信息 */
export interface TriggerInfo {
  type: string;
  source?: string;
  payload?: unknown;
}

/** 节点执行输入 */
export interface NodeExecutionInput {
  node: LogicNode;
  context: ExecutionContext;
  inputData: Record<string, unknown>;
  previousResults?: Map<string, Record<string, unknown>>;
}

/** 执行器选项 */
export interface ExecutorOptions {
  /** 最大执行深度（防止无限循环） */
  maxDepth?: number;
  /** 执行超时（毫秒） */
  timeout?: number;
  /** 是否捕获错误继续执行 */
  continueOnError?: boolean;
  /** 是否记录执行日志 */
  enableLogging?: boolean;
}

// ============================================================
// 节点定义注册
// ============================================================

/** 节点定义 */
export interface NodeDefinition {
  type: NodeSubtype;
  category: NodeCategory;
  label: string;
  description?: string;
  icon?: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultConfig?: NodeConfig;
  /** 是否支持拖拽创建 */
  isDraggable?: boolean;
  /** 验证函数 */
  validate?: (config: NodeConfig) => ValidationResult;
  /** 预览渲染（用于编辑器） */
  renderPreview?: (config: NodeConfig) => string;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ============================================================
// 事件系统
// ============================================================

/** 逻辑引擎事件类型 */
export type LogicEngineEvent = 
  | 'flow:start'
  | 'flow:end'
  | 'flow:error'
  | 'node:enter'
  | 'node:exit'
  | 'node:error'
  | 'condition:evaluate'
  | 'variable:change';

/** 事件监听器 */
export type EventListener = (event: LogicEngineEvent, data: unknown) => void;

// ============================================================
// 导出类型别名（保持向后兼容）
// ============================================================

export type { LogicNode as ILLogicNode } from '@lowcode/types';
export type { LogicFlow as ILLogicFlow } from '@lowcode/types';
export type { LogicConnection as ILLogicConnection } from '@lowcode/types';

/**
 * Events Types
 * 
 * 事件系统相关类型定义
 */

// ============================================================
// 事件基础类型
// ============================================================

/** 事件类型 */
export type EventType = 
  | 'click' | 'dblclick' | 'contextmenu'
  | 'change' | 'input' | 'blur' | 'focus' | 'focusin' | 'focusout'
  | 'keydown' | 'keyup' | 'keypress'
  | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseenter' | 'mouseleave' | 'mouseover' | 'mouseout'
  | 'touchstart' | 'touchend' | 'touchmove' | 'touchcancel'
  | 'scroll' | 'resize' | 'wheel'
  | 'dragstart' | 'drag' | 'dragend' | 'dragenter' | 'dragover' | 'dragleave' | 'drop'
  | 'submit' | 'reset'
  | 'load' | 'error' | 'abort'
  | 'custom'
  | '*';

/** 事件阶段 */
export type EventPhase = 'capture' | 'target' | 'bubble';

/** 事件优先级 */
export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

// ============================================================
// 事件对象
// ============================================================

/** 事件上下文 */
export interface EventContext {
  /** 事件类型 */
  type: EventType;
  /** 触发事件的组件 ID */
  componentId: string;
  /** 组件类型 */
  componentType?: string;
  /** 原始事件对象 */
  nativeEvent?: Event;
  /** 事件目标 */
  target?: HTMLElement;
  /** 当前元素 */
  currentTarget?: HTMLElement;
  /** 事件阶段 */
  phase: EventPhase;
  /** 是否阻止冒泡 */
  bubbles: boolean;
  /** 是否阻止默认行为 */
  cancelable: boolean;
  /** 时间戳 */
  timestamp: number;
  /** 自定义数据 */
  data?: Record<string, unknown>;
}

/** 低代码事件对象 */
export interface LowCodeEvent {
  /** 事件 ID */
  id: string;
  /** 事件类型 */
  type: EventType;
  /** 事件名称 */
  name: string;
  /** 事件描述 */
  description?: string;
  /** 事件阶段 */
  phase?: EventPhase;
  /** 是否阻止冒泡 */
  stopPropagation?: boolean;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
  /** 上下文数据 */
  context: EventContext;
}

// ============================================================
// 事件处理器
// ============================================================

/** 事件处理器函数 */
export type EventHandler<T = LowCodeEvent> = (
  event: T,
  context: EventContext
) => void | Promise<void>;

/** 异步事件处理器 */
export type AsyncEventHandler<T = LowCodeEvent> = (
  event: T,
  context: EventContext
) => Promise<void>;

/** 事件拦截器 */
export type EventInterceptor = (
  event: LowCodeEvent,
  next: () => void | Promise<void>
) => void | Promise<void>;

// ============================================================
// 事件监听器
// ============================================================

/** 监听器选项 */
export interface ListenerOptions {
  /** 是否在捕获阶段触发 */
  capture?: boolean;
  /** 是否只触发一次 */
  once?: boolean;
  /** 事件优先级 */
  priority?: EventPriority;
  /** 禁用状态 */
  disabled?: boolean;
  /** 上下文标识 */
  context?: string;
}

/** 事件监听器 */
export interface EventListener {
  /** 监听器 ID */
  id: string;
  /** 事件类型 */
  type: EventType;
  /** 处理器函数 */
  handler: EventHandler;
  /** 监听器选项 */
  options: ListenerOptions;
  /** 创建时间 */
  createdAt: number;
}

// ============================================================
// 事件绑定
// ============================================================

/** 事件绑定配置 */
export interface EventBinding {
  /** 绑定 ID */
  id: string;
  /** 组件 ID */
  componentId: string;
  /** 事件类型 */
  eventType: EventType;
  /** 动作列表 */
  actions: Action[];
  /** 是否启用 */
  enabled?: boolean;
  /** 条件表达式 */
  condition?: string;
  /** 自定义参数 */
  params?: Record<string, unknown>;
}

/** 事件绑定配置 */
export interface EventBindingConfig {
  /** 是否启用调试 */
  debug?: boolean;
  /** 是否自动绑定组件事件 */
  autoBind?: boolean;
  /** 默认事件处理器选项 */
  defaultOptions?: ListenerOptions;
}

// ============================================================
// 动作系统
// ============================================================

/** 动作类型 */
export type ActionType =
  | 'navigate' | 'showMessage' | 'showModal' | 'hideModal'
  | 'setValue' | 'toggle' | 'callApi' | 'download' | 'upload'
  | 'triggerEvent' | 'emit' | 'broadcast'
  | 'custom' | 'script' | 'expression';

/** 动作配置 */
export interface Action {
  /** 动作 ID */
  id: string;
  /** 动作类型 */
  type: ActionType;
  /** 动作名称 */
  label?: string;
  /** 动作配置 */
  config: ActionConfig;
  /** 执行条件 */
  condition?: string;
  /** 执行延迟（毫秒） */
  delay?: number;
  /** 是否异步执行 */
  async?: boolean;
}

/** 动作配置基类 */
export interface ActionConfig {
  /** 自定义参数 */
  [key: string]: unknown;
}

/** 导航动作配置 */
export interface NavigateActionConfig extends ActionConfig {
  path: string;
  params?: Record<string, unknown>;
  replace?: boolean;
  openInNewTab?: boolean;
}

/** 消息动作配置 */
export interface ShowMessageActionConfig extends ActionConfig {
  type?: 'success' | 'info' | 'warning' | 'error';
  content: string;
  duration?: number;
}

/** 弹窗动作配置 */
export interface ShowModalActionConfig extends ActionConfig {
  modalId: string;
  title?: string;
  content?: string;
  width?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  onOk?: string;
  onCancel?: string;
}

/** 赋值动作配置 */
export interface SetValueActionConfig extends ActionConfig {
  target: string;
  value: unknown;
  merge?: boolean;
}

/** API 调用动作配置 */
export interface CallApiActionConfig extends ActionConfig {
  apiId: string;
  params?: Record<string, unknown>;
  onSuccess?: string;
  onError?: string;
}

/** 自定义脚本动作配置 */
export interface CustomActionConfig extends ActionConfig {
  script: string;
}

// ============================================================
// 动作执行结果
// ============================================================

/** 动作执行结果 */
export interface ActionResult {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data?: unknown;
  /** 错误信息 */
  error?: Error;
  /** 执行时间 */
  duration?: number;
}

// ============================================================
// 事件发射器
// ============================================================

/** 事件发射器配置 */
export interface EventEmitterConfig {
  /** 是否启用调试日志 */
  debug?: boolean;
  /** 最大事件队列长度 */
  maxQueueSize?: number;
  /** 是否延迟执行 */
  asyncExecution?: boolean;
}

// ============================================================
// 组件事件定义
// ============================================================

/** 组件事件元信息 */
export interface ComponentEventDefinition {
  /** 事件名称 */
  name: string;
  /** 事件标签 */
  label: string;
  /** 事件描述 */
  description?: string;
  /** 事件参数定义 */
  params?: EventParamDefinition[];
  /** 默认处理器 */
  defaultHandler?: string;
}

/** 事件参数定义 */
export interface EventParamDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
}

// ============================================================
// 导出类型别名
// ============================================================

export type { ComponentEvent as IComponentEvent } from '@lowcode/types';

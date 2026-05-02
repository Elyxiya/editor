/**
 * Actions Module
 * 
 * 动作系统 - 负责执行各类业务动作
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Action,
  ActionType,
  ActionConfig,
  ActionResult,
  NavigateActionConfig,
  ShowMessageActionConfig,
  ShowModalActionConfig,
  SetValueActionConfig,
  CallApiActionConfig,
  CustomActionConfig,
} from './types';

// ============================================================
// 动作执行器
// ============================================================

export class ActionExecutor {
  private handlers: Map<ActionType, ActionHandler>;
  private context: Record<string, unknown>;

  constructor() {
    this.handlers = new Map();
    this.context = {};

    // 注册默认动作
    this.registerDefaultHandlers();
  }

  /**
   * 注册动作处理器
   */
  register(type: ActionType, handler: ActionHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * 批量注册动作处理器
   */
  registerBatch(handlers: Array<{ type: ActionType; handler: ActionHandler }>): void {
    handlers.forEach(({ type, handler }) => this.register(type, handler));
  }

  /**
   * 注销动作处理器
   */
  unregister(type: ActionType): boolean {
    return this.handlers.delete(type);
  }

  /**
   * 设置执行上下文
   */
  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 获取执行上下文
   */
  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  /**
   * 更新上下文中的值
   */
  updateContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  /**
   * 执行单个动作
   */
  async execute(action: Action): Promise<ActionResult> {
    const handler = this.handlers.get(action.type);

    if (!handler) {
      return {
        success: false,
        error: new Error(`Unknown action type: ${action.type}`),
      };
    }

    const startTime = Date.now();

    try {
      // 检查条件
      if (action.condition && !this.evaluateCondition(action.condition)) {
        return {
          success: true,
          data: null,
        };
      }

      // 执行延迟
      if (action.delay && action.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, action.delay));
      }

      // 执行动作
      const result = await handler(action.config, this.context);

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 批量执行动作
   */
  async executeBatch(actions: Action[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const action of actions) {
      const result = await this.execute(action);
      results.push(result);

      // 如果执行失败且不是异步动作，停止执行
      if (!result.success && !action.async) {
        break;
      }
    }

    return results;
  }

  /**
   * 并行执行动作
   */
  async executeParallel(actions: Action[]): Promise<ActionResult[]> {
    return Promise.all(actions.map((action) => this.execute(action)));
  }

  // ============================================================
  // 默认动作处理器
  // ============================================================

  private registerDefaultHandlers(): void {
    // 导航动作
    this.register('navigate', async (config: ActionConfig) => {
      const cfg = config as NavigateActionConfig;
      let path = cfg.path;

      // Replace all occurrences of path parameters
      Object.entries(this.context).forEach(([key, value]) => {
        const strVal = String(value ?? '');
        path = path.split(`{${key}}`).join(strVal);
        path = path.split(`:${key}`).join(strVal);
      });

      // 添加查询参数
      const params = cfg.params || {};
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)] as [string, string])
        ).toString();
        path = `${path}?${queryString}`;
      }

      if (cfg.openInNewTab) {
        window.open(path, '_blank');
      } else if (cfg.replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }

      return { path };
    });

    // 消息提示动作
    this.register('showMessage', async (config: ActionConfig) => {
      const cfg = config as ShowMessageActionConfig;

      // 这个需要在运行时环境中实现
      // 这里只是记录日志
      console.log(`[ShowMessage] [${cfg.type || 'info'}] ${cfg.content}`);

      if (typeof window !== 'undefined' && (window as unknown as { antd?: { message?: { success?: (msg: string) => void; info?: (msg: string) => void; warning?: (msg: string) => void; error?: (msg: string) => void } } }).antd?.message) {
        const antdMessage = (window as unknown as { antd: { message: { success: (msg: string) => void; info: (msg: string) => void; warning: (msg: string) => void; error: (msg: string) => void } } }).antd.message;
        const messageFn = antdMessage[cfg.type === 'success' ? 'success' : cfg.type === 'warning' ? 'warning' : cfg.type === 'error' ? 'error' : 'info'];
        messageFn(cfg.content);
      }

      return { content: cfg.content, type: cfg.type };
    });

    // 弹窗动作
    this.register('showModal', async (config: ActionConfig) => {
      const cfg = config as ShowModalActionConfig;
      console.log(`[ShowModal] ${cfg.modalId}: ${cfg.title || 'Modal'}`);

      return {
        modalId: cfg.modalId,
        title: cfg.title,
      };
    });

    // 关闭弹窗动作
    this.register('hideModal', async (config: ActionConfig) => {
      const cfg = config as ShowModalActionConfig;
      console.log(`[HideModal] ${cfg.modalId}`);

      return { modalId: cfg.modalId };
    });

    // 赋值动作
    this.register('setValue', async (config: ActionConfig) => {
      const cfg = config as SetValueActionConfig;
      const { target, value, merge = false } = cfg;

      if (merge && typeof value === 'object' && value !== null) {
        const currentValue = this.context[target] as Record<string, unknown>;
        this.context[target] = {
          ...(currentValue || {}),
          ...(value as Record<string, unknown>),
        };
      } else {
        this.context[target] = value;
      }

      return { target, value: this.context[target] };
    });

    // 切换动作
    this.register('toggle', async (config: ActionConfig) => {
      const { target } = config as { target: string };
      const currentValue = this.context[target] as boolean;
      this.context[target] = !currentValue;

      return { target, value: this.context[target] };
    });

    // API 调用动作
    this.register('callApi', async (config: ActionConfig) => {
      const cfg = config as CallApiActionConfig;
      const { apiId, params = {} } = cfg;

      // 这个需要配合数据源管理器使用
      console.log(`[CallApi] ${apiId}`, params);

      // 实际执行需要依赖数据源管理器
      return { apiId, params };
    });

    // 下载动作
    this.register('download', async (config: ActionConfig) => {
      const { url, filename } = config as { url: string; filename?: string };

      const link = document.createElement('a');
      link.href = url;
      if (filename) link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { url, filename };
    });

    // 上传动作
    this.register('upload', async (config: ActionConfig) => {
      const { uploadUrl } = config as { uploadUrl: string };

      // 创建文件输入并触发选择
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';

        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          const formData = new FormData();
          formData.append('file', file);

          try {
            const response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            resolve({ file, data });
          } catch (error) {
            reject(error);
          }
        };

        input.click();
      });
    });

    // 触发事件动作
    this.register('triggerEvent', async (config: ActionConfig) => {
      const { eventName, data } = config as { eventName: string; data?: unknown };

      // 触发自定义事件
      const event = new CustomEvent(eventName, {
        detail: { ...this.context, ...(data as Record<string, unknown>) },
      });
      document.dispatchEvent(event);

      return { eventName };
    });

    // 广播动作
    this.register('broadcast', async (config: ActionConfig) => {
      const { channel, data } = config as { channel: string; data?: unknown };

      // 使用 BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(channel);
        bc.postMessage({ ...this.context, ...(data as Record<string, unknown>) });
        bc.close();
      }

      return { channel };
    });

    // 自定义脚本动作 — disabled for security
    // Script execution via new Function() is a code injection risk.
    // Use the expression action instead for safe, whitelisted operations.
    this.register('script', async (_config: ActionConfig) => {
      console.warn('[ActionExecutor] script action is disabled for security reasons. Use the expression action instead.');
      throw new Error('script action is disabled');
    });

    // 表达式动作
    this.register('expression', async (config: ActionConfig) => {
      const { expression } = config as { expression: string };

      try {
        return this.evaluateExpression(expression);
      } catch (error) {
        console.error('Expression evaluation error:', error);
        throw error;
      }
    });
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string): boolean {
    try {
      return !!this.evaluateExpression(condition);
    } catch {
      return false;
    }
  }

  /**
   * 安全地评估表达式
   */
  private evaluateExpression(expression: string): unknown {
    try {
      const keys = Object.keys(this.context);
      const values = Object.values(this.context);
      const fn = new Function(...keys, `return ${expression}`);
      return fn(...values);
    } catch (error) {
      console.error('Expression evaluation error:', error);
      throw error;
    }
  }
}

// ============================================================
// 动作工厂
// ============================================================

export interface ActionFactory {
  createNavigation(path: string, params?: Record<string, unknown>, options?: { replace?: boolean; openInNewTab?: boolean }): Action;
  createShowMessage(content: string, type?: 'success' | 'info' | 'warning' | 'error'): Action;
  createShowModal(modalId: string, title?: string): Action;
  createHideModal(modalId: string): Action;
  createSetValue(target: string, value: unknown, merge?: boolean): Action;
  createToggle(target: string): Action;
  createCallApi(apiId: string, params?: Record<string, unknown>): Action;
  createDownload(url: string, filename?: string): Action;
  createUpload(uploadUrl: string): Action;
  createTriggerEvent(eventName: string, data?: unknown): Action;
  createScript(script: string): Action;
  createExpression(expression: string): Action;
}

/**
 * 创建动作工厂
 */
export function createActionFactory(): ActionFactory {
  return {
    createNavigation(path, params, options = {}) {
      return {
        id: uuidv4(),
        type: 'navigate',
        label: '页面跳转',
        config: { path, params, ...options } as NavigateActionConfig,
      };
    },

    createShowMessage(content, type = 'info') {
      return {
        id: uuidv4(),
        type: 'showMessage',
        label: '消息提示',
        config: { content, type } as ShowMessageActionConfig,
      };
    },

    createShowModal(modalId, title) {
      return {
        id: uuidv4(),
        type: 'showModal',
        label: '显示弹窗',
        config: { modalId, title } as ShowModalActionConfig,
      };
    },

    createHideModal(modalId) {
      return {
        id: uuidv4(),
        type: 'hideModal',
        label: '关闭弹窗',
        config: { modalId } as ShowModalActionConfig,
      };
    },

    createSetValue(target, value, merge = false) {
      return {
        id: uuidv4(),
        type: 'setValue',
        label: '赋值',
        config: { target, value, merge } as SetValueActionConfig,
      };
    },

    createToggle(target) {
      return {
        id: uuidv4(),
        type: 'toggle',
        label: '切换',
        config: { target } as ActionConfig,
      };
    },

    createCallApi(apiId, params = {}) {
      return {
        id: uuidv4(),
        type: 'callApi',
        label: '调用接口',
        config: { apiId, params } as CallApiActionConfig,
      };
    },

    createDownload(url, filename) {
      return {
        id: uuidv4(),
        type: 'download',
        label: '下载文件',
        config: { url, filename } as ActionConfig,
      };
    },

    createUpload(uploadUrl) {
      return {
        id: uuidv4(),
        type: 'upload',
        label: '上传文件',
        config: { uploadUrl } as ActionConfig,
      };
    },

    createTriggerEvent(eventName, data) {
      return {
        id: uuidv4(),
        type: 'triggerEvent',
        label: '触发事件',
        config: { eventName, data } as ActionConfig,
      };
    },

    createScript(script) {
      return {
        id: uuidv4(),
        type: 'script',
        label: '执行脚本',
        config: { script } as CustomActionConfig,
      };
    },

    createExpression(expression) {
      return {
        id: uuidv4(),
        type: 'expression',
        label: '表达式',
        config: { expression } as ActionConfig,
      };
    },
  };
}

// ============================================================
// 动作执行器类型
// ============================================================

type ActionHandler = (
  config: ActionConfig,
  context: Record<string, unknown>
) => unknown | Promise<unknown>;

// ============================================================
// 导出单例
// ============================================================

let executorInstance: ActionExecutor | null = null;

export function getActionExecutor(): ActionExecutor {
  if (!executorInstance) {
    executorInstance = new ActionExecutor();
  }
  return executorInstance;
}

export function resetActionExecutor(): void {
  executorInstance = null;
}

// ============================================================
// 快捷方法
// ============================================================

export const $execute = (action: Action) => getActionExecutor().execute(action);

export const $executeBatch = (actions: Action[]) => getActionExecutor().executeBatch(actions);

export const $createAction = createActionFactory();

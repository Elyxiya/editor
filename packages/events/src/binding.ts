/**
 * Event Binding Module
 * 
 * 事件绑定系统 - 负责将组件事件与动作关联
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EventType,
  EventBinding,
  EventBindingConfig,
  Action,
  LowCodeEvent,
  ComponentEventDefinition,
} from './types';
import { EventEmitter, getGlobalEmitter } from './emitter';
import { ActionExecutor, getActionExecutor } from './actions';

// ============================================================
// 事件绑定管理器
// ============================================================

export class EventBindingManager {
  private bindings: Map<string, EventBinding>;
  private emitter: EventEmitter;
  private executor: ActionExecutor;
  private componentEvents: Map<string, ComponentEventDefinition[]>;
  private config: EventBindingConfig;

  constructor(config: EventBindingConfig = {}) {
    this.bindings = new Map();
    this.componentEvents = new Map();
    this.config = {
      debug: config.debug ?? false,
      autoBind: config.autoBind ?? true,
      defaultOptions: config.defaultOptions ?? {
        capture: false,
        once: false,
        priority: 'normal',
        disabled: false,
      },
    };

    this.emitter = getGlobalEmitter();
    this.executor = getActionExecutor();

    // 设置默认的事件处理器
    this.setupDefaultHandler();
  }

  // ============================================================
  // 绑定管理
  // ============================================================

  /**
   * 创建事件绑定
   */
  createBinding(
    componentId: string,
    eventType: string,
    actions: Action[],
    options?: {
      condition?: string;
      params?: Record<string, unknown>;
      enabled?: boolean;
    }
  ): EventBinding {
    const binding: EventBinding = {
      id: uuidv4(),
      componentId,
      eventType: eventType as EventBinding['eventType'],
      actions,
      enabled: options?.enabled ?? true,
      condition: options?.condition,
      params: options?.params,
    };

    this.bindings.set(binding.id, binding);

    // 如果配置了自动绑定，立即绑定
    if (this.config.autoBind) {
      this.bind(binding);
    }

    this.log(`Binding created: ${binding.id} (${componentId}:${eventType})`);

    return binding;
  }

  /**
   * 创建绑定并自动生成 ID
   */
  addBinding(
    componentId: string,
    eventType: string,
    actions: Action[],
    options?: {
      condition?: string;
      params?: Record<string, unknown>;
      enabled?: boolean;
    }
  ): string {
    const binding = this.createBinding(componentId, eventType, actions, options);
    return binding.id;
  }

  /**
   * 获取绑定
   */
  getBinding(bindingId: string): EventBinding | undefined {
    return this.bindings.get(bindingId);
  }

  /**
   * 获取组件的所有绑定
   */
  getBindingsByComponent(componentId: string): EventBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.componentId === componentId
    );
  }

  /**
   * 获取组件特定事件的绑定
   */
  getBindingForEvent(componentId: string, eventType: string): EventBinding | undefined {
    return Array.from(this.bindings.values()).find(
      (b) => b.componentId === componentId && b.eventType === eventType
    );
  }

  /**
   * 更新绑定
   */
  updateBinding(bindingId: string, updates: Partial<EventBinding>): boolean {
    const binding = this.bindings.get(bindingId);
    if (!binding) return false;

    Object.assign(binding, updates);
    this.log(`Binding updated: ${bindingId}`);

    return true;
  }

  /**
   * 删除绑定
   */
  removeBinding(bindingId: string): boolean {
    const binding = this.bindings.get(bindingId);
    if (!binding) return false;

    this.unbind(bindingId);
    this.bindings.delete(bindingId);

    this.log(`Binding removed: ${bindingId}`);

    return true;
  }

  /**
   * 删除组件的所有绑定
   */
  removeBindingsByComponent(componentId: string): number {
    const toRemove = this.getBindingsByComponent(componentId);
    toRemove.forEach((b) => {
      this.unbind(b.id);
      this.bindings.delete(b.id);
    });

    this.log(`Removed ${toRemove.length} bindings for component: ${componentId}`);

    return toRemove.length;
  }

  /**
   * 启用绑定
   */
  enableBinding(bindingId: string): boolean {
    const binding = this.bindings.get(bindingId);
    if (!binding) return false;

    binding.enabled = true;
    this.log(`Binding enabled: ${bindingId}`);

    return true;
  }

  /**
   * 禁用绑定
   */
  disableBinding(bindingId: string): boolean {
    const binding = this.bindings.get(bindingId);
    if (!binding) return false;

    binding.enabled = false;
    this.log(`Binding disabled: ${bindingId}`);

    return true;
  }

  // ============================================================
  // 事件监听管理
  // ============================================================

  /**
   * 绑定事件监听
   */
  private bind(binding: EventBinding): void {
    this.emitter.on(binding.eventType, async (event: LowCodeEvent) => {
      // 检查组件 ID 匹配
      if (event.context.componentId !== binding.componentId) return;

      // 检查绑定是否启用
      if (!binding.enabled) return;

      // 检查条件
      if (binding.condition && !this.evaluateCondition(binding.condition, binding.params || {})) {
        return;
      }

      // 执行动作
      await this.executeActions(binding.actions, binding.params || {});
    });
  }

  /**
   * 解绑事件监听
   */
  private unbind(_bindingId: string): void {
    // 由于使用全局事件发射器，这里需要清理
    // 实际实现中可能需要保存监听器 ID
  }

  // ============================================================
  // 动作执行
  // ============================================================

  /**
   * 执行动作列表
   */
  private async executeActions(
    actions: Action[],
    params: Record<string, unknown>
  ): Promise<void> {
    // 设置执行上下文
    this.executor.setContext({
      ...params,
      timestamp: Date.now(),
    });

    // 逐个执行动作
    for (const action of actions) {
      try {
        await this.executor.execute(action);
      } catch (error) {
        console.error(`Action execution failed: ${action.id}`, error);
      }
    }
  }

  // ============================================================
  // 条件评估
  // ============================================================

  /**
   * 评估条件表达式
   */
  private evaluateCondition(
    condition: string,
    context: Record<string, unknown>
  ): boolean {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return ${condition}`);
      return !!fn(...values);
    } catch {
      return true;
    }
  }

  // ============================================================
  // 组件事件定义
  // ============================================================

  /**
   * 注册组件事件
   */
  registerComponentEvents(
    componentType: string,
    events: ComponentEventDefinition[]
  ): void {
    this.componentEvents.set(componentType, events);
    this.log(`Registered events for component: ${componentType}`);
  }

  /**
   * 获取组件事件定义
   */
  getComponentEvents(componentType: string): ComponentEventDefinition[] {
    return this.componentEvents.get(componentType) || [];
  }

  /**
   * 触发组件事件
   */
  triggerComponentEvent(
    componentId: string,
    componentType: string,
    eventName: string,
    data?: Record<string, unknown>
  ): void {
    const events = this.getComponentEvents(componentType);
    const eventDef = events.find((e) => e.name === eventName);

    if (eventDef) {
      this.emitter.emit(eventName as EventType, {
        componentId,
        componentType,
        data,
      });
    }
  }

  // ============================================================
  // 导入/导出
  // ============================================================

  /**
   * 导出所有绑定
   */
  exportBindings(): EventBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * 导入绑定
   */
  importBindings(bindings: EventBinding[]): void {
    bindings.forEach((binding) => {
      this.bindings.set(binding.id, binding);
      this.bind(binding);
    });
  }

  /**
   * 清空所有绑定
   */
  clear(): void {
    this.bindings.clear();
    this.log('All bindings cleared');
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 设置默认事件处理器
   */
  private setupDefaultHandler(): void {
    // 可以在这里设置全局的错误处理等
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[EventBindingManager] ${message}`);
    }
  }
}

// ============================================================
// React Hook
// ============================================================

import type { DependencyList } from 'react';

/**
 * useEventBinding Hook
 * 
 * 在 React 组件中使用事件绑定
 */
export function createUseEventBinding(react: {
  useEffect: typeof import('react').useEffect;
  useCallback: typeof import('react').useCallback;
}) {
  return function useEventBinding(
    componentId: string,
    componentType: string,
    manager: EventBindingManager,
    deps: DependencyList = []
  ): {
    onEvent: (eventName: string, data?: Record<string, unknown>) => void;
    getBindings: () => EventBinding[];
  } {
    // 触发事件
    const onEvent = react.useCallback(
      (eventName: string, data?: Record<string, unknown>) => {
        manager.triggerComponentEvent(componentId, componentType, eventName, data);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [componentId, componentType, manager, ...deps]
    );

    // 获取绑定列表
    const getBindings = react.useCallback(() => {
      return manager.getBindingsByComponent(componentId);
    }, [componentId, manager]);

    return { onEvent, getBindings };
  }
}

// ============================================================
// 预定义组件事件
// ============================================================

export const PRESET_COMPONENT_EVENTS: Record<string, ComponentEventDefinition[]> = {
  Button: [
    {
      name: 'onClick',
      label: '点击',
      description: '按钮点击时触发',
    },
    {
      name: 'onMouseEnter',
      label: '鼠标进入',
      description: '鼠标进入按钮区域时触发',
    },
    {
      name: 'onMouseLeave',
      label: '鼠标离开',
      description: '鼠标离开按钮区域时触发',
    },
  ],

  Input: [
    {
      name: 'onChange',
      label: '值变化',
      description: '输入值变化时触发',
      params: [
        { name: 'value', type: 'string', description: '当前输入值' },
      ],
    },
    {
      name: 'onFocus',
      label: '获得焦点',
      description: '输入框获得焦点时触发',
    },
    {
      name: 'onBlur',
      label: '失去焦点',
      description: '输入框失去焦点时触发',
    },
    {
      name: 'onPressEnter',
      label: '回车',
      description: '按下回车键时触发',
    },
  ],

  Select: [
    {
      name: 'onChange',
      label: '值变化',
      description: '选择值变化时触发',
      params: [
        { name: 'value', type: 'any', description: '当前选中值' },
        { name: 'option', type: 'object', description: '选中的选项' },
      ],
    },
    {
      name: 'onSearch',
      label: '搜索',
      description: '搜索词变化时触发',
      params: [
        { name: 'value', type: 'string', description: '搜索关键词' },
      ],
    },
    {
      name: 'onDropdownVisibleChange',
      label: '下拉显隐',
      description: '下拉框显隐状态变化时触发',
      params: [
        { name: 'visible', type: 'boolean', description: '是否显示' },
      ],
    },
  ],

  Form: [
    {
      name: 'onFinish',
      label: '提交成功',
      description: '表单提交成功时触发',
      params: [
        { name: 'values', type: 'object', description: '表单值' },
      ],
    },
    {
      name: 'onFinishFailed',
      label: '提交失败',
      description: '表单提交失败时触发',
      params: [
        { name: 'errorInfo', type: 'object', description: '错误信息' },
      ],
    },
    {
      name: 'onValuesChange',
      label: '值变化',
      description: '表单值变化时触发',
      params: [
        { name: 'changedValues', type: 'object', description: '变化的值' },
        { name: 'allValues', type: 'object', description: '全部值' },
      ],
    },
  ],

  Table: [
    {
      name: 'onChange',
      label: '变化',
      description: '分页、排序、筛选变化时触发',
      params: [
        { name: 'pagination', type: 'object', description: '分页信息' },
        { name: 'filters', type: 'object', description: '筛选信息' },
        { name: 'sorter', type: 'object', description: '排序信息' },
      ],
    },
    {
      name: 'onRowClick',
      label: '行点击',
      description: '点击行时触发',
      params: [
        { name: 'record', type: 'object', description: '行数据' },
        { name: 'index', type: 'number', description: '行索引' },
      ],
    },
    {
      name: 'onSelectChange',
      label: '选择变化',
      description: '选择变化时触发',
      params: [
        { name: 'selectedRowKeys', type: 'array', description: '选中的键' },
        { name: 'selectedRows', type: 'array', description: '选中的行' },
      ],
    },
  ],

  Modal: [
    {
      name: 'onOk',
      label: '确认',
      description: '点击确认按钮时触发',
    },
    {
      name: 'onCancel',
      label: '取消',
      description: '点击取消按钮或关闭弹窗时触发',
    },
    {
      name: 'onClose',
      label: '关闭',
      description: '弹窗关闭时触发',
    },
  ],

  Container: [
    {
      name: 'onClick',
      label: '点击',
      description: '容器被点击时触发',
    },
  ],
};

// ============================================================
// 导出单例
// ============================================================

let managerInstance: EventBindingManager | null = null;

export function getEventBindingManager(): EventBindingManager {
  if (!managerInstance) {
    managerInstance = new EventBindingManager();
  }
  return managerInstance;
}

export function resetEventBindingManager(): void {
  if (managerInstance) {
    managerInstance.clear();
    managerInstance = null;
  }
}

/**
 * Event Emitter
 * 
 * 事件发射器 - 实现事件的发布/订阅模式
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EventType,
  EventPriority,
  EventHandler,
  EventListener,
  ListenerOptions,
  EventEmitterConfig,
  LowCodeEvent,
  EventContext,
} from './types';

// ============================================================
// 事件发射器
// ============================================================

export class EventEmitter {
  private listeners: Map<EventType, Map<string, EventListener>>;
  private globalListeners: EventListener[];
  private interceptors: Array<(event: LowCodeEvent) => void | Promise<void>>;
  private config: Required<EventEmitterConfig>;

  constructor(config: EventEmitterConfig = {}) {
    this.listeners = new Map();
    this.globalListeners = [];
    this.interceptors = [];

    this.config = {
      debug: config.debug ?? false,
      maxQueueSize: config.maxQueueSize ?? 1000,
      asyncExecution: config.asyncExecution ?? true,
    };
  }

  // ============================================================
  // 监听器管理
  // ============================================================

  /**
   * 注册事件监听器
   */
  on(
    type: EventType,
    handler: EventHandler,
    options: ListenerOptions = {}
  ): () => void {
    const listener: EventListener = {
      id: uuidv4(),
      type,
      handler,
      options: {
        capture: false,
        once: false,
        priority: 'normal',
        disabled: false,
        ...options,
      },
      createdAt: Date.now(),
    };

    // 全局监听器
    if (type === '*') {
      this.globalListeners.push(listener);
      this.sortListeners(this.globalListeners);
    } else {
      // 类型特定监听器
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Map());
      }
      this.listeners.get(type)!.set(listener.id, listener);
      this.sortListeners(Array.from(this.listeners.get(type)!.values()));
    }

    this.log(`Listener registered: ${type} [${listener.id}]`);

    // 返回取消订阅函数
    return () => this.off(listener.id);
  }

  /**
   * 注册一次性监听器
   */
  once(type: EventType, handler: EventHandler, options: Omit<ListenerOptions, 'once'> = {}): () => void {
    return this.on(type, handler, { ...options, once: true });
  }

  /**
   * 注册异步监听器
   */
  waitFor(type: EventType): Promise<LowCodeEvent> {
    return new Promise((resolve) => {
      this.once(type, (event) => resolve(event));
    });
  }

  /**
   * 取消监听
   */
  off(listenerId: string): boolean {
    // 检查全局监听器
    const globalIndex = this.globalListeners.findIndex((l) => l.id === listenerId);
    if (globalIndex !== -1) {
      this.globalListeners.splice(globalIndex, 1);
      this.log(`Listener removed: [${listenerId}]`);
      return true;
    }

    // 检查类型特定监听器
    for (const [, listeners] of this.listeners) {
      if (listeners.has(listenerId)) {
        listeners.delete(listenerId);
        this.log(`Listener removed: [${listenerId}]`);
        return true;
      }
    }

    return false;
  }

  /**
   * 取消指定类型的所有监听器
   */
  offAll(type?: EventType): void {
    if (type) {
      this.listeners.delete(type);
      this.globalListeners = this.globalListeners.filter((l) => l.type !== type);
    } else {
      this.listeners.clear();
      this.globalListeners = [];
    }
  }

  // ============================================================
  // 事件发射
  // ============================================================

  /**
   * 发射事件
   */
  emit(type: EventType, context: Partial<EventContext> = {}): void {
    const event = this.createEvent(type, context);

    if (this.config.asyncExecution) {
      // 异步执行
      queueMicrotask(() => this.handleEvent(event));
    } else {
      // 同步执行
      this.handleEvent(event);
    }
  }

  /**
   * 异步发射事件
   */
  async emitAsync(type: EventType, context: Partial<EventContext> = {}): Promise<void> {
    const event = this.createEvent(type, context);
    await this.handleEventAsync(event);
  }

  /**
   * 发射自定义事件
   */
  emitCustom(
    eventName: string,
    data: Record<string, unknown> = {}
  ): void {
    this.emit('custom', {
      ...data,
      customEventName: eventName,
    } as Partial<EventContext>);
  }

  // ============================================================
  // 拦截器
  // ============================================================

  /**
   * 添加拦截器
   */
  addInterceptor(interceptor: (event: LowCodeEvent) => void | Promise<void>): () => void {
    this.interceptors.push(interceptor);
    return () => {
      const index = this.interceptors.indexOf(interceptor);
      if (index !== -1) {
        this.interceptors.splice(index, 1);
      }
    };
  }

  /**
   * 清空拦截器
   */
  clearInterceptors(): void {
    this.interceptors = [];
  }

  // ============================================================
  // 查询
  // ============================================================

  /**
   * 获取指定类型的监听器数量
   */
  listenerCount(type?: EventType): number {
    if (type) {
      return this.listeners.get(type)?.size ?? 0;
    }

    let count = this.globalListeners.length;
    for (const [, listeners] of this.listeners) {
      count += listeners.size;
    }
    return count;
  }

  /**
   * 获取所有监听的事件类型
   */
  eventTypes(): EventType[] {
    return Array.from(this.listeners.keys());
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private createEvent(type: EventType, context: Partial<EventContext>): LowCodeEvent {
    const timestamp = Date.now();
    
    return {
      id: uuidv4(),
      type,
      name: context.componentId ? `${context.componentId}:${type}` : type,
      context: {
        type,
        componentId: context.componentId || '',
        componentType: context.componentType,
        nativeEvent: context.nativeEvent,
        target: context.target,
        currentTarget: context.currentTarget,
        phase: context.phase || 'bubble',
        bubbles: context.bubbles ?? true,
        cancelable: context.cancelable ?? true,
        timestamp,
        data: context.data,
      } as EventContext,
    };
  }

  private async handleEvent(event: LowCodeEvent): Promise<void> {
    this.log(`Event triggered: ${event.type}`, event);

    // 执行拦截器
    for (const interceptor of this.interceptors) {
      try {
        await interceptor(event);
      } catch (error) {
        console.error('Interceptor error:', error);
      }
    }

    // 获取需要执行的监听器
    const listeners = this.getEventListeners(event.type);
    const promises: Promise<void>[] = [];

    for (const listener of listeners) {
      if (listener.options.disabled) continue;

      try {
        const result = listener.handler(event, event.context);

        if (result instanceof Promise) {
          promises.push(result);
        } else if (this.config.asyncExecution) {
          promises.push(Promise.resolve());
        }

        // 如果是一次性监听器，移除
        if (listener.options.once) {
          this.off(listener.id);
        }
      } catch (error) {
        console.error(`Event handler error [${listener.id}]:`, error);
      }
    }

    // 等待所有异步处理器完成
    await Promise.allSettled(promises);
  }

  private async handleEventAsync(event: LowCodeEvent): Promise<void> {
    this.log(`Async event triggered: ${event.type}`, event);

    const listeners = this.getEventListeners(event.type);

    for (const listener of listeners) {
      if (listener.options.disabled) continue;

      try {
        await listener.handler(event, event.context);

        if (listener.options.once) {
          this.off(listener.id);
        }
      } catch (error) {
        console.error(`Async event handler error [${listener.id}]:`, error);
      }
    }
  }

  private getEventListeners(type: EventType): EventListener[] {
    const listeners: EventListener[] = [];

    // 添加全局监听器
    listeners.push(...this.globalListeners.filter((l) => l.type === type));

    // 添加类型特定监听器
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      listeners.push(...Array.from(typeListeners.values()));
    }

    return listeners;
  }

  private sortListeners(listeners: EventListener[]): void {
    const priorityOrder: Record<EventPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    listeners.sort((a, b) => {
      // 按优先级排序
      const priorityDiff = priorityOrder[a.options.priority || 'normal'] - priorityOrder[b.options.priority || 'normal'];
      if (priorityDiff !== 0) return priorityDiff;

      // 同优先级按创建时间排序
      return a.createdAt - b.createdAt;
    });
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[EventEmitter] ${message}`, data || '');
    }
  }
}

// ============================================================
// 全局事件总线
// ============================================================

let globalEmitter: EventEmitter | null = null;

export function getGlobalEmitter(): EventEmitter {
  if (!globalEmitter) {
    globalEmitter = new EventEmitter({ debug: false });
  }
  return globalEmitter;
}

export function resetGlobalEmitter(): void {
  if (globalEmitter) {
    globalEmitter.offAll();
    globalEmitter = null;
  }
}

// ============================================================
// 快捷方法
// ============================================================

export const $emit = (type: EventType, context?: Partial<EventContext>) =>
  getGlobalEmitter().emit(type, context);

export const $on = (
  type: EventType,
  handler: EventHandler,
  options?: ListenerOptions
) => getGlobalEmitter().on(type, handler, options);

export const $once = (type: EventType, handler: EventHandler) =>
  getGlobalEmitter().once(type, handler);

export const $off = (listenerId: string) => getGlobalEmitter().off(listenerId);

export const $waitFor = (type: EventType) => getGlobalEmitter().waitFor(type);

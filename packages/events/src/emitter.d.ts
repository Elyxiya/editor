/**
 * Event Emitter
 *
 * 事件发射器 - 实现事件的发布/订阅模式
 */
import type { EventType, EventHandler, ListenerOptions, EventEmitterConfig, LowCodeEvent, EventContext } from './types';
export declare class EventEmitter {
    private listeners;
    private globalListeners;
    private interceptors;
    private config;
    constructor(config?: EventEmitterConfig);
    /**
     * 注册事件监听器
     */
    on(type: EventType, handler: EventHandler, options?: ListenerOptions): () => void;
    /**
     * 注册一次性监听器
     */
    once(type: EventType, handler: EventHandler, options?: Omit<ListenerOptions, 'once'>): () => void;
    /**
     * 注册异步监听器
     */
    waitFor(type: EventType): Promise<LowCodeEvent>;
    /**
     * 取消监听
     */
    off(listenerId: string): boolean;
    /**
     * 取消指定类型的所有监听器
     */
    offAll(type?: EventType): void;
    /**
     * 发射事件
     */
    emit(type: EventType, context?: Partial<EventContext>): void;
    /**
     * 异步发射事件
     */
    emitAsync(type: EventType, context?: Partial<EventContext>): Promise<void>;
    /**
     * 发射自定义事件
     */
    emitCustom(eventName: string, data?: Record<string, unknown>): void;
    /**
     * 添加拦截器
     */
    addInterceptor(interceptor: (event: LowCodeEvent) => void | Promise<void>): () => void;
    /**
     * 清空拦截器
     */
    clearInterceptors(): void;
    /**
     * 获取指定类型的监听器数量
     */
    listenerCount(type?: EventType): number;
    /**
     * 获取所有监听的事件类型
     */
    eventTypes(): EventType[];
    private createEvent;
    private handleEvent;
    private handleEventAsync;
    private getEventListeners;
    private sortListeners;
    private log;
}
export declare function getGlobalEmitter(): EventEmitter;
export declare function resetGlobalEmitter(): void;
export declare const $emit: (type: EventType, context?: Partial<EventContext>) => void;
export declare const $on: (type: EventType, handler: EventHandler, options?: ListenerOptions) => () => void;
export declare const $once: (type: EventType, handler: EventHandler) => () => void;
export declare const $off: (listenerId: string) => boolean;
export declare const $waitFor: (type: EventType) => Promise<LowCodeEvent>;

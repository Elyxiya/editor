/**
 * Event Binding Module
 *
 * 事件绑定系统 - 负责将组件事件与动作关联
 */
import type { EventBinding, EventBindingConfig, Action, ComponentEventDefinition } from './types';
export declare class EventBindingManager {
    private bindings;
    private emitter;
    private executor;
    private componentEvents;
    private config;
    /** Maps bindingId → listenerId so unbind can actually remove the listener */
    private listenerIds;
    constructor(config?: EventBindingConfig);
    /**
     * 创建事件绑定
     */
    createBinding(componentId: string, eventType: string, actions: Action[], options?: {
        condition?: string;
        params?: Record<string, unknown>;
        enabled?: boolean;
    }): EventBinding;
    /**
     * 创建绑定并自动生成 ID
     */
    addBinding(componentId: string, eventType: string, actions: Action[], options?: {
        condition?: string;
        params?: Record<string, unknown>;
        enabled?: boolean;
    }): string;
    /**
     * 获取绑定
     */
    getBinding(bindingId: string): EventBinding | undefined;
    /**
     * 获取组件的所有绑定
     */
    getBindingsByComponent(componentId: string): EventBinding[];
    /**
     * 获取组件特定事件的绑定
     */
    getBindingForEvent(componentId: string, eventType: string): EventBinding | undefined;
    /**
     * 更新绑定
     */
    updateBinding(bindingId: string, updates: Partial<EventBinding>): boolean;
    /**
     * 删除绑定
     */
    removeBinding(bindingId: string): boolean;
    /**
     * 删除组件的所有绑定
     */
    removeBindingsByComponent(componentId: string): number;
    /**
     * 启用绑定
     */
    enableBinding(bindingId: string): boolean;
    /**
     * 禁用绑定
     */
    disableBinding(bindingId: string): boolean;
    /**
     * 绑定事件监听
     */
    private bind;
    /**
     * 解绑事件监听
     */
    private unbind;
    /**
     * 执行动作列表
     */
    private executeActions;
    /**
     * 评估条件表达式
     */
    private evaluateCondition;
    /**
     * 注册组件事件
     */
    registerComponentEvents(componentType: string, events: ComponentEventDefinition[]): void;
    /**
     * 获取组件事件定义
     */
    getComponentEvents(componentType: string): ComponentEventDefinition[];
    /**
     * 触发组件事件
     */
    triggerComponentEvent(componentId: string, componentType: string, eventName: string, data?: Record<string, unknown>): void;
    /**
     * 导出所有绑定
     */
    exportBindings(): EventBinding[];
    /**
     * 导入绑定
     */
    importBindings(bindings: EventBinding[]): void;
    /**
     * 清空所有绑定
     */
    clear(): void;
    /**
     * 设置默认事件处理器
     */
    private setupDefaultHandler;
    private log;
}
import type { DependencyList } from 'react';
/**
 * useEventBinding Hook
 *
 * 在 React 组件中使用事件绑定
 */
export declare function createUseEventBinding(react: {
    useEffect: typeof import('react').useEffect;
    useCallback: typeof import('react').useCallback;
}): (componentId: string, componentType: string, manager: EventBindingManager, deps?: DependencyList) => {
    onEvent: (eventName: string, data?: Record<string, unknown>) => void;
    getBindings: () => EventBinding[];
};
export declare const PRESET_COMPONENT_EVENTS: Record<string, ComponentEventDefinition[]>;
export declare function getEventBindingManager(): EventBindingManager;
export declare function resetEventBindingManager(): void;

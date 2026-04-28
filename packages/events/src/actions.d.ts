/**
 * Actions Module
 *
 * 动作系统 - 负责执行各类业务动作
 */
import type { Action, ActionType, ActionConfig, ActionResult } from './types';
export declare class ActionExecutor {
    private handlers;
    private context;
    constructor();
    /**
     * 注册动作处理器
     */
    register(type: ActionType, handler: ActionHandler): void;
    /**
     * 批量注册动作处理器
     */
    registerBatch(handlers: Array<{
        type: ActionType;
        handler: ActionHandler;
    }>): void;
    /**
     * 注销动作处理器
     */
    unregister(type: ActionType): boolean;
    /**
     * 设置执行上下文
     */
    setContext(context: Record<string, unknown>): void;
    /**
     * 获取执行上下文
     */
    getContext(): Record<string, unknown>;
    /**
     * 更新上下文中的值
     */
    updateContext(key: string, value: unknown): void;
    /**
     * 执行单个动作
     */
    execute(action: Action): Promise<ActionResult>;
    /**
     * 批量执行动作
     */
    executeBatch(actions: Action[]): Promise<ActionResult[]>;
    /**
     * 并行执行动作
     */
    executeParallel(actions: Action[]): Promise<ActionResult[]>;
    private registerDefaultHandlers;
    /**
     * 评估条件表达式
     */
    private evaluateCondition;
    /**
     * 安全地评估表达式
     */
    private evaluateExpression;
}
export interface ActionFactory {
    createNavigation(path: string, params?: Record<string, unknown>, options?: {
        replace?: boolean;
        openInNewTab?: boolean;
    }): Action;
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
export declare function createActionFactory(): ActionFactory;
type ActionHandler = (config: ActionConfig, context: Record<string, unknown>) => unknown | Promise<unknown>;
export declare function getActionExecutor(): ActionExecutor;
export declare function resetActionExecutor(): void;
export declare const $execute: (action: Action) => Promise<ActionResult>;
export declare const $executeBatch: (actions: Action[]) => Promise<ActionResult[]>;
export declare const $createAction: ActionFactory;
export {};

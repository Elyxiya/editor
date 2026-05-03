/**
 * Logic Executor
 *
 * 逻辑流程执行器 - 负责解释和执行逻辑流程
 */
import type { LogicFlow, ExecutionContext, ExecutorOptions, LogicEngineEvent, EventListener } from './types';
import './nodes';
export declare class LogicExecutor {
    private options;
    private listeners;
    private executingFlows;
    constructor(options?: ExecutorOptions);
    /**
     * 注册事件监听器
     */
    on(event: LogicEngineEvent, listener: EventListener): void;
    /**
     * 移除事件监听器
     */
    off(event: LogicEngineEvent, listener: EventListener): void;
    /**
     * 触发事件
     */
    private emit;
    /**
     * 执行流程
     */
    execute(flow: LogicFlow, initialContext?: Partial<ExecutionContext>): Promise<ExecutionContext>;
    /**
     * 执行单个节点
     */
    private executeNode;
    /**
     * 执行后续节点
     */
    private executeNextNodes;
    private executeSetValue;
    private executeCallApi;
    private executeShowMessage;
    private executeNavigate;
    private executeShowModal;
    private executeHideModal;
    private executeDownload;
    private executeUpload;
    private executeCondition;
    private executeLoop;
    private executeDelay;
    private executeGetVariable;
    private executeSetVariable;
    private executeTransform;
    private executeFilter;
    private executeSort;
    private executeAggregate;
    private extractVariables;
    /**
     * 检查流程是否正在执行
     */
    isExecuting(flowId: string): boolean;
    /**
     * 中断流程执行
     */
    abort(flowId: string): void;
}
export declare const logicExecutor: LogicExecutor;

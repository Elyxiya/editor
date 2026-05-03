/**
 * DataSource Manager
 *
 * 数据源管理器 - 统一管理所有数据源的状态和请求
 */
import type { DataSource, DataSourceState, DataSourceManagerConfig } from './types';
export declare class DataSourceManager {
    private dataSources;
    private states;
    private request;
    private cache;
    private config;
    private abortControllers;
    private listeners;
    constructor(config?: DataSourceManagerConfig);
    /**
     * 注册数据源
     */
    register(dataSource: DataSource): void;
    /**
     * 批量注册数据源
     */
    registerBatch(dataSources: DataSource[]): void;
    /**
     * 注销数据源
     */
    unregister(name: string): boolean;
    /**
     * 清空所有数据源
     */
    clear(): void;
    /**
     * 加载数据源
     */
    load(name: string, params?: Record<string, unknown>): Promise<unknown>;
    /**
     * 重新加载数据源
     */
    reload(name: string): Promise<unknown>;
    /**
     * 取消数据源请求
     */
    abort(name: string): void;
    /**
     * 取消所有数据源请求
     */
    abortAll(): void;
    /**
     * 获取数据源状态
     */
    getState(name: string): DataSourceState | undefined;
    /**
     * 获取所有数据源状态
     */
    getAllStates(): Map<string, DataSourceState>;
    /**
     * 获取数据源
     */
    getDataSource(name: string): DataSource | undefined;
    /**
     * 获取所有数据源
     */
    getAllDataSources(): DataSource[];
    /**
     * 检查数据源是否存在
     */
    has(name: string): boolean;
    /**
     * 检查数据源是否正在加载
     */
    isLoading(name: string): boolean;
    /**
     * 订阅状态变化
     */
    subscribe(listener: (states: Map<string, DataSourceState>) => void): () => void;
    /**
     * 通知状态变化
     */
    private notify;
    /**
     * 加载 API 数据源
     */
    private loadApi;
    /**
     * 加载 Mock 数据源
     */
    private loadMock;
    /**
     * 加载变量数据源
     */
    private loadVariable;
    /**
     * 应用数据映射
     */
    private applyDataMapping;
    /**
     * 更新状态
     */
    private updateState;
    /**
     * 生成缓存 Key
     */
    private getCacheKey;
    /**
     * 标准化错误
     */
    private normalizeError;
    /**
     * 日志
     */
    private log;
}
export declare function createDataSourceManager(config?: DataSourceManagerConfig): DataSourceManager;
export declare function getDataSourceManager(): DataSourceManager;
export declare function resetDataSourceManager(): void;

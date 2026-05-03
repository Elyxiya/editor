/**
 * DataSource Types
 *
 * 数据源相关类型定义
 */
import type { DataSource as BaseDataSource, DataSourceConfig } from '@lowcode/types';
/** 数据源类型 */
export type DataSourceType = 'api' | 'mock' | 'variable' | 'graphql' | 'websocket';
/** 数据源状态 */
export type DataSourceStatus = 'idle' | 'loading' | 'success' | 'error';
/** 数据源配置扩展 */
export interface DataSourceConfigExtended extends Omit<DataSourceConfig, 'transform'> {
    /** 请求超时（毫秒） */
    timeout?: number;
    /** 是否启用缓存 */
    enableCache?: boolean;
    /** 缓存过期时间（毫秒） */
    cacheExpire?: number;
    /** 请求重试次数 */
    retryCount?: number;
    /** 重试延迟（毫秒） */
    retryDelay?: number;
    /** 错误消息 */
    errorMessage?: string;
}
/** 数据源 */
export interface DataSource extends Omit<BaseDataSource, 'config'> {
    /** 扩展配置 */
    config: DataSourceConfigExtended;
    /** 是否自动加载 */
    autoLoad?: boolean;
    /** 加载延迟（毫秒） */
    loadDelay?: number;
    /** 数据映射配置 */
    dataMap?: DataMapping;
}
/** 数据映射配置 */
export interface DataMapping {
    /** 数据路径（如 data.list） */
    dataPath?: string;
    /** 列表字段名 */
    listField?: string;
    /** 总数字段名 */
    totalField?: string;
    /** 字段映射 */
    fieldMap?: Record<string, string>;
    /** 转换函数 */
    transform?: string;
}
/** 数据源状态信息 */
export interface DataSourceState {
    id: string;
    name: string;
    status: DataSourceStatus;
    data: unknown;
    error: Error | null;
    loading: boolean;
    lastUpdated: number | null;
    params: Record<string, unknown>;
}
/** API 请求配置 */
export interface ApiRequestConfig {
    /** 请求 URL */
    url: string;
    /** 请求方法 */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    /** URL 参数 */
    params?: Record<string, unknown>;
    /** 请求体 */
    data?: unknown;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 超时时间 */
    timeout?: number;
    /** 是否携带凭证 */
    withCredentials?: boolean;
    /** 响应类型 */
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}
/** API 响应 */
export interface ApiResponse<T = unknown> {
    /** 响应数据 */
    data: T;
    /** 状态码 */
    status: number;
    /** 状态文本 */
    statusText: string;
    /** 响应头 */
    headers: Record<string, string>;
    /** 请求配置 */
    config: ApiRequestConfig;
}
/** API 错误 */
export interface ApiError {
    /** 错误名称 */
    name?: string;
    /** 错误消息 */
    message: string;
    /** 状态码 */
    status?: number;
    /** 错误代码 */
    code?: string;
    /** 响应数据 */
    data?: unknown;
    /** 原始错误 */
    originalError?: Error;
}
/** 缓存条目 */
export interface CacheEntry<T = unknown> {
    /** 缓存数据 */
    data: T;
    /** 创建时间 */
    createdAt: number;
    /** 过期时间 */
    expiresAt: number;
    /** 缓存 key */
    key: string;
}
/** 缓存配置 */
export interface CacheConfig {
    /** 最大缓存条目数 */
    maxSize?: number;
    /** 默认过期时间（毫秒） */
    defaultExpire?: number;
    /** 存储方式 */
    storage?: 'memory' | 'localStorage' | 'sessionStorage';
}
/** 请求拦截器 */
export interface RequestInterceptor {
    /** 拦截器 ID */
    id: string;
    /** 拦截器函数 */
    onRequest?: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;
    /** 响应拦截器 */
    onResponse?: <T>(response: ApiResponse<T>) => T | Promise<T>;
    /** 错误拦截器 */
    onError?: (error: ApiError) => ApiError | Promise<ApiError>;
}
/** useDataSource 返回值 */
export interface UseDataSourceReturn<T = unknown> {
    /** 数据 */
    data: T | null;
    /** 是否加载中 */
    loading: boolean;
    /** 是否有错误 */
    error: Error | null;
    /** 状态 */
    status: DataSourceStatus;
    /** 刷新数据 */
    refresh: () => Promise<void>;
    /** 设置参数并重新加载 */
    setParams: (params: Record<string, unknown>) => Promise<void>;
    /** 取消请求 */
    cancel: () => void;
}
/** 数据源管理器配置 */
export interface DataSourceManagerConfig {
    /** 全局请求配置 */
    globalRequestConfig?: Partial<ApiRequestConfig>;
    /** 全局错误处理 */
    onError?: (error: ApiError, dataSource: DataSource) => void;
    /** 缓存配置 */
    cacheConfig?: CacheConfig;
    /** 拦截器 */
    interceptors?: RequestInterceptor[];
    /** 是否启用调试 */
    debug?: boolean;
}
export type { DataSource as IDataSource } from '@lowcode/types';
export type { DataSourceConfig as IDataSourceConfig } from '@lowcode/types';

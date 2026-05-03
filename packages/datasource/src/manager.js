/**
 * DataSource Manager
 *
 * 数据源管理器 - 统一管理所有数据源的状态和请求
 */
import { createRequest } from './request';
import { createCache } from './cache';
// ============================================================
// 数据源管理器
// ============================================================
export class DataSourceManager {
    constructor(config = {}) {
        this.dataSources = new Map();
        this.states = new Map();
        this.abortControllers = new Map();
        this.listeners = new Set();
        this.config = {
            globalRequestConfig: config.globalRequestConfig || {},
            onError: config.onError || (() => { }),
            cacheConfig: {
                maxSize: config.cacheConfig?.maxSize || 100,
                defaultExpire: config.cacheConfig?.defaultExpire || 5 * 60 * 1000,
                storage: config.cacheConfig?.storage || 'memory',
            },
            interceptors: config.interceptors || [],
            debug: config.debug || false,
        };
        this.request = createRequest({
            ...this.config.globalRequestConfig,
        });
        this.cache = createCache(this.config.cacheConfig);
        this.log('DataSourceManager initialized');
    }
    // ============================================================
    // 注册和注销
    // ============================================================
    /**
     * 注册数据源
     */
    register(dataSource) {
        if (this.dataSources.has(dataSource.name)) {
            this.log(`DataSource ${dataSource.name} already registered, replacing...`);
        }
        this.dataSources.set(dataSource.name, dataSource);
        this.states.set(dataSource.name, {
            id: dataSource.id,
            name: dataSource.name,
            status: 'idle',
            data: null,
            error: null,
            loading: false,
            lastUpdated: null,
            params: {},
        });
        this.log(`DataSource ${dataSource.name} registered`);
        // 如果配置了自动加载
        if (dataSource.autoLoad) {
            const delay = dataSource.loadDelay || 0;
            setTimeout(() => this.load(dataSource.name), delay);
        }
    }
    /**
     * 批量注册数据源
     */
    registerBatch(dataSources) {
        dataSources.forEach((ds) => this.register(ds));
    }
    /**
     * 注销数据源
     */
    unregister(name) {
        const dataSource = this.dataSources.get(name);
        if (!dataSource)
            return false;
        // 取消正在进行的请求
        this.abort(name);
        this.dataSources.delete(name);
        this.states.delete(name);
        this.log(`DataSource ${name} unregistered`);
        return true;
    }
    /**
     * 清空所有数据源
     */
    clear() {
        this.abortAll();
        this.dataSources.clear();
        this.states.clear();
        this.log('All data sources cleared');
    }
    // ============================================================
    // 数据源操作
    // ============================================================
    /**
     * 加载数据源
     */
    async load(name, params) {
        const dataSource = this.dataSources.get(name);
        if (!dataSource) {
            throw new Error(`DataSource ${name} not found`);
        }
        // 如果已经在加载中，取消之前的请求
        if (this.states.get(name)?.loading) {
            this.abort(name);
        }
        // 创建新的 AbortController
        const abortController = new AbortController();
        this.abortControllers.set(name, abortController);
        // 更新状态为加载中
        this.updateState(name, {
            status: 'loading',
            loading: true,
            error: null,
            params: params || this.states.get(name)?.params || {},
        });
        this.log(`Loading dataSource ${name}...`);
        try {
            let result;
            switch (dataSource.type) {
                case 'api':
                    result = await this.loadApi(dataSource, params, abortController);
                    break;
                case 'mock':
                    result = this.loadMock(dataSource);
                    break;
                case 'variable':
                    result = this.loadVariable(dataSource);
                    break;
                default:
                    throw new Error(`Unsupported dataSource type: ${dataSource.type}`);
            }
            // 应用数据映射
            if (dataSource.dataMap && typeof result === 'object') {
                result = this.applyDataMapping(result, dataSource.dataMap);
            }
            // 更新状态
            this.updateState(name, {
                status: 'success',
                data: result,
                error: null,
                loading: false,
                lastUpdated: Date.now(),
            });
            this.log(`DataSource ${name} loaded successfully`);
            return result;
        }
        catch (error) {
            const apiError = this.normalizeError(error, dataSource.name);
            this.updateState(name, {
                status: 'error',
                data: null,
                error: new Error(apiError.message),
                loading: false,
            });
            this.config.onError(apiError, dataSource);
            this.log(`DataSource ${name} failed: ${apiError.message}`, 'error');
            throw apiError;
        }
    }
    /**
     * 重新加载数据源
     */
    async reload(name) {
        const currentParams = this.states.get(name)?.params;
        return this.load(name, currentParams);
    }
    /**
     * 取消数据源请求
     */
    abort(name) {
        const controller = this.abortControllers.get(name);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(name);
            this.log(`Aborted dataSource ${name}`);
        }
    }
    /**
     * 取消所有数据源请求
     */
    abortAll() {
        this.abortControllers.forEach((controller, name) => {
            controller.abort();
            this.log(`Aborted dataSource ${name}`);
        });
        this.abortControllers.clear();
    }
    // ============================================================
    // 状态查询
    // ============================================================
    /**
     * 获取数据源状态
     */
    getState(name) {
        return this.states.get(name);
    }
    /**
     * 获取所有数据源状态
     */
    getAllStates() {
        return new Map(this.states);
    }
    /**
     * 获取数据源
     */
    getDataSource(name) {
        return this.dataSources.get(name);
    }
    /**
     * 获取所有数据源
     */
    getAllDataSources() {
        return Array.from(this.dataSources.values());
    }
    /**
     * 检查数据源是否存在
     */
    has(name) {
        return this.dataSources.has(name);
    }
    /**
     * 检查数据源是否正在加载
     */
    isLoading(name) {
        return this.states.get(name)?.loading || false;
    }
    // ============================================================
    // 订阅更新
    // ============================================================
    /**
     * 订阅状态变化
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * 通知状态变化
     */
    notify() {
        this.listeners.forEach((listener) => {
            try {
                listener(this.states);
            }
            catch (error) {
                console.error('State listener error:', error);
            }
        });
    }
    // ============================================================
    // 私有方法
    // ============================================================
    /**
     * 加载 API 数据源
     */
    async loadApi(dataSource, params, abortController) {
        const { config } = dataSource;
        const { enableCache, cacheExpire, retryCount = 0, retryDelay = 1000 } = config;
        // 检查缓存
        if (enableCache) {
            const cacheKey = this.getCacheKey(dataSource.name, params);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.log(`Cache hit for ${dataSource.name}`);
                return cached;
            }
        }
        // 构建请求配置
        const requestConfig = {
            url: config.url || `/api/${dataSource.name}`,
            method: config.method || 'GET',
            params: { ...config.params, ...params },
            headers: config.headers,
            data: config.body,
            timeout: config.timeout || 30000,
        };
        // 应用拦截器
        let finalConfig = requestConfig;
        for (const interceptor of this.config.interceptors) {
            if (interceptor.onRequest) {
                finalConfig = await interceptor.onRequest(finalConfig);
            }
        }
        // 重试逻辑
        let lastError = null;
        for (let i = 0; i <= retryCount; i++) {
            try {
                const response = await this.request({
                    ...finalConfig,
                    signal: abortController.signal,
                });
                // 应用响应拦截器
                let result = response.data;
                for (const interceptor of this.config.interceptors) {
                    if (interceptor.onResponse) {
                        result = await interceptor.onResponse(response);
                    }
                }
                // 缓存结果
                if (enableCache) {
                    const cacheKey = this.getCacheKey(dataSource.name, params);
                    this.cache.set(cacheKey, result, cacheExpire);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                // 如果不是最后一次尝试，等待后重试
                if (i < retryCount && !error.name?.includes('AbortError')) {
                    await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
                }
            }
        }
        throw lastError;
    }
    /**
     * 加载 Mock 数据源
     */
    loadMock(dataSource) {
        const { config } = dataSource;
        if (!config.mockData) {
            this.log(`Mock data not provided for ${dataSource.name}`, 'warn');
            return null;
        }
        // 模拟网络延迟
        const mockDelay = config.headers?.['x-mock-delay']
            ? parseInt(config.headers['x-mock-delay'], 10)
            : 300;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(config.mockData);
            }, mockDelay);
        });
    }
    /**
     * 加载变量数据源
     */
    loadVariable(dataSource) {
        // 变量类型直接从配置或上下文中获取
        const { config } = dataSource;
        return config.mockData || null;
    }
    /**
     * 应用数据映射
     */
    applyDataMapping(data, dataMap) {
        if (!dataMap || !data || typeof data !== 'object')
            return data;
        const result = {};
        // 获取列表数据
        if (dataMap.dataPath) {
            const pathParts = dataMap.dataPath.split('.');
            let current = data;
            for (const part of pathParts) {
                if (current && typeof current === 'object') {
                    current = current[part];
                }
                else {
                    current = undefined;
                    break;
                }
            }
            result.data = current;
        }
        else {
            result.data = data;
        }
        // 获取总数字段
        if (dataMap.totalField && data && typeof data === 'object') {
            result.total = data[dataMap.totalField];
        }
        // 字段映射
        if (dataMap.fieldMap) {
            Object.entries(dataMap.fieldMap).forEach(([target, source]) => {
                if (data && typeof data === 'object') {
                    const sourceValue = data[source];
                    if (sourceValue !== undefined) {
                        result[target] = sourceValue;
                    }
                }
            });
        }
        return Object.keys(result).length > 0 ? result : data;
    }
    /**
     * 更新状态
     */
    updateState(name, updates) {
        const current = this.states.get(name);
        if (current) {
            // Replace the state reference entirely so external subscribers get notified via Map mutation
            const updated = {
                ...current,
                ...updates,
                data: updates.data !== undefined ? updates.data : current.data,
                loading: updates.loading !== undefined ? updates.loading : current.loading,
                error: updates.error !== undefined ? updates.error : current.error,
                params: updates.params !== undefined ? updates.params : current.params,
            };
            this.states.set(name, updated);
            this.notify();
        }
    }
    /**
     * 生成缓存 Key
     */
    getCacheKey(name, params) {
        const paramsStr = params ? JSON.stringify(params) : '';
        return `${name}:${paramsStr}`;
    }
    /**
     * 标准化错误
     */
    normalizeError(error, dataSourceName) {
        return {
            name: error.name,
            message: error.message || 'Unknown error',
            code: error.code,
            originalError: error,
        };
    }
    /**
     * 日志
     */
    log(message, level = 'info') {
        if (this.config.debug) {
            const prefix = `[DataSourceManager]`;
            switch (level) {
                case 'warn':
                    console.warn(`${prefix} ${message}`);
                    break;
                case 'error':
                    console.error(`${prefix} ${message}`);
                    break;
                default:
                    console.log(`${prefix} ${message}`);
            }
        }
    }
}
// ============================================================
// 导出单例
// ============================================================
let instance = null;
export function createDataSourceManager(config) {
    if (!instance) {
        instance = new DataSourceManager(config);
    }
    return instance;
}
export function getDataSourceManager() {
    if (!instance) {
        instance = new DataSourceManager();
    }
    return instance;
}
export function resetDataSourceManager() {
    if (instance) {
        instance.clear();
        instance = null;
    }
}

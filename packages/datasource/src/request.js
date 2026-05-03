/**
 * HTTP Request Client
 *
 * 基于 Fetch API 的 HTTP 请求客户端
 */
// ============================================================
// 请求构建器
// ============================================================
function buildUrl(baseURL, url, params) {
    const fullUrl = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
    if (!params || Object.keys(params).length === 0) {
        return fullUrl;
    }
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(key, String(v)));
            }
            else {
                searchParams.set(key, String(value));
            }
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
}
function mergeHeaders(defaultHeaders = {}, customHeaders) {
    return {
        ...defaultHeaders,
        ...customHeaders,
    };
}
// ============================================================
// 创建请求实例
// ============================================================
export function createRequest(options = {}) {
    const { baseURL = '', timeout = 30000, headers = {}, withCredentials = false, responseType = 'json', } = options;
    async function request(config) {
        const { url, method = 'GET', params, data, headers: customHeaders, timeout: requestTimeout = timeout, withCredentials: requestCredentials = withCredentials, responseType: requestResponseType = responseType, } = config;
        // 构建完整 URL
        const fullUrl = buildUrl(baseURL, url, method === 'GET' ? params : undefined);
        // 构建请求头
        const requestHeaders = mergeHeaders(headers, customHeaders);
        // 如果没有设置 Content-Type 且有请求体，自动设置
        if (!requestHeaders['Content-Type'] && !requestHeaders['content-type'] && data !== undefined) {
            requestHeaders['Content-Type'] = 'application/json';
        }
        // 创建超时控制器
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), requestTimeout);
        // 构建请求配置
        const fetchOptions = {
            method,
            headers: requestHeaders,
            credentials: requestCredentials ? 'include' : 'omit',
            signal: config.signal
                ? combineSignals(config.signal, timeoutController.signal)
                : timeoutController.signal,
        };
        // 添加请求体
        if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
            if (typeof data === 'string') {
                fetchOptions.body = data;
            }
            else if (data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob) {
                fetchOptions.body = data;
                // 移除自动设置的 Content-Type，让浏览器自动设置
                delete requestHeaders['Content-Type'];
                delete requestHeaders['content-type'];
            }
            else {
                fetchOptions.body = JSON.stringify(data);
            }
        }
        try {
            const response = await fetch(fullUrl, fetchOptions);
            clearTimeout(timeoutId);
            // 解析响应头
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key.toLowerCase()] = value;
            });
            // 解析响应体
            let responseData;
            switch (requestResponseType) {
                case 'text':
                    responseData = (await response.text());
                    break;
                case 'blob':
                    responseData = (await response.blob());
                    break;
                case 'arraybuffer':
                    responseData = (await response.arrayBuffer());
                    break;
                default:
                    responseData = await response.json();
            }
            const apiResponse = {
                data: responseData,
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                config,
            };
            // 处理 HTTP 错误状态码
            if (response.status < 200 || response.status >= 300) {
                const error = {
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                    data: responseData,
                };
                throw error;
            }
            return apiResponse;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                const timeoutError = {
                    message: `Request timeout after ${requestTimeout}ms`,
                    code: 'TIMEOUT',
                };
                throw timeoutError;
            }
            if (error.status !== undefined) {
                throw error;
            }
            // 网络错误
            const networkError = {
                message: error.message || 'Network error',
                code: 'NETWORK_ERROR',
                originalError: error,
            };
            throw networkError;
        }
    }
    // 添加快捷方法
    request.get = (url, config) => request({ url, method: 'GET', ...config });
    request.post = (url, data, config) => request({ url, method: 'POST', data, ...config });
    request.put = (url, data, config) => request({ url, method: 'PUT', data, ...config });
    request.delete = (url, config) => request({ url, method: 'DELETE', ...config });
    request.patch = (url, data, config) => request({ url, method: 'PATCH', data, ...config });
    return request;
}
// ============================================================
// 辅助函数
// ============================================================
/**
 * 合并多个 AbortSignal
 */
function combineSignals(...signals) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    const listeners = [];
    signals.forEach((signal) => {
        if (signal.aborted) {
            abort();
            return;
        }
        const listener = () => {
            abort();
        };
        listeners.push(listener);
        signal.addEventListener('abort', listener);
    });
    // 清理监听器
    controller.signal.addEventListener('abort', () => {
        listeners.forEach((listener, index) => {
            try {
                signals[index].removeEventListener('abort', listener);
            }
            catch {
                // ignore
            }
        });
    });
    return controller.signal;
}
// ============================================================
// 导出默认实例
// ============================================================
export const request = createRequest();

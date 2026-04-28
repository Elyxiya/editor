/**
 * HTTP Request Client
 * 
 * 基于 Fetch API 的 HTTP 请求客户端
 */

import type { ApiRequestConfig, ApiResponse, ApiError } from './types';

// ============================================================
// 请求客户端
// ============================================================

export interface RequestInstance {
  <T = unknown>(config: ApiRequestConfig & { signal?: AbortSignal }): Promise<ApiResponse<T>>;
  get<T = unknown>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  delete<T = unknown>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
}

// ============================================================
// 请求选项
// ============================================================

interface RequestOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

// ============================================================
// 请求构建器
// ============================================================

function buildUrl(baseURL: string, url: string, params?: Record<string, unknown>): string {
  const fullUrl = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;

  if (!params || Object.keys(params).length === 0) {
    return fullUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${fullUrl}?${queryString}` : fullUrl;
}

function mergeHeaders(
  defaultHeaders: Record<string, string> = {},
  customHeaders?: Record<string, string>
): Record<string, string> {
  return {
    ...defaultHeaders,
    ...customHeaders,
  };
}

// ============================================================
// 创建请求实例
// ============================================================

export function createRequest(options: RequestOptions = {}): RequestInstance {
  const {
    baseURL = '',
    timeout = 30000,
    headers = {},
    withCredentials = false,
    responseType = 'json',
  } = options;

  async function request<T>(config: ApiRequestConfig & { signal?: AbortSignal }): Promise<ApiResponse<T>> {
    const {
      url,
      method = 'GET',
      params,
      data,
      headers: customHeaders,
      timeout: requestTimeout = timeout,
      withCredentials: requestCredentials = withCredentials,
      responseType: requestResponseType = responseType,
    } = config;

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
    const fetchOptions: RequestInit = {
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
      } else if (data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob) {
        fetchOptions.body = data;
        // 移除自动设置的 Content-Type，让浏览器自动设置
        delete requestHeaders['Content-Type'];
        delete requestHeaders['content-type'];
      } else {
        fetchOptions.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      // 解析响应头
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      // 解析响应体
      let responseData: T;
      switch (requestResponseType) {
        case 'text':
          responseData = (await response.text()) as T;
          break;
        case 'blob':
          responseData = (await response.blob()) as unknown as T;
          break;
        case 'arraybuffer':
          responseData = (await response.arrayBuffer()) as unknown as T;
          break;
        default:
          responseData = await response.json() as unknown as T;
      }

      const apiResponse: ApiResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        config,
      };

      // 处理 HTTP 错误状态码
      if (response.status < 200 || response.status >= 300) {
        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data: responseData,
        };
        throw error;
      }

      return apiResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        const timeoutError: ApiError = {
          message: `Request timeout after ${requestTimeout}ms`,
          code: 'TIMEOUT',
        };
        throw timeoutError;
      }

      if ((error as ApiError).status !== undefined) {
        throw error;
      }

      // 网络错误
      const networkError: ApiError = {
        message: (error as Error).message || 'Network error',
        code: 'NETWORK_ERROR',
        originalError: error as Error,
      };
      throw networkError;
    }
  }

  // 添加快捷方法
  (request as RequestInstance).get = <T>(url: string, config?: Partial<ApiRequestConfig>) =>
    request<T>({ url, method: 'GET', ...config });

  (request as RequestInstance).post = <T>(
    url: string,
    data?: unknown,
    config?: Partial<ApiRequestConfig>
  ) => request<T>({ url, method: 'POST', data, ...config });

  (request as RequestInstance).put = <T>(
    url: string,
    data?: unknown,
    config?: Partial<ApiRequestConfig>
  ) => request<T>({ url, method: 'PUT', data, ...config });

  (request as RequestInstance).delete = <T>(url: string, config?: Partial<ApiRequestConfig>) =>
    request<T>({ url, method: 'DELETE', ...config });

  (request as RequestInstance).patch = <T>(
    url: string,
    data?: unknown,
    config?: Partial<ApiRequestConfig>
  ) => request<T>({ url, method: 'PATCH', data, ...config });

  return request as RequestInstance;
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 合并多个 AbortSignal
 */
function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  const abort = () => controller.abort();
  const listeners: Array<() => void> = [];

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
      } catch {
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

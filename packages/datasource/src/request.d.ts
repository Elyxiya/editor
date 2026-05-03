/**
 * HTTP Request Client
 *
 * 基于 Fetch API 的 HTTP 请求客户端
 */
import type { ApiRequestConfig, ApiResponse } from './types';
export interface RequestInstance {
    <T = unknown>(config: ApiRequestConfig & {
        signal?: AbortSignal;
    }): Promise<ApiResponse<T>>;
    get<T = unknown>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
    put<T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
    delete<T = unknown>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
    patch<T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
}
interface RequestOptions {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    withCredentials?: boolean;
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}
export declare function createRequest(options?: RequestOptions): RequestInstance;
export declare const request: RequestInstance;
export {};

/**
 * Cache Module
 *
 * 数据缓存模块 - 支持内存、本地存储、会话存储
 */
import type { CacheConfig } from './types';
export interface CacheInstance {
    get<T>(key: string): T | null;
    set<T>(key: string, data: T, expire?: number): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    keys(): string[];
    size(): number;
    clean(): number;
}
export declare function createCache(config?: CacheConfig): CacheInstance;
export declare const cache: CacheInstance;
/**
 * useCache Hook (需要 React 环境)
 */
export declare function createUseCache(reactUseState: typeof import('react').useState): <T>(key: string, initialValue: T, expire?: number) => readonly [T, (newValue: T) => void];

/**
 * Cache Module
 * 
 * 数据缓存模块 - 支持内存、本地存储、会话存储
 */

import type { CacheEntry, CacheConfig } from './types';

// ============================================================
// 缓存条目创建
// ============================================================

function createEntry<T>(key: string, data: T, expire?: number): CacheEntry<T> {
  const now = Date.now();
  return {
    key,
    data,
    createdAt: now,
    expiresAt: expire ? now + expire : Number.MAX_SAFE_INTEGER,
  };
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAt;
}

// ============================================================
// 存储适配器
// ============================================================

interface StorageAdapter<T = unknown> {
  get: (key: string) => CacheEntry<T> | null;
  set: (key: string, entry: CacheEntry<T>) => void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
  size(): number;
}

/**
 * 内存存储
 */
function createMemoryStorage<T = unknown>(): StorageAdapter<T> {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key) {
      return store.get(key) || null;
    },
    set(key, entry: CacheEntry<T>) {
      store.set(key, entry);
    },
    remove(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    keys() {
      return Array.from(store.keys());
    },
    size() {
      return store.size;
    },
  };
}

/**
 * LocalStorage 存储
 */
function createLocalStorageAdapter<T = unknown>(): StorageAdapter<T> {
  const PREFIX = 'lowcode_cache_';

  return {
    get(key) {
      try {
        const item = localStorage.getItem(PREFIX + key);
        if (!item) return null;

        const entry = JSON.parse(item) as CacheEntry<T>;
        if (isExpired(entry as unknown as CacheEntry)) {
          localStorage.removeItem(PREFIX + key);
          return null;
        }

        return entry;
      } catch {
        return null;
      }
    },
    set(key, entry: CacheEntry<T>) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(entry));
      } catch (error) {
        // 如果存储已满，尝试清理过期数据
        if ((error as Error).name === 'QuotaExceededError') {
          this.clear();
          try {
            localStorage.setItem(PREFIX + key, JSON.stringify(entry));
          } catch {
            // 忽略
          }
        }
      }
    },
    remove(key) {
      localStorage.removeItem(PREFIX + key);
    },
    clear() {
      const prefixLen = PREFIX.length;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    },
    keys() {
      const result: string[] = [];
      const prefixLen = PREFIX.length;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          result.push(key.slice(prefixLen));
        }
      }

      return result;
    },
    size() {
      return this.keys().length;
    },
  };
}

/**
 * SessionStorage 存储
 */
function createSessionStorageAdapter<T = unknown>(): StorageAdapter<T> {
  const PREFIX = 'lowcode_cache_';

  return {
    get(key) {
      try {
        const item = sessionStorage.getItem(PREFIX + key);
        if (!item) return null;

        const entry = JSON.parse(item) as CacheEntry<T>;
        if (isExpired(entry as unknown as CacheEntry)) {
          sessionStorage.removeItem(PREFIX + key);
          return null;
        }

        return entry;
      } catch {
        return null;
      }
    },
    set(key, entry: CacheEntry<T>) {
      try {
        sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
      } catch {
        // 忽略
      }
    },
    remove(key) {
      sessionStorage.removeItem(PREFIX + key);
    },
    clear() {
      const prefixLen = PREFIX.length;
      const keysToRemove: string[] = [];

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    },
    keys() {
      const result: string[] = [];
      const prefixLen = PREFIX.length;

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          result.push(key.slice(prefixLen));
        }
      }

      return result;
    },
    size() {
      return this.keys().length;
    },
  };
}

// ============================================================
// 缓存实例
// ============================================================

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

// ============================================================
// 创建缓存实例
// ============================================================

export function createCache(config: CacheConfig = {}): CacheInstance {
  const {
    maxSize = 100,
    defaultExpire = 5 * 60 * 1000,
    storage = 'memory',
  } = config;

  // 创建存储适配器
  let store: StorageAdapter<unknown>;
  switch (storage) {
    case 'localStorage':
      store = createLocalStorageAdapter<unknown>();
      break;
    case 'sessionStorage':
      store = createSessionStorageAdapter<unknown>();
      break;
    default:
      store = createMemoryStorage<unknown>();
  }

  // 获取缓存条目
  function get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (isExpired(entry as unknown as CacheEntry)) {
      store.remove(key);
      return null;
    }

    return entry.data as T;
  }

  // 设置缓存
  function set<T>(key: string, data: T, expire?: number): void {
    // 如果超过最大容量，清理过期数据
    if (store.size() >= maxSize) {
      clean();
    }

    // 如果仍然满，删除最早的条目
    if (store.size() >= maxSize) {
      const oldestKey = store.keys()[0];
      if (oldestKey) {
        store.remove(oldestKey);
      }
    }

    const entry = createEntry(key, data, expire ?? defaultExpire);
    store.set(key, entry);
  }

  // 检查是否存在
  function has(key: string): boolean {
    return get(key) !== null;
  }

  // 删除缓存
  function del(key: string): boolean {
    const existed = store.get(key) !== null;
    store.remove(key);
    return existed;
  }

  // 清空所有缓存
  function clear(): void {
    store.clear();
  }

  // 获取所有 key
  function keys(): string[] {
    return store.keys();
  }

  // 获取缓存数量
  function size(): number {
    return store.size();
  }

  // 清理过期缓存
  function clean(): number {
    const before = store.size();
    store.keys().forEach((key) => {
      const entry = store.get(key);
      if (entry && isExpired(entry as unknown as CacheEntry)) {
        store.remove(key);
      }
    });
    return before - store.size();
  }

  return {
    get,
    set,
    has,
    delete: del,
    clear,
    keys,
    size,
    clean,
  };
}

// ============================================================
// 导出默认实例
// ============================================================

export const cache = createCache();

// ============================================================
// React Hook
// ============================================================

/**
 * useCache Hook (需要 React 环境)
 */
export function createUseCache(reactUseState: typeof import('react').useState) {
  return function useCache<T>(key: string, initialValue: T, expire?: number) {
    const [value, setValue] = reactUseState<T>(() => {
      const cached = cache.get<T>(key);
      return cached !== null ? cached : initialValue;
    });

    const updateCache = (newValue: T) => {
      cache.set(key, newValue, expire);
      setValue(newValue);
    };

    return [value, updateCache] as const;
  };
}

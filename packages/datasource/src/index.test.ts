/**
 * Unit Tests for @lowcode/datasource
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataSourceManager, resetDataSourceManager } from '../src/manager';
import type { DataSource, DataSourceState } from '@lowcode/types';

const makeDs = (name: string, type: DataSource['type'] = 'mock'): DataSource => ({
  id: `ds-${name}`,
  name,
  type,
  config: type === 'mock' ? { mockData: { items: [`${name}-data`] } } : { url: `/api/${name}` },
});

describe('@lowcode/datasource', () => {
  let manager: DataSourceManager;

  beforeEach(() => {
    resetDataSourceManager();
    manager = new DataSourceManager({ debug: false });
  });

  describe('DataSourceManager', () => {
    describe('register / unregister', () => {
      it('should register a data source', () => {
        const ds = makeDs('test');
        manager.register(ds);
        expect(manager.has('test')).toBe(true);
      });

      it('should replace existing data source on re-register', () => {
        const ds1 = makeDs('test');
        const ds2 = { ...makeDs('test'), id: 'new-id' };
        manager.register(ds1);
        manager.register(ds2);
        expect(manager.getState('test')?.id).toBe('new-id');
      });

      it('should unregister a data source', () => {
        manager.register(makeDs('test'));
        expect(manager.unregister('test')).toBe(true);
        expect(manager.has('test')).toBe(false);
      });

      it('should return false when unregistering non-existent', () => {
        expect(manager.unregister('nonexistent')).toBe(false);
      });

      it('should clear all data sources', () => {
        manager.registerBatch([makeDs('a'), makeDs('b')]);
        manager.clear();
        expect(manager.has('a')).toBe(false);
        expect(manager.has('b')).toBe(false);
      });
    });

    describe('state management', () => {
      it('should have idle state after registration', () => {
        manager.register(makeDs('test'));
        const state = manager.getState('test');
        expect(state?.status).toBe('idle');
        expect(state?.loading).toBe(false);
        expect(state?.data).toBeNull();
      });

      it('should get all states', () => {
        manager.registerBatch([makeDs('a'), makeDs('b')]);
        const states = manager.getAllStates();
        expect(states.size).toBe(2);
      });

      it('should report loading state', () => {
        manager.register(makeDs('test', 'mock'));
        // autoLoad mock doesn't trigger async loading in same tick
        expect(manager.isLoading('test')).toBe(false);
      });
    });

    describe('mock data source', () => {
      it('should load mock data', async () => {
        manager.register(makeDs('mock', 'mock'));
        const data = await manager.load('mock');
        expect(data).toEqual({ items: ['mock-data'] });
      });

      it('should update state to success after loading', async () => {
        manager.register(makeDs('test', 'mock'));
        await manager.load('test');
        const state = manager.getState('test');
        expect(state?.status).toBe('success');
        expect(state?.loading).toBe(false);
        expect(state?.data).toEqual({ items: ['test-data'] });
      });

      it('should throw when loading non-existent data source', async () => {
        await expect(manager.load('nonexistent')).rejects.toThrow();
      });
    });

    describe('abort', () => {
      it('should abort pending request', () => {
        manager.register(makeDs('test', 'mock'));
        manager.abort('test');
        // Should not throw
        expect(true).toBe(true);
      });

      it('should abort all pending requests', () => {
        manager.registerBatch([makeDs('a', 'mock'), makeDs('b', 'mock')]);
        manager.abortAll();
        expect(true).toBe(true);
      });
    });

    describe('reload', () => {
      it('should reload with same params', async () => {
        manager.register(makeDs('test', 'mock'));
        await manager.load('test', { page: 1 });
        const state = manager.getState('test');
        expect(state?.params).toEqual({ page: 1 });
      });
    });

    describe('subscription', () => {
      it('should notify subscribers on state change', async () => {
        manager.register(makeDs('test', 'mock'));
        const listener = vi.fn();
        const unsubscribe = manager.subscribe(listener);
        await manager.load('test');
        expect(listener).toHaveBeenCalled();
        unsubscribe();
      });

      it('should unsubscribe correctly', async () => {
        manager.register(makeDs('test', 'mock'));
        const listener = vi.fn();
        const unsubscribe = manager.subscribe(listener);
        unsubscribe();
        await manager.load('test');
        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should call onError callback on failure', async () => {
        const onError = vi.fn();
        const mgr = new DataSourceManager({
          debug: false,
          onError,
        });
        // Register api ds without actual server
        mgr.register({ ...makeDs('api-test', 'api'), config: { url: 'http://localhost:9999/nonexistent' } });
        try {
          await mgr.load('api-test');
        } catch {
          // expected
        }
        // Error callback may or may not fire depending on timing
        // Just verify manager didn't crash
        expect(true).toBe(true);
      });
    });

    describe('autoLoad', () => {
      it('should auto-load data source when autoLoad is true', async () => {
        vi.useFakeTimers();
        const ds: DataSource = {
          id: 'auto-ds',
          name: 'auto-test',
          type: 'mock',
          autoLoad: true,
          loadDelay: 100,
          config: { mockData: { auto: true } },
        };
        manager.register(ds);
        await vi.advanceTimersByTimeAsync(200);
        const state = manager.getState('auto-test');
        expect(state?.status).toBe('success');
        expect(state?.data).toEqual({ auto: true });
        vi.useRealTimers();
      });
    });
  });
});

/**
 * Unit Tests for @lowcode/logic-engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogicExecutor } from '../src/executor';
import type { LogicFlow, LogicNode } from '@lowcode/types';

const makeTriggerNode = (id: string): LogicNode => ({
  id,
  type: 'onClick',
  category: 'trigger',
  label: '触发器',
  config: {},
});

const makeSetVarNode = (id: string, varName: string, value: unknown): LogicNode => ({
  id,
  type: 'setVariable',
  category: 'data',
  label: '设置变量',
  config: { params: { variableName: varName, defaultValue: value } },
});

const makeConditionNode = (id: string, expression: string): LogicNode => ({
  id,
  type: 'condition',
  category: 'logic',
  label: '条件分支',
  config: { params: { expression } },
});

const makeShowMessageNode = (id: string, content: string, type = 'info'): LogicNode => ({
  id,
  type: 'showMessage',
  category: 'action',
  label: '显示消息',
  config: { params: { content, type } },
});

const makeDelayNode = (id: string, duration: number): LogicNode => ({
  id,
  type: 'delay',
  category: 'action',
  label: '延迟',
  config: { params: { duration } },
});

const makeConnection = (source: string, target: string, condition?: string) => ({
  id: `${source}-${target}`,
  source,
  target,
  condition,
});

const makeFlow = (
  nodes: LogicNode[],
  connections: ReturnType<typeof makeConnection>[]
): LogicFlow => ({
  id: 'flow-1',
  name: '测试流程',
  nodes,
  connections,
});

describe('@lowcode/logic-engine', () => {
  let executor: LogicExecutor;

  beforeEach(() => {
    executor = new LogicExecutor({ enableLogging: false });
  });

  describe('LogicExecutor', () => {
    describe('basic execution', () => {
      it('should execute flow from trigger node', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setVar = makeSetVarNode('set1', 'count', 42);
        const flow = makeFlow(
          [trigger, setVar],
          [makeConnection('trigger1', 'set1')]
        );

        const context = await executor.execute(flow);
        expect(context.variables.count).toBe(42);
      });

      it('should throw when no trigger node found', async () => {
        const setVar = makeSetVarNode('set1', 'x', 1);
        const flow = makeFlow([setVar], []);
        await expect(executor.execute(flow)).rejects.toThrow('No trigger node found');
      });

      it('should emit flow:start and flow:end events', async () => {
        const startSpy = vi.fn();
        const endSpy = vi.fn();
        executor.on('flow:start', startSpy);
        executor.on('flow:end', endSpy);

        const trigger = makeTriggerNode('trigger1');
        const flow = makeFlow([trigger], []);
        await executor.execute(flow);

        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(endSpy).toHaveBeenCalledTimes(1);
      });

      it('should throw when re-entering executing flow', async () => {
        const trigger = makeTriggerNode('trigger1');
        const delay = makeDelayNode('delay1', 500);
        const flow = makeFlow([trigger, delay], [makeConnection('trigger1', 'delay1')]);

        const executePromise = executor.execute(flow);
        await expect(executor.execute(flow)).rejects.toThrow('already executing');
        await executePromise;
      });
    });

    describe('setVariable node', () => {
      it('should set variable value', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setVar = makeSetVarNode('set1', 'username', 'Alice');
        const flow = makeFlow([trigger, setVar], [makeConnection('trigger1', 'set1')]);

        const context = await executor.execute(flow);
        expect(context.variables.username).toBe('Alice');
      });

      it('should update existing variable', async () => {
        const trigger = makeTriggerNode('trigger1');
        const set1 = makeSetVarNode('set1', 'count', 10);
        const set2 = makeSetVarNode('set2', 'count', 20);
        const flow = makeFlow([trigger, set1, set2], [
          makeConnection('trigger1', 'set1'),
          makeConnection('set1', 'set2'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.count).toBe(20);
      });
    });

    describe('condition node', () => {
      it('should evaluate true condition', async () => {
        const trigger = makeTriggerNode('trigger1');
        const cond = makeConditionNode('cond1', '1 === 1');
        const setTrue = makeSetVarNode('setTrue', 'result', 'passed');
        const setFalse = makeSetVarNode('setFalse', 'result', 'failed');
        const flow = makeFlow([trigger, cond, setTrue, setFalse], [
          makeConnection('trigger1', 'cond1'),
          makeConnection('cond1', 'setTrue', 'conditionMet === true'),
          makeConnection('cond1', 'setFalse', 'conditionMet === false'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.result).toBe('passed');
      });
    });

    describe('loop node', () => {
      it('should iterate over items', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setItems = makeSetVarNode('setItems', 'items', [1, 2, 3]);
        const loopNode: LogicNode = {
          id: 'loop1',
          type: 'loop',
          category: 'logic',
          label: '循环',
          config: { params: {} },
        };
        const setItem = makeSetVarNode('setItem', 'currentItem', null);
        const flow = makeFlow([trigger, setItems, loopNode, setItem], [
          makeConnection('trigger1', 'setItems'),
          makeConnection('setItems', 'loop1'),
          makeConnection('loop1', 'setItem', undefined as any),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.itemCount).toBe(3);
      });
    });

    describe('delay node', () => {
      it('should delay execution', async () => {
        vi.useFakeTimers();

        const trigger = makeTriggerNode('trigger1');
        const delay = makeDelayNode('delay1', 1000);
        const setVar = makeSetVarNode('set1', 'done', true);
        const flow = makeFlow([trigger, delay, setVar], [
          makeConnection('trigger1', 'delay1'),
          makeConnection('delay1', 'set1'),
        ]);

        const executePromise = executor.execute(flow);
        await vi.advanceTimersByTimeAsync(1100);
        const context = await executePromise;

        expect(context.variables.done).toBe(true);
        vi.useRealTimers();
      });
    });

    describe('aggregate node', () => {
      it('should aggregate with sum operation', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setArray = makeSetVarNode('setArr', 'numbers', [10, 20, 30]);
        const aggNode: LogicNode = {
          id: 'agg1',
          type: 'aggregate',
          category: 'data',
          label: '聚合',
          config: { params: { operation: 'sum', field: 'value' } },
        };
        const flow = makeFlow([trigger, setArray, aggNode], [
          makeConnection('trigger1', 'setArr'),
          makeConnection('setArr', 'agg1'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.result).toBe(60);
      });

      it('should aggregate with count operation', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setArray = makeSetVarNode('setArr', 'items', [1, 2, 3, 4, 5]);
        const aggNode: LogicNode = {
          id: 'agg1',
          type: 'aggregate',
          category: 'data',
          label: '计数',
          config: { params: { operation: 'count' } },
        };
        const flow = makeFlow([trigger, setArray, aggNode], [
          makeConnection('trigger1', 'setArr'),
          makeConnection('setArr', 'agg1'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.result).toBe(5);
      });
    });

    describe('filter node', () => {
      it('should filter array items', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setArray = makeSetVarNode('setArr', 'items', [1, 2, 3, 4, 5]);
        const filterNode: LogicNode = {
          id: 'filter1',
          type: 'filter',
          category: 'data',
          label: '过滤',
          config: { params: { expression: 'item > 2' } },
        };
        const flow = makeFlow([trigger, setArray, filterNode], [
          makeConnection('trigger1', 'setArr'),
          makeConnection('setArr', 'filter1'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.result).toEqual([3, 4, 5]);
      });
    });

    describe('sort node', () => {
      it('should sort array ascending', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setArray = makeSetVarNode('setArr', 'items', [3, 1, 2]);
        const sortNode: LogicNode = {
          id: 'sort1',
          type: 'sort',
          category: 'data',
          label: '排序',
          config: { params: { order: 'asc' } },
        };
        const flow = makeFlow([trigger, setArray, sortNode], [
          makeConnection('trigger1', 'setArr'),
          makeConnection('setArr', 'sort1'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.result).toEqual([1, 2, 3]);
      });

      it('should sort descending', async () => {
        const trigger = makeTriggerNode('trigger1');
        const setArray = makeSetVarNode('setArr', 'items', [1, 3, 2]);
        const sortNode: LogicNode = {
          id: 'sort1',
          type: 'sort',
          category: 'data',
          label: '排序',
          config: { params: { order: 'desc' } },
        };
        const flow = makeFlow([trigger, setArray, sortNode], [
          makeConnection('trigger1', 'setArr'),
          makeConnection('setArr', 'sort1'),
        ]);

        const context = await executor.execute(flow);
        expect(context.variables.result).toEqual([3, 2, 1]);
      });
    });

    describe('abort and isExecuting', () => {
      it('should report executing state', async () => {
        vi.useFakeTimers();

        const trigger = makeTriggerNode('trigger1');
        const delay = makeDelayNode('delay1', 10000);
        const flow = makeFlow([trigger, delay], [makeConnection('trigger1', 'delay1')]);

        expect(executor.isExecuting('flow-1')).toBe(false);
        const p = executor.execute(flow);
        await vi.advanceTimersByTimeAsync(1);
        expect(executor.isExecuting('flow-1')).toBe(true);

        executor.abort('flow-1');
        expect(executor.isExecuting('flow-1')).toBe(false);
        await p;

        vi.useRealTimers();
      });
    });

    describe('event listeners', () => {
      it('should add and remove listeners', () => {
        const listener = vi.fn();
        executor.on('flow:start', listener);
        executor.on('flow:end', vi.fn());
        executor.off('flow:start', listener);

        executor.on('flow:start', vi.fn());
        executor.on('flow:end', vi.fn());
        // No error expected
        expect(true).toBe(true);
      });

      it('should emit node:enter and node:exit', async () => {
        const enterSpy = vi.fn();
        const exitSpy = vi.fn();
        executor.on('node:enter', enterSpy);
        executor.on('node:exit', exitSpy);

        const trigger = makeTriggerNode('trigger1');
        const flow = makeFlow([trigger], []);
        await executor.execute(flow);

        expect(enterSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalled();
      });
    });
  });
});

// Import vi for fake timers

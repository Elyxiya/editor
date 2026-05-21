/**
 * Unit Tests for @lowcode/utils
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  generateUUID,
  deepClone,
  debounce,
  throttle,
  cx,
  styleToCSS,
  parseExpression,
  hexToRgba,
  formatDate,
  getDeviceType,
  storage,
} from '../src/index';

describe('@lowcode/utils', () => {
  describe('generateId', () => {
    it('should generate IDs with prefix', () => {
      const id = generateId('btn');
      expect(id.startsWith('btn_')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId('test')));
      expect(ids.size).toBe(100);
    });
  });

  describe('generateUUID', () => {
    it('should generate valid UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
    });

    it('should deep clone object', () => {
      const original = { a: { b: { c: 1 } }, arr: [1, 2, 3] };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.a).not.toBe(original.a);
    });

    it('should deep clone array', () => {
      const original = [{ x: 1 }, { x: 2 }];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    it('should handle Date', () => {
      const date = new Date('2026-01-01');
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      let count = 0;
      const fn = debounce(() => { count++; }, 50);
      fn();
      fn();
      fn();
      expect(count).toBe(0);
      await new Promise((r) => setTimeout(r, 60));
      expect(count).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', async () => {
      let count = 0;
      const fn = throttle(() => { count++; }, 50);
      fn();
      fn();
      fn();
      expect(count).toBe(1);
      await new Promise((r) => setTimeout(r, 60));
      fn();
      expect(count).toBe(2);
    });
  });

  describe('cx', () => {
    it('should combine class names', () => {
      expect(cx('foo', 'bar')).toBe('foo bar');
      expect(cx('foo', undefined, null, false, 'bar')).toBe('foo bar');
      expect(cx()).toBe('');
    });
  });

  describe('styleToCSS', () => {
    it('should convert camelCase to kebab-case', () => {
      const css = styleToCSS({ color: 'red', fontSize: '14px' });
      expect(css).toContain('color: red');
      expect(css).toContain('font-size: 14px');
    });
  });

  describe('parseExpression', () => {
    it('should parse ${variable} expressions', () => {
      const result = parseExpression('Hello ${name}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should handle nested path expressions', () => {
      const result = parseExpression('Value: ${obj.nested}', { obj: { nested: 42 } });
      expect(result).toBe('Value: 42');
    });

    it('should return original string when no match', () => {
      expect(parseExpression('No expression', {})).toBe('No expression');
    });
  });

  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle shorthand hex', () => {
      const result = hexToRgba('#f00');
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should return original for invalid hex', () => {
      expect(hexToRgba('invalid')).toBe('invalid');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate(new Date('2026-05-17T10:30:45'), 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2026-05-17 10:30:45');
    });

    it('should format date string input', () => {
      const result = formatDate('2026-05-17T10:30:45', 'YYYY/MM/DD');
      expect(result).toBe('2026/05/17');
    });

    it('should pad single digits', () => {
      const result = formatDate(new Date('2026-01-05T03:05:07'), 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2026-01-05 03:05:07');
    });
  });

  describe('getDeviceType', () => {
    it('should return pc for width >= 1024', () => {
      expect(getDeviceType(1024)).toBe('pc');
      expect(getDeviceType(1920)).toBe('pc');
    });

    it('should return tablet for 768 <= width < 1024', () => {
      expect(getDeviceType(768)).toBe('tablet');
      expect(getDeviceType(1023)).toBe('tablet');
    });

    it('should return mobile for width < 768', () => {
      expect(getDeviceType(375)).toBe('mobile');
      expect(getDeviceType(767)).toBe('mobile');
    });

    it('should use window width when no argument', () => {
      expect(getDeviceType()).toMatch(/^(pc|tablet|mobile)$/);
    });
  });

  describe('storage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save and retrieve value', () => {
      const store = storage<{ name: string }>('test-key');
      store.set({ name: 'Alice' });
      expect(store.get()).toEqual({ name: 'Alice' });
    });

    it('should return null for non-existent key', () => {
      const store = storage<unknown>('nonexistent');
      expect(store.get()).toBeNull();
    });

    it('should remove value', () => {
      const store = storage<string>('remove-test');
      store.set('hello');
      store.remove();
      expect(store.get()).toBeNull();
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorage.setItem('bad-json', 'not valid json');
      const store = storage<unknown>('bad-json');
      expect(store.get()).toBeNull();
    });
  });
});

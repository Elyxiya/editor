/**
 * Unit Tests for @lowcode/schema
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateComponentId,
  findComponentById,
  findComponentIndex,
  findComponentPath,
  removeComponentById,
  insertComponent,
  updateComponentProps,
  cloneComponent,
  moveComponent,
  flattenComponents,
  createEmptyPageSchema,
  validateSchemaVersion,
  SchemaValidator,
  swapInSiblings,
  updateComponentInTree,
} from '../src/index';
import type { PageComponent, PageSchema } from '@lowcode/types';

const makeComp = (id: string, children?: PageComponent[]): PageComponent => ({
  id,
  type: 'Container',
  props: {},
  ...(children ? { children } : {}),
});

describe('@lowcode/schema', () => {
  describe('generateComponentId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateComponentId();
      const id2 = generateComponentId();
      expect(id1).toMatch(/^comp_[a-f0-9]{32}$/);
      expect(id2).toMatch(/^comp_[a-f0-9]{32}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('findComponentById', () => {
    const tree: PageComponent[] = [
      makeComp('a', [
        makeComp('b'),
        makeComp('c', [makeComp('d')]),
      ]),
    ];

    it('should find component at root', () => {
      expect(findComponentById(tree, 'a')?.id).toBe('a');
    });

    it('should find nested component', () => {
      expect(findComponentById(tree, 'd')?.id).toBe('d');
    });

    it('should return null for non-existent', () => {
      expect(findComponentById(tree, 'nonexistent')).toBeNull();
    });
  });

  describe('findComponentIndex', () => {
    it('should return correct index', () => {
      const comps = [makeComp('a'), makeComp('b'), makeComp('c')];
      expect(findComponentIndex(comps, 'b')).toBe(1);
      expect(findComponentIndex(comps, 'nonexistent')).toBe(-1);
    });
  });

  describe('findComponentPath', () => {
    const tree: PageComponent[] = [
      makeComp('a', [makeComp('b', [makeComp('c')])]),
    ];

    it('should return path to component', () => {
      expect(findComponentPath(tree, 'c')).toEqual(['a', 'b']);
    });

    it('should return empty array for root component', () => {
      expect(findComponentPath(tree, 'a')).toEqual([]);
    });

    it('should return null for non-existent', () => {
      expect(findComponentPath(tree, 'z')).toBeNull();
    });
  });

  describe('removeComponentById', () => {
    it('should remove component', () => {
      const tree = [makeComp('a'), makeComp('b'), makeComp('c')];
      const result = removeComponentById(tree, 'b');
      expect(result.map((c) => c.id)).toEqual(['a', 'c']);
    });

    it('should remove nested component', () => {
      const tree = [makeComp('a', [makeComp('b', [makeComp('c')])])];
      const result = removeComponentById(tree, 'c');
      expect(result[0].children?.map((c) => c.id)).toEqual(['b']);
    });

    it('should return unchanged for non-existent', () => {
      const tree = [makeComp('a')];
      expect(removeComponentById(tree, 'z')).toEqual(tree);
    });
  });

  describe('insertComponent', () => {
    const tree: PageComponent[] = [makeComp('a'), makeComp('b')];
    const newComp = makeComp('new');

    it('should insert at start when no targetId', () => {
      const result = insertComponent(tree, null, newComp, 'inside');
      expect(result[0].id).toBe('new');
    });

    it('should insert before target', () => {
      const result = insertComponent(tree, 'b', newComp, 'before');
      expect(result.map((c) => c.id)).toEqual(['a', 'new', 'b']);
    });

    it('should insert after target', () => {
      const result = insertComponent(tree, 'a', newComp, 'after');
      expect(result.map((c) => c.id)).toEqual(['a', 'new', 'b']);
    });

    it('should insert inside container', () => {
      const container = makeComp('container', [makeComp('child')]);
      const result = insertComponent([container], 'container', newComp, 'inside');
      expect(result[0].children?.map((c) => c.id)).toEqual(['child', 'new']);
    });

    it('should insert inside container at specific index', () => {
      const container = makeComp('container', [makeComp('a'), makeComp('c')]);
      const result = insertComponent([container], 'container', newComp, 'inside', 1);
      expect(result[0].children?.map((c) => c.id)).toEqual(['a', 'new', 'c']);
    });
  });

  describe('updateComponentProps', () => {
    it('should update props at root', () => {
      const tree = [makeComp('a', undefined)];
      const result = updateComponentProps(tree, 'a', { padding: 16 });
      expect((result[0].props as any).padding).toBe(16);
    });

    it('should update nested props', () => {
      const tree = [makeComp('a', [makeComp('b')])];
      const result = updateComponentProps(tree, 'b', { color: 'red' });
      expect((result[0].children![0].props as any).color).toBe('red');
    });
  });

  describe('cloneComponent', () => {
    it('should create deep clone with new ID', () => {
      const comp: PageComponent = {
        id: 'orig',
        type: 'Button',
        label: 'Original',
        props: { text: 'Hello' },
        children: [{ id: 'child1', type: 'Text', props: { text: 'Child' } }],
      };
      const cloned = cloneComponent(comp);
      expect(cloned.id).not.toBe('orig');
      expect(cloned.label).toBe('Original (copy)');
      expect(cloned.props.text).toBe('Hello');
      expect(cloned.children![0].id).not.toBe('child1');
    });
  });

  describe('moveComponent', () => {
    it('should move component to new position', () => {
      const tree = [makeComp('a'), makeComp('b'), makeComp('c')];
      const result = moveComponent(tree, 'c', 'a', 'after');
      expect(result.map((c) => c.id)).toEqual(['a', 'c', 'b']);
    });

    it('should return unchanged when source not found', () => {
      const tree = [makeComp('a')];
      expect(moveComponent(tree, 'nonexistent', 'a', 'after')).toEqual(tree);
    });
  });

  describe('flattenComponents', () => {
    it('should flatten nested tree', () => {
      const tree = [
        makeComp('a', [
          makeComp('b', [makeComp('c')]),
          makeComp('d'),
        ]),
      ];
      const flat = flattenComponents(tree);
      expect(flat.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('createEmptyPageSchema', () => {
    it('should create valid empty schema', () => {
      const schema = createEmptyPageSchema('我的页面');
      expect(schema.version).toBe('1.0.0');
      expect(schema.page.title).toBe('我的页面');
      expect(schema.page.layout).toBe('flex');
      expect(schema.page.components).toEqual([]);
      expect(schema.dataSources).toEqual({});
      expect(schema.logic).toEqual({});
    });

    it('should use default title', () => {
      const schema = createEmptyPageSchema();
      expect(schema.page.title).toBe('未命名页面');
    });
  });

  describe('validateSchemaVersion', () => {
    it('should accept valid version 1.x', () => {
      const schema: PageSchema = { ...createEmptyPageSchema(), version: '1.0.0' };
      expect(validateSchemaVersion(schema).valid).toBe(true);
    });

    it('should accept valid version 2.x', () => {
      const schema: PageSchema = { ...createEmptyPageSchema(), version: '2.0.0' };
      expect(validateSchemaVersion(schema).valid).toBe(true);
    });

    it('should reject 0.x version', () => {
      const schema: PageSchema = { ...createEmptyPageSchema(), version: '0.1.0' };
      expect(validateSchemaVersion(schema).valid).toBe(false);
    });

    it('should reject version > 2.x', () => {
      const schema: PageSchema = { ...createEmptyPageSchema(), version: '3.0.0' };
      expect(validateSchemaVersion(schema).valid).toBe(false);
    });
  });

  describe('SchemaValidator', () => {
    it('should validate correct schema', () => {
      const validator = new SchemaValidator();
      const schema: PageSchema = createEmptyPageSchema();
      expect(validator.validate(schema).valid).toBe(true);
    });

    it('should reject schema missing required fields', () => {
      const validator = new SchemaValidator();
      const result = validator.validate({ page: {} });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid layout', () => {
      const validator = new SchemaValidator();
      const result = validator.validate({
        version: '1.0.0',
        page: { title: 'Test', layout: 'invalid', props: {}, components: [] },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('swapInSiblings', () => {
    it('should swap component with previous sibling', () => {
      const comps = [makeComp('a'), makeComp('b'), makeComp('c')];
      const result = swapInSiblings(comps, 'b', 'up');
      expect(result.map((c) => c.id)).toEqual(['b', 'a', 'c']);
    });

    it('should swap component with next sibling', () => {
      const comps = [makeComp('a'), makeComp('b'), makeComp('c')];
      const result = swapInSiblings(comps, 'b', 'down');
      expect(result.map((c) => c.id)).toEqual(['a', 'c', 'b']);
    });

    it('should return unchanged at boundary', () => {
      const comps = [makeComp('a'), makeComp('b')];
      expect(swapInSiblings(comps, 'a', 'up')).toEqual(comps);
      expect(swapInSiblings(comps, 'b', 'down')).toEqual(comps);
    });
  });

  describe('updateComponentInTree', () => {
    it('should update at root level', () => {
      const comps = [makeComp('a'), makeComp('b')];
      const result = updateComponentInTree(comps, 'b', (siblings) =>
        siblings.map((c) => (c.id === 'b' ? { ...c, props: { updated: true } } : c))
      );
      expect((result[1].props as any).updated).toBe(true);
    });

    it('should update inside container', () => {
      const comps = [makeComp('container', [makeComp('child')])];
      const result = updateComponentInTree(comps, 'child', (siblings) =>
        siblings.map((c) => ({ ...c, props: { found: true } }))
      );
      expect((result[0].children![0].props as any).found).toBe(true);
    });
  });
});

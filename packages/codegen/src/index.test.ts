/**
 * Unit Tests for @lowcode/codegen
 */

import { describe, it, expect } from 'vitest';
import {
  generateCode,
  generatePreviewCode,
  optimizeSchema,
  generateZipContent,
} from '../src/index';
import type { PageSchema } from '@lowcode/types';

const createSchema = (overrides: Partial<PageSchema> = {}): PageSchema => ({
  version: '1.0.0',
  page: {
    title: '测试页面',
    description: '这是一个测试页面',
    layout: 'flex',
    props: { padding: 16, background: '#ffffff' },
    components: [],
  },
  dataSources: {},
  logic: {},
  ...overrides,
});

const defaultOptions = {
  projectName: 'test-project',
  pageName: 'test-page',
  useTypeScript: true,
  useCSSModules: false,
  useTailwind: false,
};

describe('@lowcode/codegen', () => {
  describe('generateCode', () => {
    it('should generate page component file', () => {
      const schema = createSchema();
      const result = generateCode(schema, defaultOptions);
      const pageFile = result.files.find((f) => f.path.includes('.tsx'));
      expect(pageFile).toBeDefined();
      expect(pageFile!.content).toContain('测试页面');
      expect(pageFile!.content).toContain('React');
    });

    it('should generate project configuration files', () => {
      const schema = createSchema();
      const result = generateCode(schema, defaultOptions);
      expect(result.files.find((f) => f.path === 'package.json')).toBeDefined();
      expect(result.files.find((f) => f.path === 'tsconfig.json')).toBeDefined();
      expect(result.files.find((f) => f.path === 'vite.config.ts')).toBeDefined();
      expect(result.files.find((f) => f.path === 'index.html')).toBeDefined();
    });

    it('should generate chart components when used in schema', () => {
      const schema = createSchema({
        page: {
          title: '仪表盘',
          layout: 'flex',
          props: {},
          components: [
            {
              id: 'chart1',
              type: 'LineChart',
              props: { title: '销售趋势' },
            },
          ],
        },
      });
      const result = generateCode(schema, defaultOptions);
      expect(result.files.find((f) => f.path.includes('LineChart.tsx'))).toBeDefined();
      expect(result.dependencies).toContain('echarts');
      expect(result.dependencies).toContain('echarts-for-react');
    });

    it('should collect correct dependencies from components', () => {
      const schema = createSchema({
        page: {
          title: '表单页',
          layout: 'flex',
          props: {},
          components: [
            { id: 'c1', type: 'Button', props: {} },
            { id: 'c2', type: 'Input', props: {} },
            { id: 'c3', type: 'Table', props: {} },
          ],
        },
      });
      const result = generateCode(schema, defaultOptions);
      expect(result.dependencies).toContain('dayjs');
    });

    it('should generate README with page info', () => {
      const schema = createSchema({ page: { ...createSchema().page, description: '测试描述' } });
      const result = generateCode(schema, defaultOptions);
      const readme = result.files.find((f) => f.path === 'README.md');
      expect(readme).toBeDefined();
      expect(readme!.content).toContain('测试页面');
      expect(readme!.content).toContain('测试描述');
    });

    it('should include data source hooks in generated code', () => {
      const schema = createSchema({
        dataSources: {
          userList: {
            id: 'ds1',
            name: 'userList',
            type: 'api',
            config: { url: '/api/users', method: 'GET' },
          },
        },
      });
      const result = generateCode(schema, defaultOptions);
      const pageFile = result.files.find((f) => f.path.includes('.tsx'));
      expect(pageFile!.content).toContain('useuserList');
      expect(pageFile!.content).toContain('fetchUserList');
    });
  });

  describe('generatePreviewCode', () => {
    it('should generate HTML preview', () => {
      const schema = createSchema();
      const preview = generatePreviewCode(schema, defaultOptions);
      expect(preview).toContain('<!DOCTYPE html>');
      expect(preview).toContain('测试页面');
      expect(preview).toContain('cdnjs.cloudflare.com');
    });
  });

  describe('optimizeSchema', () => {
    it('should remove empty children arrays', () => {
      const schema = createSchema({
        page: {
          title: 'Test',
          layout: 'flex',
          props: {},
          components: [
            { id: 'c1', type: 'Button', props: {}, children: [] },
          ],
        },
      });
      const optimized = optimizeSchema(schema);
      expect(optimized.page.components[0].children).toBeUndefined();
    });

    it('should remove undefined prop values', () => {
      const schema = createSchema({
        page: {
          title: 'Test',
          layout: 'flex',
          props: {},
          components: [
            { id: 'c1', type: 'Button', props: { text: 'hi', extra: undefined } },
          ],
        },
      });
      const optimized = optimizeSchema(schema);
      expect(Object.keys(optimized.page.components[0].props)).not.toContain('extra');
    });
  });

  describe('generateZipContent', () => {
    it('should return map of path to content', () => {
      const schema = createSchema();
      const result = generateCode(schema, defaultOptions);
      const zip = generateZipContent(result);
      expect(zip.size).toBe(result.files.length);
      for (const file of result.files) {
        expect(zip.get(file.path)).toBe(file.content);
      }
    });
  });

  describe('component code generation', () => {
    it('should generate Text component correctly', () => {
      const schema = createSchema({
        page: {
          title: 'Test',
          layout: 'flex',
          props: {},
          components: [
            { id: 'c1', type: 'Text', label: '文本组件', props: { text: 'Hello World' } },
          ],
        },
      });
      const result = generateCode(schema, defaultOptions);
      const pageFile = result.files.find((f) => f.path.includes('.tsx'));
      expect(pageFile!.content).toContain('Typography.Text');
      expect(pageFile!.content).toContain('Hello World');
    });

    it('should generate Button component', () => {
      const schema = createSchema({
        page: {
          title: 'Test',
          layout: 'flex',
          props: {},
          components: [
            { id: 'c1', type: 'Button', props: { text: '提交', disabled: false } },
          ],
        },
      });
      const result = generateCode(schema, defaultOptions);
      const pageFile = result.files.find((f) => f.path.includes('.tsx'));
      expect(pageFile!.content).toContain('Button');
    });

    it('should generate Card with children', () => {
      const schema = createSchema({
        page: {
          title: 'Test',
          layout: 'flex',
          props: {},
          components: [
            {
              id: 'card1',
              type: 'Card',
              props: { title: '卡片标题' },
              children: [
                { id: 'btn1', type: 'Button', props: { text: '按钮' } },
              ],
            },
          ],
        },
      });
      const result = generateCode(schema, defaultOptions);
      const pageFile = result.files.find((f) => f.path.includes('.tsx'));
      expect(pageFile!.content).toContain('Card');
      expect(pageFile!.content).toContain('卡片标题');
      expect(pageFile!.content).toContain('Button');
    });
  });
});

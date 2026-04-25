/**
 * 代码导出服务 - Code Export Service
 * 负责将 Schema 转换为可下载的代码文件
 */

import type { PageSchema, Page } from '@lowcode/types';
import { generateCode, type CodeGenOptions } from '@lowcode/codegen';

// ============================================================
// 工具函数
// ============================================================

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function kebabToPascalCase(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// ============================================================
// 导出选项
// ============================================================

export interface ExportOptions {
  projectName?: string;
  pageName?: string;
  useTypeScript?: boolean;
  format?: 'zip' | 'json';
}

const defaultOptions: Required<ExportOptions> = {
  projectName: 'exported-project',
  pageName: 'page',
  useTypeScript: true,
  format: 'json'
};

// ============================================================
// 导出函数
// ============================================================

/**
 * 生成代码并返回所有文件列表
 */
export function generateExportCode(
  schema: PageSchema,
  page: Page,
  options: ExportOptions = {}
) {
  const opts = { ...defaultOptions, ...options };

  const codegenOptions: CodeGenOptions = {
    projectName: opts.projectName || page.title || 'exported-project',
    pageName: opts.pageName || page.name || 'page',
    useTypeScript: opts.useTypeScript ?? true,
    useCSSModules: false,
    useTailwind: false
  };

  const result = generateCode(schema, codegenOptions);

  return {
    files: result.files,
    pageComponentName: kebabToPascalCase(codegenOptions.pageName),
    projectName: codegenOptions.projectName
  };
}

/**
 * 导出页面 Schema（JSON 格式）
 */
export function exportSchema(schema: PageSchema, pageName: string = 'page'): void {
  const jsonContent = JSON.stringify(schema, null, 2);
  const filename = `${pageName.replace(/\s+/g, '-').toLowerCase()}-schema.json`;
  downloadFile(filename, jsonContent, 'application/json');
}

/**
 * 导出为多文件 JSON 结构（便于用户手动整理）
 */
export function exportAsJsonBundle(
  schema: PageSchema,
  page: Page,
  options: ExportOptions = {}
): void {
  const { files, pageComponentName } = generateExportCode(schema, page, options);

  const bundle = {
    meta: {
      pageName: page.name,
      pageTitle: page.title,
      version: page.version,
      exportedAt: new Date().toISOString(),
      totalFiles: files.length,
      entryFile: `src/pages/${pageComponentName}.tsx`
    },
    files: files.map(f => ({
      path: f.path,
      language: f.language,
      content: f.content
    }))
  };

  const jsonContent = JSON.stringify(bundle, null, 2);
  const filename = `${pageComponentName.toLowerCase()}-export.json`;
  downloadFile(filename, jsonContent, 'application/json');
}

/**
 * 导出单个文件内容供复制使用
 */
export function exportSingleFile(
  schema: PageSchema,
  page: Page,
  filePath: string,
  options: ExportOptions = {}
): string {
  const { files } = generateExportCode(schema, page, options);
  const targetFile = files.find(f => f.path === filePath);
  return targetFile?.content || '';
}

/**
 * 获取所有可导出的文件列表
 */
export function getExportFiles(
  schema: PageSchema,
  page: Page,
  options: ExportOptions = {}
) {
  return generateExportCode(schema, page, options);
}

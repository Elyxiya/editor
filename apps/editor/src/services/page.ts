/**
 * 页面服务 - Page Service
 * 包含页面 CRUD 和版本管理功能
 */

import { api } from './api';
import type { PageSchema, Page } from '@lowcode/types';

// ============================================================
// 类型定义
// ============================================================

export interface PageVersion {
  version: number;
  schema: string;
  createdAt: string;
  comment?: string;
}

export interface CreatePageParams {
  name: string;
  title: string;
  description?: string;
  schema: PageSchema;
}

export interface UpdatePageParams {
  schema: PageSchema;
  comment?: string;
}

export interface ExportResult {
  pageId: string;
  pageName: string;
  pageTitle: string;
  version: number;
  format: string;
  generatedAt: string;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取所有页面列表
 */
export async function getPages(): Promise<Page[]> {
  const response = await api.get<{ success: boolean; data: Page[] }>('/pages');
  return response.data || [];
}

/**
 * 获取单个页面详情
 */
export async function getPage(id: string): Promise<Page | null> {
  try {
    const response = await api.get<{ success: boolean; data: Page }>(`/pages/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * 创建新页面
 */
export async function createPage(params: CreatePageParams): Promise<Page> {
  const response = await api.post<{ success: boolean; data: Page }>('/pages', params);
  return response.data!;
}

/**
 * 更新页面（会自动保存版本）
 */
export async function updatePage(id: string, params: UpdatePageParams): Promise<Page> {
  const response = await api.put<{ success: boolean; data: Page }>(`/pages/${id}`, params);
  return response.data!;
}

/**
 * 删除页面
 */
export async function deletePage(id: string): Promise<void> {
  await api.delete(`/pages/${id}`);
}

/**
 * 获取页面版本历史
 */
export async function getPageVersions(id: string): Promise<PageVersion[]> {
  const response = await api.get<{ success: boolean; data: PageVersion[] }>(`/pages/${id}/versions`);
  return response.data || [];
}

/**
 * 获取指定版本的 Schema
 */
export async function getPageVersion(id: string, version: number): Promise<PageVersion | null> {
  try {
    const response = await api.get<{ success: boolean; data: PageVersion }>(
      `/pages/${id}/versions/${version}`
    );
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * 回滚到指定版本
 */
export async function rollbackPage(id: string, version: number): Promise<{
  data: Page;
  message: string;
}> {
  const response = await api.post<{ success: boolean; data: Page; message: string }>(
    `/pages/${id}/rollback/${version}`
  );
  return response as any;
}

/**
 * 发布页面
 */
export async function publishPage(id: string): Promise<Page> {
  const response = await api.post<{ success: boolean; data: Page }>(`/pages/${id}/publish`);
  return response.data!;
}

/**
 * 取消发布页面
 */
export async function unpublishPage(id: string): Promise<Page> {
  const response = await api.post<{ success: boolean; data: Page }>(`/pages/${id}/unpublish`);
  return response.data!;
}

/**
 * 获取导出信息
 */
export async function getExportInfo(id: string): Promise<ExportResult> {
  const response = await api.get<{ success: boolean; data: ExportResult }>(`/pages/${id}/export`);
  return response.data!;
}

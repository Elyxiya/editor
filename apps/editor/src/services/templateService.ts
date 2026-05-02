/**
 * Template service — uses centralized api.ts for consistent auth header injection
 */

import { api } from './api';

export interface Template {
  id: string;
  name: string;
  title: string;
  description?: string;
  category: string;
  thumbnail?: string;
  componentCount: number;
  tags: string[];
  isPublic: boolean;
  schema: any;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  title: string;
  description?: string;
  category: string;
  thumbnail?: string;
  componentCount: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  value: string;
  label: string;
  count: number;
}

export async function fetchTemplates(params?: {
  category?: string;
  search?: string;
  isPublic?: boolean;
}): Promise<TemplateListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.isPublic !== undefined) searchParams.set('isPublic', String(params.isPublic));

  return api.get<TemplateListItem[]>(`/templates?${searchParams}`);
}

export async function fetchTemplate(id: string): Promise<Template> {
  return api.get<Template>(`/templates/${id}`);
}

export async function createTemplate(payload: {
  name: string;
  title: string;
  description?: string;
  category?: string;
  schema: any;
  tags?: string[];
  isPublic?: boolean;
}): Promise<Template> {
  return api.post<Template>('/templates', payload);
}

export async function updateTemplate(
  id: string,
  payload: Partial<{
    name: string;
    title: string;
    description: string;
    category: string;
    schema: any;
    tags: string[];
    isPublic: boolean;
  }>
): Promise<Template> {
  return api.put<Template>(`/templates/${id}`, payload);
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

export async function fetchTemplateCategories(): Promise<TemplateCategory[]> {
  return api.get<TemplateCategory[]>('/templates/meta/categories');
}

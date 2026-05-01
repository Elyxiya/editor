const API_BASE = '/api';

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

  const res = await fetch(`${API_BASE}/templates?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json();
  return data.data;
}

export async function fetchTemplate(id: string): Promise<Template> {
  const res = await fetch(`${API_BASE}/templates/${id}`);
  if (!res.ok) throw new Error('Failed to fetch template');
  const data = await res.json();
  return data.data;
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
  const res = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create template');
  const data = await res.json();
  return data.data;
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
  const res = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update template');
  const data = await res.json();
  return data.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete template');
}

export async function fetchTemplateCategories(): Promise<TemplateCategory[]> {
  const res = await fetch(`${API_BASE}/templates/meta/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.data;
}

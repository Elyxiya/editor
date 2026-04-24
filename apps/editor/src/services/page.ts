import { api } from './api';
import type { PageSchema } from '@lowcode/types';

export interface Page {
  id: string;
  name: string;
  title: string;
  description?: string;
  schema: PageSchema;
  version: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const pageService = {
  getAll: () =>
    api.get<Page[]>('/api/pages'),

  getById: (id: string) =>
    api.get<Page>(`/api/pages/${id}`),

  create: (data: { name: string; title: string; description?: string; schema: PageSchema }) =>
    api.post<Page>('/api/pages', data),

  update: (id: string, schema: PageSchema, comment?: string) =>
    api.put<Page>(`/api/pages/${id}`, { schema, comment }),

  delete: (id: string) =>
    api.delete<void>(`/api/pages/${id}`),

  publish: (id: string) =>
    api.post<Page>(`/api/pages/${id}/publish`),

  getVersions: (id: string) =>
    api.get<any[]>(`/api/pages/${id}/versions`),
};

import { api } from './api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  pages: string[];
  createdAt: string;
  updatedAt: string;
}

export const projectService = {
  getAll: () =>
    api.get<Project[]>('/api/projects'),

  getById: (id: string) =>
    api.get<Project>(`/api/projects/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/api/projects', data),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<Project>(`/api/projects/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/api/projects/${id}`),
};

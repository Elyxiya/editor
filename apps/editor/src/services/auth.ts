import { api } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: (params: LoginParams) =>
    api.post<AuthResponse>('/api/auth/login', params),

  register: (params: RegisterParams) =>
    api.post<AuthResponse>('/api/auth/register', params),

  getCurrentUser: () =>
    api.get<User>('/api/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  setAuth: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

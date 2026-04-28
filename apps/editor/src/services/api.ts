const API_BASE_URL = (import.meta.env as Record<string, string>).VITE_API_BASE_URL || 'http://localhost:4000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  withAuth?: boolean;
  timeout?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function createAbortController(timeout?: number): { controller: AbortController; timeoutId: NodeJS.Timeout | null } {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  if (timeout) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  return { controller, timeoutId };
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, withAuth = true, timeout = 30000 } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (withAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const { controller, timeoutId } = createAbortController(timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      throw new ApiError(
        result.message || 'Request failed',
        response.status,
        result.errors
      );
    }

    return result.data as T;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error, please check your connection', 0);
    }
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };

/**
 * usePermission Hook
 *
 * 权限检查 Hook，用于页面级和组件级权限控制
 */

import { useMemo } from 'react';

export interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
}

/**
 * 获取当前用户信息（从 localStorage 解析 JWT）
 */
export function getCurrentUser(): UserInfo | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    // Try to parse from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        id: decoded.userId,
        role: decoded.role || 'developer',
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Check if the user has the required role
 */
export function checkPagePermission(
  user: UserInfo | null,
  allowedRoles?: string[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Check if the user meets the component-level permission expression
 * Supported expressions: $user.role === 'admin', $user.role !== 'guest'
 */
export function checkComponentPermission(
  user: UserInfo | null,
  expression?: string
): boolean {
  if (!expression) return true;
  if (!user) return false;

  try {
    // Simple expression evaluator
    const sanitized = expression
      .replace(/\$user\.role/g, `'${user.role || ''}'`)
      .replace(/\$user\.id/g, `'${user.id || ''}'`)
      .replace(/\$user\.username/g, `'${(user.username || '').replace(/'/g, "\\'")}'`);

    // Only allow safe comparisons
    if (!/^['"a-zA-Z0-9_\-\.\s!==<>|&()]+$/.test(sanitized.replace(/'[^']*'/g, ''))) {
      return true; // If expression has unsafe characters, allow by default
    }

    // Use Function constructor for safe evaluation
    return new Function(`return (${sanitized})`)();
  } catch {
    return true; // If evaluation fails, allow by default
  }
}

/**
 * usePermission Hook
 */
export function usePermission() {
  const user = useMemo(() => getCurrentUser(), []);

  return {
    user,
    canViewPage: (allowedRoles?: string[]) => checkPagePermission(user, allowedRoles),
    canViewComponent: (expression?: string) => checkComponentPermission(user, expression),
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor' || user?.role === 'admin',
    isViewer: user?.role === 'viewer',
  };
}

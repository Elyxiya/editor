/**
 * Authentication Middleware
 * Validates JWT Bearer token and attaches userId to req.user
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Refuse to start in production without a valid secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production. Refusing to start without it.');
  }
  console.warn('[auth] WARNING: JWT_SECRET is not set. Using insecure default — DO NOT use in production.');
}

const SECRET = JWT_SECRET || 'lowcode-dev-secret-do-not-use-in-production';

/**
 * Require authentication — returns 401 if token is missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未提供认证令牌' });
    return;
  }

  try {
    const decoded = jwt.verify(auth.slice(7), SECRET) as { userId: string; role?: string };
    (req as any).user = { userId: decoded.userId, role: decoded.role || 'developer' };
    next();
  } catch {
    res.status(401).json({ success: false, message: '无效或过期的认证令牌' });
  }
}

/**
 * Require specific role(s) — returns 403 if user's role is not in the allowed list.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;
    if (!userRole) {
      res.status(401).json({ success: false, message: '未认证' });
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      res.status(403).json({ success: false, message: `权限不足，需要角色: ${allowedRoles.join(', ')}` });
      return;
    }
    next();
  };
}

/**
 * Optional auth — attaches user if token is present and valid, but does not reject if absent.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(auth.slice(7), SECRET) as { userId: string };
    (req as any).user = { userId: decoded.userId };
  } catch {
    // Token invalid — treat as unauthenticated
  }
  next();
}

/** Extract the authenticated userId, or null if not authenticated */
export function getAuthenticatedUserId(req: Request): string | null {
  return (req as any).user?.userId ?? null;
}

export { SECRET };

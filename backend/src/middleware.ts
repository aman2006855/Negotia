import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type AuthUser } from './auth';

export interface AuthedRequest extends Request { user?: AuthUser; }

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

export function requireRole(role: 'CLIENT' | 'FREELANCER') {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ error: `Must be a ${role}` });
    next();
  };
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AuthUser {
  id: string;
  role: 'CLIENT' | 'FREELANCER';
  name: string;
  email: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtTtl },
  );
}

export function verifyToken(token: string | undefined): AuthUser | null {
  if (!token) return null;
  try {
    const p = jwt.verify(token, config.jwtSecret) as {
      sub: string; role: string; name: string; email: string;
    };
    if (p.role !== 'CLIENT' && p.role !== 'FREELANCER') return null;
    return { id: p.sub, role: p.role as AuthUser['role'], name: p.name, email: p.email };
  } catch {
    return null;
  }
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, h: string) => bcrypt.compare(pw, h);

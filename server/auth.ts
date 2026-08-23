import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ProfileRecord } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'new_miami_restaurant_jwt_secure_key_naivasha';

export interface AuthRequest extends Request {
  user?: ProfileRecord;
}

export function generateToken(profile: Pick<ProfileRecord, 'id' | 'email' | 'role'>): string {
  return jwt.sign(
    { userId: profile.id, email: profile.email, role: profile.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  const decoded = verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });
  next();
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.slice(7));
    if (decoded) req.user = undefined;
  }
  next();
}

export function adminOnlyMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
}

export function isValidKenyanPhone(phone: string): boolean {
  return /^(?:\+254|254|0)(?:7|1)\d{8}$/.test(phone.replace(/[\s-]/g, ''));
}

export function formatKenyanPhone(phone: string): string {
  const clean = phone.replace(/[\s-]/g, '');
  if (clean.startsWith('+254')) return clean;
  if (clean.startsWith('254')) return `+${clean}`;
  if (clean.startsWith('0')) return `+254${clean.slice(1)}`;
  return clean;
}

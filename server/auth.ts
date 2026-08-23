import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, ProfileRecord } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'new_miami_restaurant_jwt_secure_key_naivasha';

export interface AuthRequest extends Request {
  user?: ProfileRecord;
}

export function generateToken(profile: ProfileRecord): string {
  return jwt.sign(
    {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    },
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

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }

  const profile = db.findProfileById(payload.userId);
  if (!profile) {
    res.status(401).json({ error: 'User profile not found' });
    return;
  }

  req.user = profile;
  next();
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const profile = db.findProfileById(payload.userId);
      if (profile) {
        req.user = profile;
      }
    }
  }
  next();
}

export function adminOnlyMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Admin role required' });
    return;
  }
  next();
}

export function isValidKenyanPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Matches 07xxxxxxxx, 01xxxxxxxx, +2547xxxxxxxx, +2541xxxxxxxx, 2547xxxxxxxx, 2541xxxxxxxx
  const kenyanRegex = /^(?:254|\+254|0)?([71][0-9]{8})$/;
  return kenyanRegex.test(cleaned);
}

export function formatKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const match = cleaned.match(/^(?:254|\+254|0)?([71][0-9]{8})$/);
  if (match) {
    return '0' + match[1];
  }
  return phone;
}

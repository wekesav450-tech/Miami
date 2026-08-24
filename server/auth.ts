import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, type ProfileRecord } from './db.ts';

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

async function getSupabaseProfile(token: string): Promise<ProfileRecord | null> {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
  if (!url || !key) return null;
  const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${token}` };
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers });
  if (!userResponse.ok) return null;
  const authUser = await userResponse.json() as { id: string; email?: string };
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id)}&select=*`, { headers });
  if (!profileResponse.ok) return null;
  const profiles = await profileResponse.json() as ProfileRecord[];
  return profiles[0] || null;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  const token = authHeader.slice(7);

  // Accept the current Supabase access token used by the frontend.
  const supabaseProfile = await getSupabaseProfile(token);
  if (supabaseProfile) { req.user = supabaseProfile; return next(); }

  // Backward-compatible fallback for older locally issued tokens.
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });
  const profile = db.findProfileById(decoded.userId);
  if (!profile) return res.status(401).json({ error: 'User account not found' });
  req.user = profile;
  next();
}

export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    req.user = await getSupabaseProfile(token) || undefined;
    if (!req.user) {
      const decoded = verifyToken(token);
      if (decoded) req.user = db.findProfileById(decoded.userId);
    }
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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findProfileById } from '../../server/supabase-db.js';
import { verifyToken } from '../../server/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
    const token = verifyToken(h.slice(7));
    if (!token) return res.status(401).json({ error: 'Invalid or expired token' });

    const profile = await findProfileById(token.userId);
    if (!profile) return res.status(401).json({ error: 'User account not found' });

    return res.status(200).json({
      profile: { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, created_at: profile.created_at, updated_at: profile.updated_at },
    });
  } catch (error) {
    console.error('Auth me API failed:', error);
    return res.status(500).json({ error: 'Failed to verify session', detail: error instanceof Error ? error.message : String(error) });
  }
}

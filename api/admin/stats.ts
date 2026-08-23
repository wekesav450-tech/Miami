import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../server/db.ts';
import { verifyToken } from '../../../server/auth.ts';

function admin(req: VercelRequest, res: VercelResponse) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required' }); return false; }
  const token = verifyToken(header.slice(7));
  if (!token) { res.status(401).json({ error: 'Invalid or expired token' }); return false; }
  const user = db.findProfileById(token.userId);
  if (!user || user.role !== 'admin') { res.status(403).json({ error: 'Administrator access required' }); return false; }
  return true;
}
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!admin(req, res)) return;
    return res.status(200).json({ stats: db.getAdminStats() });
  } catch (error) {
    console.error('Admin stats API failed:', error);
    return res.status(500).json({ error: 'Failed to compute admin statistics', detail: error instanceof Error ? error.message : String(error) });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db.ts';
import { verifyToken } from '../../server/auth.ts';
function admin(req: VercelRequest, res: VercelResponse) {
  const h = req.headers.authorization || ''; if (!h.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required' }); return false; }
  const t = verifyToken(h.slice(7)); if (!t) { res.status(401).json({ error: 'Invalid or expired token' }); return false; }
  const u = db.findProfileById(t.userId); if (!u || u.role !== 'admin') { res.status(403).json({ error: 'Administrator access required' }); return false; } return true;
}
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!admin(req, res)) return;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    return res.status(200).json({ reservations: db.getReservations({ status }) });
  } catch (error) {
    console.error('Admin reservations API failed:', error);
    return res.status(500).json({ error: 'Failed to retrieve reservations', detail: error instanceof Error ? error.message : String(error) });
  }
}

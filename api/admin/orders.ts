import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseOrders } from '../../server/supabase-orders.js';
import { findProfileById } from '../../server/supabase-db.js';
import { verifyToken } from '../../server/auth.js';

async function admin(req: VercelRequest, res: VercelResponse) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }

  const t = verifyToken(h.slice(7));
  if (!t) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return false;
  }

  const u = await findProfileById(t.userId);
  if (!u || u.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required' });
    return false;
  }

  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!(await admin(req, res))) return;

    const orderStatus = typeof req.query.order_status === 'string' ? req.query.order_status : undefined;
    const paymentStatus = typeof req.query.payment_status === 'string' ? req.query.payment_status : undefined;
    const orders = await getSupabaseOrders({ orderStatus, paymentStatus });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Admin orders API failed:', error);
    return res.status(500).json({
      error: 'Failed to retrieve orders',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

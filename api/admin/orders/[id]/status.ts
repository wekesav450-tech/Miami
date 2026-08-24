import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findProfileById } from '../../../../server/supabase-db.js';
import { verifyToken } from '../../../../server/auth.js';

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']);

function getSupabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable');
  return { url: rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''), key: key.trim() };
}

async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required' }); return false; }
  const token = verifyToken(h.slice(7));
  if (!token) { res.status(401).json({ error: 'Invalid or expired token' }); return false; }
  const user = await findProfileById(token.userId);
  if (!user || user.role !== 'admin') { res.status(403).json({ error: 'Administrator access required' }); return false; }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
    if (!(await requireAdmin(req, res))) return;
    const id = typeof req.query.id === 'string' ? req.query.id : Array.isArray(req.query.id) ? req.query.id[0] : undefined;
    const order_status = req.body?.order_status;
    if (!id) return res.status(400).json({ error: 'Order ID is required' });
    if (typeof order_status !== 'string' || !ALLOWED_STATUSES.has(order_status)) return res.status(400).json({ error: 'Invalid order status' });

    const { url, key } = getSupabaseConfig();
    const response = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ order_status, updated_at: new Date().toISOString() }),
    });
    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to update order status', detail: text });
    const rows = text ? JSON.parse(text) : [];
    if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ order: rows[0] });
  } catch (error) {
    console.error('Order status update failed:', error);
    return res.status(500).json({ error: 'Failed to update order status', detail: error instanceof Error ? error.message : String(error) });
  }
}

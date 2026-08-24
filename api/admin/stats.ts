import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findProfileById } from '../../server/supabase-db.js';
import { verifyToken } from '../../server/auth.js';

function getSupabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable');
  return { url: rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''), key: key.trim() };
}

async function admin(req: VercelRequest, res: VercelResponse) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required' }); return false; }
  const t = verifyToken(h.slice(7));
  if (!t) { res.status(401).json({ error: 'Invalid or expired token' }); return false; }
  const u = await findProfileById(t.userId);
  if (!u || u.role !== 'admin') { res.status(403).json({ error: 'Administrator access required' }); return false; }
  return true;
}

async function supabaseRows(path: string) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!(await admin(req, res))) return;

    const orders = await supabaseRows('orders?select=id,total_amount,payment_status,order_status,created_at');
    const paidOrders = orders.filter((o: any) => o.payment_status === 'paid');
    const pendingOrders = orders.filter((o: any) => o.order_status === 'pending');
    const completedOrders = orders.filter((o: any) => o.order_status === 'completed');
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

    const stats = {
      total_orders: orders.length,
      pending_orders: pendingOrders.length,
      completed_orders: completedOrders.length,
      total_revenue: totalRevenue,
      paid_orders: paidOrders.length,
      total_reservations: 0,
      pending_reservations: 0,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      paidOrders: paidOrders.length,
      totalReservations: 0,
      pendingReservations: 0,
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Admin stats API failed:', error);
    return res.status(500).json({ error: 'Failed to compute admin statistics', detail: error instanceof Error ? error.message : String(error) });
  }
}

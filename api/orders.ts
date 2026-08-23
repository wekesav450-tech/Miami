import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseOrder } from '../server/supabase-orders.js';
import { findProfileById } from '../server/supabase-db.js';
import { verifyToken } from '../server/auth.js';

function cleanPhone(phone: string) {
  const clean = phone.replace(/[\s-]/g, '');
  if (/^(?:\+254|254|0)(?:7|1)\d{8}$/.test(clean)) {
    if (clean.startsWith('+254')) return clean;
    if (clean.startsWith('254')) return `+${clean}`;
    return `+254${clean.slice(1)}`;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const { customer_name, customer_phone, customer_email, order_type, delivery_address, notes, payment_method, transaction_reference, items } = body;

    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide your full name' });
    }
    const phone = typeof customer_phone === 'string' ? cleanPhone(customer_phone) : null;
    if (!phone) return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
    if (!['pickup', 'delivery', 'dine_in'].includes(order_type)) return res.status(400).json({ error: 'Invalid order type' });
    if (order_type === 'delivery' && (!delivery_address || String(delivery_address).trim().length < 4)) {
      return res.status(400).json({ error: 'Please provide a detailed delivery address in Naivasha' });
    }
    if (!['mpesa_pochi', 'paywave_express'].includes(payment_method)) return res.status(400).json({ error: 'Invalid payment method' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty. Please select menu items.' });
    for (const item of items) {
      if (!item?.menu_item_id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
        return res.status(400).json({ error: 'Invalid item quantity in order' });
      }
    }

    let customerId: string | null = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const decoded = verifyToken(auth.slice(7));
      if (decoded) {
        const profile = await findProfileById(decoded.userId);
        if (profile) customerId = profile.id;
      }
    }

    const result = await createSupabaseOrder({
      customer_id: customerId,
      customer_name,
      customer_phone: phone,
      customer_email: customer_email || null,
      order_type,
      delivery_address: delivery_address || null,
      notes: notes || null,
      payment_method,
      transaction_reference,
      items: items.map((item: any) => ({ menu_item_id: String(item.menu_item_id), quantity: Number(item.quantity) })),
    });

    return res.status(201).json({
      order: result.order,
      items: result.items,
      payment: result.payment,
      pochiNumber: '0741775878',
      pochiName: 'New Miami Restaurant',
    });
  } catch (error) {
    console.error('[Orders] Supabase order creation failed:', error);
    return res.status(500).json({
      error: 'Failed to place order',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

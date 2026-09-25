import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { getSupabaseCategories, getSupabaseMenuItems, updateSupabaseMenuItem } from './server/supabase-menu.ts';
import { createSupabaseOrder, getSupabaseOrders, updateSupabaseOrderStatus, updateSupabaseOrderPayment } from './server/supabase-orders.ts';
import { createSupabaseReservation, getSupabaseReservations, updateSupabaseReservationStatus } from './server/supabase-reservations.ts';
import { generateToken, verifyToken, authMiddleware, optionalAuthMiddleware, adminOnlyMiddleware, isValidKenyanPhone, formatKenyanPhone, AuthRequest } from './server/auth.js';
import { realtimeHub } from './server/realtime.js';

async function createApp() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'New Miami Restaurant Backend API', location: 'Naivasha, Kenya', phone: '0741775878', currency: 'KES', realtimeClients: realtimeHub.getConnectedClientsCount(), timestamp: new Date().toISOString() }));


  // Customer registration uses Supabase Auth + the profiles table so it matches the
  // frontend's Supabase login flow. The server key never reaches the browser.
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { full_name, email, phone, password } = req.body || {};
      if (!full_name || String(full_name).trim().length < 2) return res.status(400).json({ error: 'Please provide your full name' });
      if (!email || !/^\S+@\S+\.\S+$/.test(String(email).trim())) return res.status(400).json({ error: 'Please provide a valid email address' });
      if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      const cleanPhone = String(phone || '').trim().replace(/[\s()\-]/g, '');
      if (!isValidKenyanPhone(cleanPhone)) return res.status(400).json({ error: 'Please provide a valid Kenyan phone number' });

      const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
      const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
      if (!url || !key) return res.status(500).json({ error: 'Supabase server authentication is not configured' });

      const createResponse = await fetch(url + '/auth/v1/admin/users', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim().toLowerCase(), password: String(password), email_confirm: true, user_metadata: { full_name: String(full_name).trim(), phone: formatKenyanPhone(cleanPhone) } }),
      });
      const createdText = await createResponse.text();
      let created: any = {};
      try { created = createdText ? JSON.parse(createdText) : {}; } catch {}
      if (!createResponse.ok) {
        const msg = created?.msg || created?.message || created?.error_description || created?.error || createdText;
        if (createResponse.status === 422 && /already|exist|registered/i.test(String(msg))) return res.status(409).json({ error: 'An account with this email already exists' });
        return res.status(400).json({ error: msg || 'Unable to create account' });
      }

      const userId = created.id;
      const profileResponse = await fetch(url + '/rest/v1/profiles', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ id: userId, full_name: String(full_name).trim(), email: String(email).trim().toLowerCase(), phone: formatKenyanPhone(cleanPhone), role: 'customer' }),
      });
      const profileText = await profileResponse.text();
      let profile: any = {};
      try { profile = profileText ? JSON.parse(profileText) : {}; } catch {}
      if (!profileResponse.ok) {
        console.error('Profile creation after registration failed:', profileText);
        return res.status(500).json({ error: 'Account was created but the customer profile could not be created' });
      }

      // Sign in through Supabase Auth so the frontend receives a real access token.
      const loginResponse = await fetch(url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim().toLowerCase(), password: String(password) }),
      });
      const loginText = await loginResponse.text();
      let session: any = {};
      try { session = loginText ? JSON.parse(loginText) : {}; } catch {}
      if (!loginResponse.ok || !session.access_token) return res.status(201).json({ profile: Array.isArray(profile) ? profile[0] : profile, token: '' });
      res.status(201).json({ profile: Array.isArray(profile) ? profile[0] : profile, token: session.access_token });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: err.message || 'Failed to register account' });
    }
  });

  // Menu is persistent in Supabase. Vercel must never write menu state to the server filesystem.
  app.get('/api/menu/categories', async (_req, res) => {
    try { res.json({ categories: await getSupabaseCategories() }); }
    catch (err: any) { console.error('Fetch categories error:', err); res.status(500).json({ error: err.message || 'Failed to retrieve menu categories' }); }
  });

  app.get('/api/menu/items', async (req, res) => {
    try { res.json({ items: await getSupabaseMenuItems(req.query.all === 'true') }); }
    catch (err: any) { console.error('Fetch menu items error:', err); res.status(500).json({ error: err.message || 'Failed to retrieve menu items' }); }
  });

  app.patch('/api/admin/menu/items/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
      const { is_available, price_kes, name, description, is_featured, image_url } = req.body;
      const updated = await updateSupabaseMenuItem(req.params.id, { is_available, price_kes: price_kes !== undefined ? Number(price_kes) : undefined, name, description, is_featured, image_url });
      if (!updated) return res.status(404).json({ error: 'Menu item not found' });
      realtimeHub.broadcastPublic('menu_updated', updated);
      res.json({ item: updated });
    } catch (err: any) { console.error('Update menu item error:', err); res.status(500).json({ error: err.message || 'Failed to update menu item' }); }
  });

  // Reservations use Supabase as the persistent source of truth on Vercel.
  app.post('/api/reservations', optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const { customer_name, customer_phone, customer_email, reservation_date, reservation_time, party_size, number_of_guests, special_requests } = req.body;
      if (!customer_name || String(customer_name).trim().length < 2) return res.status(400).json({ error: 'Please provide your full name' });
      const phone = String(customer_phone || '').trim().replace(/[\s()\-]/g, '');
      if (!phone || !isValidKenyanPhone(phone)) return res.status(400).json({ error: 'Please provide a valid Kenyan phone number (e.g. 0741775878, 254741775878, +254741775878, or 741775878)' });
      if (!reservation_date || !reservation_time) return res.status(400).json({ error: 'Please select a reservation date and time' });
      const size = Number(party_size ?? number_of_guests);
      if (!Number.isInteger(size) || size < 1 || size > 50) return res.status(400).json({ error: 'Party size must be between 1 and 50' });
      const customerId = req.user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.user.id) ? req.user.id : null;
      const reservation = await createSupabaseReservation({ customer_id: customerId, customer_name: String(customer_name).trim(), customer_phone: formatKenyanPhone(phone), customer_email: customer_email || req.user?.email || null, reservation_date, reservation_time, number_of_guests: size, special_requests: special_requests || null });
      realtimeHub.broadcastOrderEvent('reservation_created', reservation);
      res.status(201).json({ reservation, restaurantPhone: '0741775878', message: 'Reservation received successfully' });
    } catch (err: any) { console.error('Reservation booking error:', err); res.status(500).json({ error: err.message || 'Failed to create reservation' }); }
  });

  app.post('/api/orders', optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const { customer_name, customer_phone, customer_email, order_type, delivery_address, notes, payment_method, transaction_reference, items } = req.body;
      if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) return res.status(400).json({ error: 'Please provide your full name' });
      if (!customer_phone || !isValidKenyanPhone(customer_phone)) return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
      if (!['pickup', 'delivery', 'dine_in'].includes(order_type)) return res.status(400).json({ error: 'Invalid order type' });
      if (order_type === 'delivery' && (!delivery_address || delivery_address.trim().length < 4)) return res.status(400).json({ error: 'Please provide a detailed delivery address' });
      if (!['mpesa_pochi', 'paywave_express'].includes(payment_method)) return res.status(400).json({ error: 'Invalid payment method' });
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty. Please select menu items.' });
      const result = await createSupabaseOrder({ customer_id: req.user?.id || null, customer_name, customer_phone: formatKenyanPhone(customer_phone), customer_email: customer_email || req.user?.email || null, order_type, delivery_address, notes, payment_method, transaction_reference, items });
      res.status(201).json({ order: result.order, items: result.items, payment: result.payment, pochiNumber: '0741775878', pochiName: 'New Miami Restaurant' });
    } catch (err: any) { console.error('Supabase order creation error:', err); res.status(400).json({ error: err.message || 'Failed to place order' }); }
  });


  // Customer order/reservation history and public settings.
  app.get('/api/orders/track/:orderNumber', async (req, res) => {
    try {
      const orders = await getSupabaseOrders();
      const order = orders.find((o: any) => String(o.order_number || '').toUpperCase() === String(req.params.orderNumber || '').trim().toUpperCase());
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const [items, payments] = await Promise.all([
        (async () => {
          const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
          const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
          if (!url || !key) return [];
          const r = await fetch(url + '/rest/v1/order_items?order_id=eq.' + encodeURIComponent(order.id) + '&select=*', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
          return r.ok ? await r.json() : [];
        })(),
        (async () => {
          const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
          const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
          if (!url || !key) return [];
          const r = await fetch(url + '/rest/v1/payments?order_id=eq.' + encodeURIComponent(order.id) + '&select=*', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
          return r.ok ? await r.json() : [];
        })()
      ]);
      res.json({ order: { ...order, items, payment: payments[0] } });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to track order' }); }
  });

  app.get('/api/orders/my-orders', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const orders = await getSupabaseOrders();
      const mine = orders.filter((o: any) => o.customer_id === req.user?.id);
      res.json({ orders: mine });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to load your orders' }); }
  });

  app.get('/api/reservations/my-reservations', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const reservations = await getSupabaseReservations();
      res.json({ reservations: reservations.filter((r: any) => r.customer_id === req.user?.id) });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to load your reservations' }); }
  });

  app.get('/api/settings', async (_req, res) => {
    try {
      const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
      const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
      if (!url || !key) return res.status(500).json({ error: 'Supabase server configuration is missing' });
      const r = await fetch(url + '/rest/v1/settings?select=delivery_fee_kes,currency,business_name,pochi_number,phone,address&limit=1', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
      if (!r.ok) throw new Error(await r.text());
      const rows = await r.json();
      res.json({ settings: rows[0] || { delivery_fee_kes: 150, currency: 'KES', business_name: 'New Miami Restaurant', pochi_number: '0741775878', phone: '0741775878', address: 'Kenyatta Avenue, Naivasha, Kenya' } });
    } catch (err: any) { console.error('Public settings error:', err); res.status(500).json({ error: 'Failed to load restaurant settings' }); }
  });

  app.post('/api/payments/mpesa-pochi/submit-reference', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { order_id, transaction_reference } = req.body || {};
      if (!order_id || !transaction_reference || String(transaction_reference).trim().length < 5) return res.status(400).json({ error: 'Please provide a valid M-Pesa transaction reference' });
      const orders = await getSupabaseOrders();
      const order = orders.find((o: any) => o.id === order_id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.customer_id && order.customer_id !== req.user?.id) return res.status(403).json({ error: 'You can only submit payment for your own order' });
      const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
      const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
      const r = await fetch(url + '/rest/v1/payments?order_id=eq.' + encodeURIComponent(order_id), { method: 'PATCH', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ transaction_reference: String(transaction_reference).trim().toUpperCase() }) });
      if (!r.ok) throw new Error(await r.text());
      res.json({ success: true, message: 'M-Pesa reference submitted. Payment remains pending until verified by authorized staff.' });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to submit payment reference' }); }
  });

  app.post('/api/payments/paywave/initiate', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { order_id } = req.body || {};
      const orders = await getSupabaseOrders();
      const order = orders.find((o: any) => o.id === order_id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.customer_id && order.customer_id !== req.user?.id) return res.status(403).json({ error: 'You can only initiate payment for your own order' });
      res.json({ status: 'manual_pochi', configured: false, message: 'PayWave is not configured. Please pay by M-Pesa Pochi and submit the transaction reference.', pochiNumber: order.payment_method === 'mpesa_pochi' ? '0741775878' : '0741775878', pochiName: 'New Miami Restaurant' });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to initialize payment' }); }
  });

  app.patch('/api/admin/settings', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
      const allowed = ['delivery_fee_kes', 'phone', 'address', 'business_name', 'pochi_number', 'currency'];
      const updates: Record<string, unknown> = {};
      for (const key of allowed) if (req.body?.[key] !== undefined) updates[key] = req.body[key];
      updates.updated_at = new Date().toISOString();
      const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
      const secret = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
      if (!url || !secret) return res.status(500).json({ error: 'Supabase server configuration is missing' });
      const r = await fetch(url + '/rest/v1/settings', { method: 'PATCH', headers: { apikey: secret, Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(updates) });
      if (!r.ok) throw new Error(await r.text());
      const rows = await r.json();
      res.json({ settings: rows[0] || updates });
    } catch (err: any) { console.error('Admin settings update error:', err); res.status(500).json({ error: err.message || 'Failed to update settings' }); }
  });

  // Admin statistics endpoint restored; failures here no longer remove the order queue.
  app.get('/api/admin/stats', authMiddleware, adminOnlyMiddleware, async (_req, res) => {
    try {
      const orders = await getSupabaseOrders();
      const reservations = await getSupabaseReservations();
      const menuItems = await getSupabaseMenuItems(true);
      const today = new Date().toISOString().slice(0, 10);
      const paidOrders = orders.filter((o: any) => o.payment_status === 'paid');
      const totalRevenueKes = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      const todayRevenueKes = paidOrders.filter((o: any) => String(o.created_at || '').slice(0, 10) === today).reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      res.json({ stats: {
        totalRevenueKes,
        totalOrdersCount: orders.length,
        pendingOrdersCount: orders.filter((o: any) => o.order_status === 'pending').length,
        completedOrdersCount: orders.filter((o: any) => o.order_status === 'completed').length,
        activeReservationsCount: reservations.filter((r: any) => ['pending', 'confirmed', 'seated'].includes(r.status)).length,
        totalMenuItemsCount: menuItems.length,
        todayRevenueKes,
      }});
    } catch (err: any) { console.error('Admin stats error:', err); res.status(500).json({ error: err.message || 'Failed to load admin statistics' }); }
  });

  app.get('/api/admin/orders', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try { res.json({ orders: await getSupabaseOrders({ orderStatus: req.query.order_status as string, paymentStatus: req.query.payment_status as string }) }); }
    catch (err: any) { console.error('Fetch admin orders error:', err); res.status(500).json({ error: 'Failed to retrieve orders' }); }
  });

  app.patch('/api/admin/orders/:id/status', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try { const { order_status } = req.body; const updated = await updateSupabaseOrderStatus(req.params.id, order_status); if (!updated) return res.status(404).json({ error: 'Order not found' }); realtimeHub.broadcastOrderEvent('order_updated', updated); res.json({ order: updated }); }
    catch (err: any) { res.status(500).json({ error: err.message || 'Failed to update order status' }); }
  });

  app.patch('/api/admin/orders/:id/payment', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try { const { payment_status, transaction_reference } = req.body; const updated = await updateSupabaseOrderPayment(req.params.id, payment_status, transaction_reference); if (!updated) return res.status(404).json({ error: 'Order not found' }); realtimeHub.broadcastOrderEvent('order_updated', updated); res.json({ order: updated }); }
    catch (err: any) { res.status(500).json({ error: err.message || 'Failed to update payment status' }); }
  });

  app.get('/api/admin/reservations', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try { res.json({ reservations: await getSupabaseReservations(typeof req.query.status === 'string' ? req.query.status : undefined) }); }
    catch (err: any) { console.error('Fetch admin reservations error:', err); res.status(500).json({ error: err.message || 'Failed to load reservations' }); }
  });

  app.patch('/api/admin/reservations/:id/status', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try { const { status } = req.body; if (!['pending', 'confirmed', 'seated', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid reservation status' }); const reservation = await updateSupabaseReservationStatus(req.params.id, status); if (!reservation) return res.status(404).json({ error: 'Reservation not found' }); realtimeHub.broadcastOrderEvent('reservation_updated', reservation); res.json({ reservation }); }
    catch (err: any) { console.error('Update reservation status error:', err); res.status(500).json({ error: err.message || 'Failed to update reservation status' }); }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  return app;
}

let appPromise: ReturnType<typeof createApp> | undefined;
export function getApp() { if (!appPromise) appPromise = createApp(); return appPromise; }
if (process.env.VERCEL !== '1') getApp().then(app => app.listen(3000, '0.0.0.0')).catch(err => console.error('Fatal server boot error:', err));

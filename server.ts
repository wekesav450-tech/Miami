import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
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

  // Menu remains backed by the existing seeded menu data so dishes are preserved.
  app.get('/api/menu/categories', (_req, res) => {
    try { res.json({ categories: db.getCategories() }); }
    catch (err: any) { console.error('Fetch categories error:', err); res.status(500).json({ error: 'Failed to retrieve menu categories' }); }
  });

  app.get('/api/menu/items', (req, res) => {
    try { res.json({ items: db.getMenuItems(req.query.all === 'true') }); }
    catch (err: any) { console.error('Fetch menu items error:', err); res.status(500).json({ error: 'Failed to retrieve menu items' }); }
  });

  app.patch('/api/admin/menu/items/:id', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const { is_available, price_kes, name, description, is_featured, image_url } = req.body;
      const updated = db.updateMenuItem(req.params.id, { is_available, price_kes: price_kes !== undefined ? Number(price_kes) : undefined, name, description, is_featured, image_url });
      if (!updated) return res.status(404).json({ error: 'Menu item not found' });
      realtimeHub.broadcastPublic('menu_updated', updated);
      res.json({ item: updated });
    } catch (err: any) { console.error('Update menu item error:', err); res.status(500).json({ error: 'Failed to update menu item' }); }
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

  // Admin statistics endpoint restored; failures here no longer remove the order queue.
  app.get('/api/admin/stats', authMiddleware, adminOnlyMiddleware, async (_req, res) => {
    try {
      const orders = await getSupabaseOrders();
      const reservations = await getSupabaseReservations();
      const menuItems = db.getMenuItems(true);
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

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { createSupabaseOrder, getSupabaseOrders, updateSupabaseOrderStatus, updateSupabaseOrderPayment } from './server/supabase-orders.ts';
import {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  adminOnlyMiddleware,
  isValidKenyanPhone,
  formatKenyanPhone,
  AuthRequest,
} from './server/auth.js';
import { realtimeHub } from './server/realtime.js';

async function createApp() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'New Miami Restaurant Backend API',
      location: 'Naivasha, Kenya',
      phone: '0741775878',
      currency: 'KES',
      realtimeClients: realtimeHub.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/realtime/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const clientId = 'conn_' + crypto.randomBytes(6).toString('hex');
    const rawToken = (req.query.token as string) || (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
    let role: 'admin' | 'customer' | 'guest' = 'guest';
    let userId: string | undefined = undefined;
    if (rawToken) {
      const decoded = verifyToken(rawToken);
      if (decoded) {
        role = decoded.role as 'admin' | 'customer';
        userId = decoded.userId;
      }
    }
    realtimeHub.registerClient(clientId, res, role, userId);
  });

  app.get('/api/settings', (_req, res) => {
    try {
      const settings = db.getSettings();
      res.json({ settings });
    } catch (err: any) {
      console.error('Fetch settings error:', err);
      res.status(500).json({ error: 'Failed to fetch restaurant settings' });
    }
  });

  app.patch('/api/admin/settings', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const { delivery_fee_kes, phone, address, business_name, pochi_number } = req.body;
      const updates: any = {};
      if (typeof delivery_fee_kes === 'number' && delivery_fee_kes >= 0) updates.delivery_fee_kes = delivery_fee_kes;
      if (phone && typeof phone === 'string') updates.phone = phone.trim();
      if (address && typeof address === 'string') updates.address = address.trim();
      if (business_name && typeof business_name === 'string') updates.business_name = business_name.trim();
      if (pochi_number && typeof pochi_number === 'string') updates.pochi_number = pochi_number.trim();
      const updated = db.updateSettings(updates);
      realtimeHub.broadcastPublic('settings_updated', updated);
      res.json({ settings: updated, message: 'Settings updated successfully' });
    } catch (err: any) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Failed to update restaurant settings' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    try {
      const { full_name, email, phone, password } = req.body;
      if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) return res.status(400).json({ error: 'Please provide a valid full name' });
      if (!email || typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ error: 'Please provide a valid email address' });
      if (!phone || !isValidKenyanPhone(phone)) return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
      if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      const existing = db.findProfileByEmail(email);
      if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(password, salt);
      const profile = db.createProfile({ full_name, email, phone: formatKenyanPhone(phone), password_hash, role: 'customer' });
      const token = generateToken(profile);
      const safeProfile = { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, created_at: profile.created_at, updated_at: profile.updated_at };
      res.status(201).json({ profile: safeProfile, token });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      const profile = db.findProfileByEmail(email);
      if (!profile) return res.status(401).json({ error: 'Invalid email or password' });
      const passwordMatch = bcrypt.compareSync(password, profile.password_hash);
      if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password' });
      const token = generateToken(profile);
      const safeProfile = { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, created_at: profile.created_at, updated_at: profile.updated_at };
      res.json({ profile: safeProfile, token });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const safeProfile = { id: req.user.id, full_name: req.user.full_name, email: req.user.email, phone: req.user.phone, role: req.user.role, created_at: req.user.created_at, updated_at: req.user.updated_at };
    res.json({ profile: safeProfile });
  });

  app.get('/api/menu/categories', (_req, res) => {
    try {
      const categories = db.getCategories();
      res.json({ categories });
    } catch (err: any) {
      console.error('Fetch categories error:', err);
      res.status(500).json({ error: 'Failed to retrieve menu categories' });
    }
  });

  app.get('/api/menu/items', (req, res) => {
    try {
      const includeUnavailable = req.query.all === 'true';
      const items = db.getMenuItems(includeUnavailable);
      res.json({ items });
    } catch (err: any) {
      console.error('Fetch menu items error:', err);
      res.status(500).json({ error: 'Failed to retrieve menu items' });
    }
  });

  app.patch('/api/admin/menu/items/:id', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const itemId = req.params.id;
      const { is_available, price_kes, name, description, is_featured } = req.body;
      const updated = db.updateMenuItem(itemId, { is_available, price_kes: price_kes ? Number(price_kes) : undefined, name, description, is_featured });
      if (!updated) return res.status(404).json({ error: 'Menu item not found' });
      realtimeHub.broadcastPublic('menu_updated', updated);
      res.json({ item: updated });
    } catch (err: any) {
      console.error('Update menu item error:', err);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  });

  app.post('/api/orders', optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const { customer_name, customer_phone, customer_email, order_type, delivery_address, notes, payment_method, transaction_reference, items } = req.body;
      if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) return res.status(400).json({ error: 'Please provide your full name' });
      if (!customer_phone || !isValidKenyanPhone(customer_phone)) return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
      const validOrderTypes = ['pickup', 'delivery', 'dine_in'];
      if (!validOrderTypes.includes(order_type)) return res.status(400).json({ error: 'Invalid order type' });
      if (order_type === 'delivery' && (!delivery_address || delivery_address.trim().length < 4)) return res.status(400).json({ error: 'Please provide a detailed delivery address' });
      const validPaymentMethods = ['mpesa_pochi', 'paywave_express'];
      if (!validPaymentMethods.includes(payment_method)) return res.status(400).json({ error: 'Invalid payment method' });
      if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty. Please select menu items.' });
      for (const it of items) if (!it.menu_item_id || !it.quantity || it.quantity < 1) return res.status(400).json({ error: 'Invalid item quantity in order' });

      // Orders have one production source of truth: Supabase.
      const result = await createSupabaseOrder({
        customer_id: req.user ? req.user.id : null,
        customer_name,
        customer_phone: formatKenyanPhone(String(customer_phone).replace(/[\s-]/g, '')),
        customer_email: customer_email || (req.user ? req.user.email : null),
        order_type,
        delivery_address,
        notes,
        payment_method,
        transaction_reference,
        items,
      });
      res.status(201).json({ order: result.order, items: result.items, payment: result.payment, pochiNumber: '0741775878', pochiName: 'New Miami Restaurant' });
    } catch (err: any) {
      console.error('Supabase order creation error:', err);
      res.status(400).json({ error: err.message || 'Failed to place order' });
    }
  });

  app.get('/api/orders/track/:orderNumber', (req, res) => {
    try {
      const orderNumber = req.params.orderNumber;
      if (!orderNumber) return res.status(400).json({ error: 'Order number is required' });
      const orderData = db.getOrderByIdOrNumber(orderNumber);
      if (!orderData) return res.status(404).json({ error: 'Order not found with that number' });
      res.json({ order: orderData });
    } catch (err: any) {
      console.error('Track order error:', err);
      res.status(500).json({ error: 'Failed to retrieve order tracking' });
    }
  });

  app.get('/api/orders/my-orders', authMiddleware, (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const orders = db.getOrders({ customerId: req.user.id });
      res.json({ orders });
    } catch (err: any) {
      console.error('Fetch customer orders error:', err);
      res.status(500).json({ error: 'Failed to retrieve your orders' });
    }
  });

  app.get('/api/admin/orders', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
      const orderStatus = req.query.order_status as string;
      const paymentStatus = req.query.payment_status as string;
      const orders = await getSupabaseOrders({ orderStatus, paymentStatus });
      res.json({ orders });
    } catch (err: any) {
      console.error('Fetch admin orders error:', err);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });

  app.patch('/api/admin/orders/:id/status', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { order_status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
      if (!validStatuses.includes(order_status)) return res.status(400).json({ error: 'Invalid order status' });
      const updated = await updateSupabaseOrderStatus(orderId, order_status);
      if (!updated) return res.status(404).json({ error: 'Order not found' });
      realtimeHub.broadcastOrderEvent('order_updated', updated);
      res.json({ order: updated });
    } catch (err: any) {
      console.error('Update Supabase order status error:', err);
      res.status(500).json({ error: err.message || 'Failed to update order status' });
    }
  });

  app.patch('/api/admin/orders/:id/payment', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { payment_status, transaction_reference } = req.body;
      const validStatuses = ['pending', 'paid', 'failed', 'cancelled'];
      if (!validStatuses.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
      const updated = await updateSupabaseOrderPayment(orderId, payment_status, transaction_reference);
      if (!updated) return res.status(404).json({ error: 'Order not found' });
      realtimeHub.broadcastOrderEvent('order_updated', updated);
      res.json({ order: updated });
    } catch (err: any) {
      console.error('Update Supabase payment error:', err);
      res.status(500).json({ error: err.message || 'Failed to update payment status' });
    }
  });

  app.post('/api/reservations', optionalAuthMiddleware, (req: AuthRequest, res) => {
    try {
      const { customer_name, customer_phone, customer_email, reservation_date, reservation_time, party_size, number_of_guests, special_requests } = req.body;
      if (!customer_name || String(customer_name).trim().length < 2) return res.status(400).json({ error: 'Please provide your full name' });
      if (!customer_phone || !isValidKenyanPhone(String(customer_phone).replace(/[\s-]/g, ''))) return res.status(400).json({ error: 'Please provide a valid Kenyan phone number (e.g. 0741775878, 254741775878, or +254741775878)' });
      if (!reservation_date || !reservation_time) return res.status(400).json({ error: 'Please select a reservation date and time' });
      const size = Number(party_size ?? number_of_guests);
      if (!Number.isInteger(size) || size < 1 || size > 50) return res.status(400).json({ error: 'Party size must be between 1 and 50' });

      const reservation = db.createReservation({
        id: randomUUID(),
        customer_id: req.user?.id || null,
        customer_name: String(customer_name).trim(),
        customer_phone: formatKenyanPhone(customer_phone),
        customer_email: customer_email || req.user?.email || null,
        reservation_date,
        reservation_time,
        party_size: size,
        special_requests: special_requests || null,
        status: 'pending',
      });
      realtimeHub.broadcastOrderEvent('reservation_created', reservation);
      res.status(201).json({ reservation, restaurantPhone: '0741775878', message: 'Reservation received successfully' });
    } catch (err: any) {
      console.error('Reservation booking error:', err);
      res.status(400).json({ error: err.message || 'Failed to create reservation' });
    }
  });

  app.get('/api/admin/reservations', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const reservations = db.getReservations({ status });
      res.json({ reservations });
    } catch (err: any) {
      console.error('Get admin reservations error:', err);
      res.status(500).json({ error: err.message || 'Failed to load reservations' });
    }
  });

  app.patch('/api/admin/reservations/:id/status', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid reservation status' });
      }
      const reservation = db.updateReservationStatus(req.params.id, status);
      if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
      realtimeHub.broadcastOrderEvent('reservation_updated', reservation);
      res.json({ reservation });
    } catch (err: any) {
      console.error('Update reservation status error:', err);
      res.status(400).json({ error: err.message || 'Failed to update reservation status' });
    }
  });

  app.get('/api/admin/stats', authMiddleware, adminOnlyMiddleware, (_req, res) => {
    try {
      const stats = db.getAdminStats();
      res.json({ stats });
    } catch (err: any) {
      console.error('Fetch stats error:', err);
      res.status(500).json({ error: 'Failed to compute admin statistics' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

let appPromise: ReturnType<typeof createApp> | undefined;

export function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

if (process.env.VERCEL !== '1') {
  getApp().then((app) => {
    app.listen(3000, '0.0.0.0', () => {
      console.log('[New Miami Restaurant] Server active at http://localhost:3000');
    });
  }).catch((err) => {
    console.error('Fatal server boot error:', err);
  });
}

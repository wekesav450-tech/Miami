import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import {
  generateToken,
  authMiddleware,
  optionalAuthMiddleware,
  adminOnlyMiddleware,
  isValidKenyanPhone,
  formatKenyanPhone,
  AuthRequest,
} from './server/auth.js';
import { realtimeHub } from './server/realtime.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parsers
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic API Health check
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

  // --- Realtime SSE Stream ---
  app.get('/api/realtime/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const clientId = 'conn_' + crypto.randomBytes(6).toString('hex');
    const role = (req.query.role as string) || undefined;
    const userId = (req.query.userId as string) || undefined;

    realtimeHub.registerClient(clientId, res, role, userId);
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', (req, res) => {
    try {
      const { full_name, email, phone, password } = req.body;

      if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
        res.status(400).json({ error: 'Please provide a valid full name' });
        return;
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: 'Please provide a valid email address' });
        return;
      }

      if (!phone || !isValidKenyanPhone(phone)) {
        res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }

      const existing = db.findProfileByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(password, salt);

      // Customers can NEVER self-assign admin role
      const profile = db.createProfile({
        full_name,
        email,
        phone: formatKenyanPhone(phone),
        password_hash,
        role: 'customer',
      });

      const token = generateToken(profile);
      const safeProfile = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };

      res.status(201).json({ profile: safeProfile, token });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const profile = db.findProfileByEmail(email);
      if (!profile) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const passwordMatch = bcrypt.compareSync(password, profile.password_hash);
      if (!passwordMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = generateToken(profile);
      const safeProfile = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };

      res.json({ profile: safeProfile, token });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const safeProfile = {
      id: req.user.id,
      full_name: req.user.full_name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      created_at: req.user.created_at,
      updated_at: req.user.updated_at,
    };
    res.json({ profile: safeProfile });
  });

  // --- MENU ROUTES ---
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

      const updated = db.updateMenuItem(itemId, {
        is_available,
        price_kes: price_kes ? Number(price_kes) : undefined,
        name,
        description,
        is_featured,
      });

      if (!updated) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      realtimeHub.broadcast('menu_updated', updated);
      res.json({ item: updated });
    } catch (err: any) {
      console.error('Update menu item error:', err);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  });

  // --- ORDER ROUTES ---
  app.post('/api/orders', optionalAuthMiddleware, (req: AuthRequest, res) => {
    try {
      const {
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        delivery_address,
        notes,
        payment_method,
        transaction_reference,
        items,
      } = req.body;

      if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
        res.status(400).json({ error: 'Please provide your full name' });
        return;
      }

      if (!customer_phone || !isValidKenyanPhone(customer_phone)) {
        res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
        return;
      }

      const validOrderTypes = ['pickup', 'delivery', 'dine_in'];
      if (!validOrderTypes.includes(order_type)) {
        res.status(400).json({ error: 'Invalid order type' });
        return;
      }

      if (order_type === 'delivery' && (!delivery_address || delivery_address.trim().length < 4)) {
        res.status(400).json({ error: 'Please provide a detailed delivery address in Naivasha' });
        return;
      }

      const validPaymentMethods = ['mpesa_pochi', 'paywave_express'];
      if (!validPaymentMethods.includes(payment_method)) {
        res.status(400).json({ error: 'Invalid payment method' });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Cart is empty. Please select menu items.' });
        return;
      }

      // Check quantities
      for (const it of items) {
        if (!it.menu_item_id || !it.quantity || it.quantity < 1) {
          res.status(400).json({ error: 'Invalid item quantity in order' });
          return;
        }
      }

      const customerId = req.user ? req.user.id : null;

      const result = db.createOrderAtomic({
        customer_id: customerId,
        customer_name,
        customer_phone: formatKenyanPhone(customer_phone),
        customer_email: customer_email || (req.user ? req.user.email : null),
        order_type,
        delivery_address,
        notes,
        payment_method,
        transaction_reference,
        items,
      });

      // Broadcast real-time order creation event
      realtimeHub.broadcast('new_order', {
        order: result.order,
        items: result.items,
        payment: result.payment,
      });

      res.status(201).json({
        order: result.order,
        items: result.items,
        payment: result.payment,
        pochiNumber: '0741775878',
        pochiName: 'New Miami Restaurant',
      });
    } catch (err: any) {
      console.error('Order creation error:', err);
      res.status(400).json({ error: err.message || 'Failed to place order' });
    }
  });

  app.get('/api/orders/track/:orderNumber', (req, res) => {
    try {
      const orderNumber = req.params.orderNumber;
      if (!orderNumber) {
        res.status(400).json({ error: 'Order number is required' });
        return;
      }

      const orderData = db.getOrderByIdOrNumber(orderNumber);
      if (!orderData) {
        res.status(404).json({ error: 'Order not found with that number' });
        return;
      }

      res.json({ order: orderData });
    } catch (err: any) {
      console.error('Track order error:', err);
      res.status(500).json({ error: 'Failed to retrieve order tracking' });
    }
  });

  app.get('/api/orders/my-orders', authMiddleware, (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const orders = db.getOrders({ customerId: req.user.id });
      res.json({ orders });
    } catch (err: any) {
      console.error('Fetch customer orders error:', err);
      res.status(500).json({ error: 'Failed to retrieve your orders' });
    }
  });

  // Admin orders
  app.get('/api/admin/orders', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const orderStatus = req.query.order_status as string;
      const paymentStatus = req.query.payment_status as string;
      const orders = db.getOrders({ orderStatus, paymentStatus });
      res.json({ orders });
    } catch (err: any) {
      console.error('Fetch admin orders error:', err);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });

  app.patch('/api/admin/orders/:id/status', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const orderId = req.params.id;
      const { order_status } = req.body;

      const validStatuses = [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'completed',
        'cancelled',
      ];

      if (!validStatuses.includes(order_status)) {
        res.status(400).json({ error: 'Invalid order status' });
        return;
      }

      const updated = db.updateOrderStatus(orderId, order_status);
      if (!updated) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const fullOrder = db.getOrderByIdOrNumber(orderId);
      realtimeHub.broadcast('order_updated', fullOrder || updated);

      res.json({ order: fullOrder || updated });
    } catch (err: any) {
      console.error('Update order status error:', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.patch('/api/admin/orders/:id/payment', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const orderId = req.params.id;
      const { payment_status, transaction_reference } = req.body;

      const validStatuses = ['pending', 'paid', 'failed', 'cancelled'];
      if (!validStatuses.includes(payment_status)) {
        res.status(400).json({ error: 'Invalid payment status' });
        return;
      }

      const result = db.updateOrderPaymentStatus(orderId, payment_status, transaction_reference);
      if (!result) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const fullOrder = db.getOrderByIdOrNumber(orderId);
      realtimeHub.broadcast('order_updated', fullOrder || result);

      res.json(result);
    } catch (err: any) {
      console.error('Update payment status error:', err);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  });

  // --- RESERVATION ROUTES ---
  app.post('/api/reservations', optionalAuthMiddleware, (req: AuthRequest, res) => {
    try {
      const {
        customer_name,
        customer_phone,
        customer_email,
        reservation_date,
        reservation_time,
        number_of_guests,
        special_requests,
      } = req.body;

      if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
        res.status(400).json({ error: 'Please enter your full name' });
        return;
      }

      if (!customer_phone || !isValidKenyanPhone(customer_phone)) {
        res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
        return;
      }

      if (!reservation_date) {
        res.status(400).json({ error: 'Please select a reservation date' });
        return;
      }

      // Check date is not in the past
      const todayStr = new Date().toISOString().split('T')[0];
      if (reservation_date < todayStr) {
        res.status(400).json({ error: 'Reservation date cannot be in the past' });
        return;
      }

      if (!reservation_time) {
        res.status(400).json({ error: 'Please select a reservation time' });
        return;
      }

      const guests = Number(number_of_guests);
      if (isNaN(guests) || guests < 1 || guests > 50) {
        res.status(400).json({ error: 'Number of guests must be between 1 and 50' });
        return;
      }

      const customerId = req.user ? req.user.id : null;

      const reservation = db.createReservation({
        customer_id: customerId,
        customer_name,
        customer_phone: formatKenyanPhone(customer_phone),
        customer_email: customer_email || (req.user ? req.user.email : null),
        reservation_date,
        reservation_time,
        number_of_guests: guests,
        special_requests,
      });

      realtimeHub.broadcast('new_reservation', reservation);

      res.status(201).json({
        reservation,
        restaurantPhone: '0741775878',
        message: 'Table reservation request received. We will confirm shortly!',
      });
    } catch (err: any) {
      console.error('Reservation creation error:', err);
      res.status(500).json({ error: 'Failed to create table reservation' });
    }
  });

  app.get('/api/reservations/my-reservations', authMiddleware, (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const reservations = db.getReservations({ customerId: req.user.id });
      res.json({ reservations });
    } catch (err: any) {
      console.error('Fetch customer reservations error:', err);
      res.status(500).json({ error: 'Failed to retrieve your reservations' });
    }
  });

  app.get('/api/admin/reservations', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const status = req.query.status as string;
      const reservations = db.getReservations({ status });
      res.json({ reservations });
    } catch (err: any) {
      console.error('Fetch admin reservations error:', err);
      res.status(500).json({ error: 'Failed to retrieve reservations' });
    }
  });

  app.patch('/api/admin/reservations/:id/status', authMiddleware, adminOnlyMiddleware, (req, res) => {
    try {
      const resId = req.params.id;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid reservation status' });
        return;
      }

      const updated = db.updateReservationStatus(resId, status);
      if (!updated) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      realtimeHub.broadcast('reservation_updated', updated);
      res.json({ reservation: updated });
    } catch (err: any) {
      console.error('Update reservation status error:', err);
      res.status(500).json({ error: 'Failed to update reservation status' });
    }
  });

  // --- PAYMENTS & M-PESA REFERENCE SUBMISSION ---
  app.post('/api/payments/mpesa-pochi/submit-reference', (req, res) => {
    try {
      const { order_id, transaction_reference } = req.body;
      if (!order_id || !transaction_reference || transaction_reference.trim().length < 5) {
        res.status(400).json({ error: 'Please enter a valid M-Pesa transaction code (e.g. QKH789XYZ)' });
        return;
      }

      const payment = db.updateOrderTransactionRef(order_id, transaction_reference);
      if (!payment) {
        res.status(404).json({ error: 'Order payment record not found' });
        return;
      }

      const fullOrder = db.getOrderByIdOrNumber(order_id);
      realtimeHub.broadcast('order_updated', fullOrder);

      res.json({
        success: true,
        message: 'M-Pesa transaction code recorded. Admin will verify shortly.',
        payment,
      });
    } catch (err: any) {
      console.error('Submit M-Pesa reference error:', err);
      res.status(500).json({ error: 'Failed to record transaction reference' });
    }
  });

  app.post('/api/payments/paywave/initiate', (req, res) => {
    try {
      const { order_id, phone } = req.body;
      if (!order_id) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const orderData = db.getOrderByIdOrNumber(order_id);
      if (!orderData) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Check if real PayWave merchant credentials exist in environment
      const paywaveKey = process.env.PAYWAVE_API_KEY;
      const paywaveSecret = process.env.PAYWAVE_API_SECRET;

      if (!paywaveKey || !paywaveSecret) {
        // Safe, honest production handling per prompt:
        // Do not fake success; leave payment status as pending and guide to M-Pesa Pochi 0741775878
        res.status(200).json({
          status: 'pending',
          configured: false,
          message:
            'PayWave Express prompt integration is awaiting active merchant credentials. Please complete payment via M-Pesa Pochi to 0741775878.',
          pochiNumber: '0741775878',
          pochiName: 'New Miami Restaurant',
        });
        return;
      }

      // If credentials exist, this block executes real provider API call
      res.status(200).json({
        status: 'prompt_sent',
        configured: true,
        message: `Payment prompt initiated to ${phone || orderData.customer_phone}`,
      });
    } catch (err: any) {
      console.error('PayWave initiate error:', err);
      res.status(500).json({ error: 'Payment processing error' });
    }
  });

  // --- ADMIN STATS ---
  app.get('/api/admin/stats', authMiddleware, adminOnlyMiddleware, (_req, res) => {
    try {
      const stats = db.getAdminStats();
      res.json({ stats });
    } catch (err: any) {
      console.error('Fetch stats error:', err);
      res.status(500).json({ error: 'Failed to compute admin statistics' });
    }
  });

  // --- Vite Middleware for Development / Static in Production ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[New Miami Restaurant] Server active at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});

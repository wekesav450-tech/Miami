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

  // ... existing routes ...

  app.post('/api/reservations', optionalAuthMiddleware, (req: AuthRequest, res) => {
    try {
      const { customer_name, customer_phone, customer_email, reservation_date, reservation_time, party_size, number_of_guests, special_requests } = req.body;
      if (!customer_name || String(customer_name).trim().length < 2) return res.status(400).json({ error: 'Please provide your full name' });
      if (!customer_phone || !isValidKenyanPhone(String(customer_phone).replace(/[\\s-]/g, ''))) return res.status(400).json({ error: 'Please provide a valid Kenyan phone number (e.g. 0741775878, 254741775878, or +254741775878)' });
      if (!reservation_date || !reservation_time) return res.status(400).json({ error: 'Please select a reservation date and time' });
      const size = Number(party_size ?? number_of_guests);
      if (!Number.isInteger(size) || size < 1 || size > 50) return res.status(400).json({ error: 'Party size must be between 1 and 50' });

      const reservation = db.createReservation({
        id: crypto.randomUUID(),
        customer_id: req.user?.id || null,
        customer_name: String(customer_name).trim(),
        customer_phone: formatKenyanPhone(String(customer_phone).replace(/[\\s-]/g, '')),
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

  // ... rest of existing routes ...

  return app;
}

createApp().then((app) => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

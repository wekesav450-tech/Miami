import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from './menu-data.js';

export interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItemRecord {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_kes: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: 'pickup' | 'delivery' | 'dine_in';
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: 'mpesa_pochi' | 'paywave_express';
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  order_status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'completed'
    | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface ReservationRecord {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  special_requests: string | null;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  payment_method: 'mpesa_pochi' | 'paywave_express';
  amount: number;
  currency: string;
  transaction_reference: string | null;
  provider_response: string | null;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
}

interface DatabaseSchema {
  profiles: ProfileRecord[];
  menu_categories: CategoryRecord[];
  menu_items: MenuItemRecord[];
  orders: OrderRecord[];
  order_items: OrderItemRecord[];
  reservations: ReservationRecord[];
  payments: PaymentRecord[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    profiles: [],
    menu_categories: [],
    menu_items: [],
    orders: [],
    order_items: [],
    reservations: [],
    payments: [],
  };

  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
          menu_categories: Array.isArray(parsed.menu_categories) ? parsed.menu_categories : [],
          menu_items: Array.isArray(parsed.menu_items) ? parsed.menu_items : [],
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          order_items: Array.isArray(parsed.order_items) ? parsed.order_items : [],
          reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
          payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        };
      }
    } catch (err) {
      console.error('Error reading database file, using fallback in-memory store:', err);
    }

    // Seed Menu Categories if empty
    if (this.data.menu_categories.length === 0) {
      const now = new Date().toISOString();
      this.data.menu_categories = INITIAL_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        display_order: c.display_order,
        is_active: c.is_active,
        created_at: now,
      }));
    }

    // Seed Menu Items if empty
    if (this.data.menu_items.length === 0) {
      const now = new Date().toISOString();
      const catMap = new Map(this.data.menu_categories.map((c) => [c.slug, c.id]));

      this.data.menu_items = INITIAL_MENU_ITEMS.map((item) => ({
        id: item.id,
        category_id: catMap.get(item.category_slug) || this.data.menu_categories[0].id,
        name: item.name,
        description: item.description,
        price_kes: item.price_kes,
        image_url: item.image_url,
        is_available: item.is_available,
        is_featured: item.is_featured,
        created_at: now,
        updated_at: now,
      }));
    }

    // Seed Admin Account if not present
    this.bootstrapAdmin();

    this.save();
    this.isInitialized = true;
  }

  private bootstrapAdmin() {
    const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || 'admin@newmiamirestaurant.co.ke').trim().toLowerCase();
    const adminPass = process.env.ADMIN_INITIAL_PASSWORD || 'MiamiAdmin2026!Naivasha';
    const existingAdmin = this.data.profiles.find((p) => p.email.toLowerCase() === adminEmail);

    if (!existingAdmin) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(adminPass, salt);
      const now = new Date().toISOString();

      const adminUser: ProfileRecord = {
        id: 'admin_' + crypto.randomBytes(6).toString('hex'),
        full_name: 'New Miami Admin',
        email: adminEmail,
        phone: '0741775878',
        role: 'admin',
        password_hash: hash,
        created_at: now,
        updated_at: now,
      };
      this.data.profiles.push(adminUser);
      console.log(`[Database] Bootstrap Admin provisioned: ${adminEmail}`);
    } else {
      // Ensure admin role is always maintained
      existingAdmin.role = 'admin';
      if (process.env.ADMIN_INITIAL_PASSWORD) {
        // If an explicit password env is set, sync the hash if not matching
        const matches = bcrypt.compareSync(adminPass, existingAdmin.password_hash);
        if (!matches) {
          const salt = bcrypt.genSaltSync(10);
          existingAdmin.password_hash = bcrypt.hashSync(adminPass, salt);
          existingAdmin.updated_at = new Date().toISOString();
          console.log(`[Database] Admin password synchronized from environment for: ${adminEmail}`);
        }
      }
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err) {
      console.error('[Database] Failed to write database file:', err);
    }
  }

  // --- Profile Methods ---
  public findProfileByEmail(email: string): ProfileRecord | undefined {
    return this.data.profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findProfileById(id: string): ProfileRecord | undefined {
    return this.data.profiles.find((p) => p.id === id);
  }

  public createProfile(data: {
    full_name: string;
    email: string;
    phone: string;
    password_hash: string;
    role?: 'customer' | 'admin';
  }): ProfileRecord {
    const now = new Date().toISOString();
    const profile: ProfileRecord = {
      id: 'usr_' + crypto.randomUUID(),
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: data.role || 'customer',
      password_hash: data.password_hash,
      created_at: now,
      updated_at: now,
    };
    this.data.profiles.push(profile);
    this.save();
    return profile;
  }

  // --- Menu Categories & Items ---
  public getCategories(): CategoryRecord[] {
    return [...this.data.menu_categories].sort((a, b) => a.display_order - b.display_order);
  }

  public getMenuItems(includeUnavailable = true): (MenuItemRecord & { category_name: string })[] {
    const catMap = new Map(this.data.menu_categories.map((c) => [c.id, c.name]));
    const items = includeUnavailable
      ? this.data.menu_items
      : this.data.menu_items.filter((i) => i.is_available);

    return items.map((i) => ({
      ...i,
      category_name: catMap.get(i.category_id) || 'Uncategorized',
    }));
  }

  public getMenuItemById(id: string): MenuItemRecord | undefined {
    return this.data.menu_items.find((i) => i.id === id);
  }

  public updateMenuItem(
    id: string,
    updates: Partial<Pick<MenuItemRecord, 'is_available' | 'price_kes' | 'name' | 'description' | 'is_featured' | 'image_url'>>
  ): MenuItemRecord | null {
    const item = this.data.menu_items.find((i) => i.id === id);
    if (!item) return null;

    if (updates.is_available !== undefined) item.is_available = updates.is_available;
    if (updates.price_kes !== undefined && updates.price_kes > 0) item.price_kes = updates.price_kes;
    if (updates.name !== undefined) item.name = updates.name.trim();
    if (updates.description !== undefined) item.description = updates.description.trim();
    if (updates.is_featured !== undefined) item.is_featured = updates.is_featured;
    if (updates.image_url !== undefined) item.image_url = updates.image_url.trim();

    item.updated_at = new Date().toISOString();
    this.save();
    return item;
  }

  // --- Orders & Atomic Creation ---
  public createOrderAtomic(payload: {
    customer_id: string | null;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    order_type: 'pickup' | 'delivery' | 'dine_in';
    delivery_address: string | null;
    notes: string | null;
    payment_method: 'mpesa_pochi' | 'paywave_express';
    transaction_reference?: string;
    items: { menu_item_id: string; quantity: number }[];
  }): { order: OrderRecord; items: OrderItemRecord[]; payment: PaymentRecord } {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const now = new Date().toISOString();
    const orderId = 'ord_' + crypto.randomUUID();

    // Generate unique human-readable Order Number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `NMR-${new Date().getFullYear()}-${randomSuffix}`;

    // Calculate trusted prices directly from DB
    let subtotal = 0;
    const orderItems: OrderItemRecord[] = [];

    for (const itemReq of payload.items) {
      const menuItem = this.getMenuItemById(itemReq.menu_item_id);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${itemReq.menu_item_id}`);
      }
      if (!menuItem.is_available) {
        throw new Error(`Item "${menuItem.name}" is currently out of stock`);
      }
      if (itemReq.quantity <= 0 || !Number.isInteger(itemReq.quantity)) {
        throw new Error(`Invalid quantity for ${menuItem.name}`);
      }

      const itemSubtotal = menuItem.price_kes * itemReq.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        id: 'oit_' + crypto.randomUUID(),
        order_id: orderId,
        menu_item_id: menuItem.id,
        item_name_snapshot: menuItem.name,
        quantity: itemReq.quantity,
        unit_price: menuItem.price_kes,
        subtotal: itemSubtotal,
        created_at: now,
      });
    }

    // Standard Naivasha local delivery fee: KES 150 (if delivery)
    const deliveryFee = payload.order_type === 'delivery' ? 150 : 0;
    const totalAmount = subtotal + deliveryFee;

    const order: OrderRecord = {
      id: orderId,
      order_number: orderNumber,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      customer_email: payload.customer_email ? payload.customer_email.trim().toLowerCase() : null,
      order_type: payload.order_type,
      delivery_address: payload.order_type === 'delivery' ? (payload.delivery_address?.trim() || null) : null,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      payment_method: payload.payment_method,
      payment_status: 'pending',
      order_status: 'pending',
      notes: payload.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    const payment: PaymentRecord = {
      id: 'pay_' + crypto.randomUUID(),
      order_id: orderId,
      payment_method: payload.payment_method,
      amount: totalAmount,
      currency: 'KES',
      transaction_reference: payload.transaction_reference?.trim() || null,
      provider_response: null,
      status: 'pending',
      initiated_at: now,
      completed_at: null,
      created_at: now,
    };

    // Atomic insert
    this.data.orders.unshift(order);
    for (const oi of orderItems) {
      this.data.order_items.push(oi);
    }
    this.data.payments.unshift(payment);
    this.save();

    return { order, items: orderItems, payment };
  }

  public getOrders(filters?: {
    customerId?: string;
    orderStatus?: string;
    paymentStatus?: string;
  }): (OrderRecord & { items: OrderItemRecord[]; payment?: PaymentRecord })[] {
    let list = this.data.orders;

    if (filters?.customerId) {
      list = list.filter((o) => o.customer_id === filters.customerId);
    }
    if (filters?.orderStatus && filters.orderStatus !== 'all') {
      list = list.filter((o) => o.order_status === filters.orderStatus);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      list = list.filter((o) => o.payment_status === filters.paymentStatus);
    }

    const itemsMap = new Map<string, OrderItemRecord[]>();
    for (const oi of this.data.order_items) {
      if (!itemsMap.has(oi.order_id)) {
        itemsMap.set(oi.order_id, []);
      }
      itemsMap.get(oi.order_id)!.push(oi);
    }

    const paymentsMap = new Map<string, PaymentRecord>();
    for (const p of this.data.payments) {
      paymentsMap.set(p.order_id, p);
    }

    return list.map((o) => ({
      ...o,
      items: itemsMap.get(o.id) || [],
      payment: paymentsMap.get(o.id),
    }));
  }

  public getOrderByIdOrNumber(idOrNumber: string): (OrderRecord & { items: OrderItemRecord[]; payment?: PaymentRecord }) | null {
    const order = this.data.orders.find(
      (o) => o.id === idOrNumber || o.order_number.toUpperCase() === idOrNumber.toUpperCase().trim()
    );
    if (!order) return null;

    const items = this.data.order_items.filter((oi) => oi.order_id === order.id);
    const payment = this.data.payments.find((p) => p.order_id === order.id);

    return { ...order, items, payment };
  }

  public updateOrderStatus(
    orderId: string,
    orderStatus: OrderRecord['order_status']
  ): OrderRecord | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    // Define valid state transitions
    const validTransitions: Record<OrderRecord['order_status'], OrderRecord['order_status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'completed', 'cancelled'],
      out_for_delivery: ['completed', 'cancelled'],
      completed: [], // terminal state
      cancelled: [], // terminal state
    };

    if (order.order_status !== orderStatus) {
      const allowedNext = validTransitions[order.order_status] || [];
      if (!allowedNext.includes(orderStatus)) {
        throw new Error(
          `Cannot transition order from '${order.order_status}' to '${orderStatus}'. Allowed transitions: ${allowedNext.join(', ') || 'none (terminal state)'}`
        );
      }
    }

    order.order_status = orderStatus;
    order.updated_at = new Date().toISOString();
    this.save();
    return order;
  }

  public updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: PaymentRecord['status'],
    transactionRef?: string
  ): { order: OrderRecord; payment?: PaymentRecord } | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.payment_status = paymentStatus;
    order.updated_at = new Date().toISOString();

    const payment = this.data.payments.find((p) => p.order_id === orderId);
    if (payment) {
      payment.status = paymentStatus;
      if (transactionRef) payment.transaction_reference = transactionRef.trim();
      if (paymentStatus === 'paid') payment.completed_at = new Date().toISOString();
      else payment.completed_at = null;
    }

    this.save();
    return { order, payment };
  }

  public updateOrderTransactionRef(orderId: string, transactionRef: string): PaymentRecord | null {
    const payment = this.data.payments.find((p) => p.order_id === orderId);
    if (!payment) return null;

    payment.transaction_reference = transactionRef.trim();
    this.save();
    return payment;
  }

  // --- Reservations ---
  public createReservation(payload: {
    customer_id: string | null;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    reservation_date: string;
    reservation_time: string;
    number_of_guests: number;
    special_requests: string | null;
  }): ReservationRecord {
    const now = new Date().toISOString();
    const resId = 'res_' + crypto.randomUUID();

    const reservation: ReservationRecord = {
      id: resId,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      customer_email: payload.customer_email ? payload.customer_email.trim().toLowerCase() : null,
      reservation_date: payload.reservation_date,
      reservation_time: payload.reservation_time,
      number_of_guests: payload.number_of_guests,
      special_requests: payload.special_requests?.trim() || null,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    this.data.reservations.unshift(reservation);
    this.save();
    return reservation;
  }

  public getReservations(filters?: {
    customerId?: string;
    status?: string;
  }): ReservationRecord[] {
    let list = this.data.reservations;
    if (filters?.customerId) {
      list = list.filter((r) => r.customer_id === filters.customerId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }
    return list;
  }

  public getReservationById(id: string): ReservationRecord | undefined {
    return this.data.reservations.find((r) => r.id === id);
  }

  public updateReservationStatus(
    id: string,
    status: ReservationRecord['status']
  ): ReservationRecord | null {
    const res = this.data.reservations.find((r) => r.id === id);
    if (!res) return null;

    const validTransitions: Record<ReservationRecord['status'], ReservationRecord['status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['seated', 'cancelled'],
      seated: ['completed', 'cancelled'],
      completed: [], // terminal state
      cancelled: [], // terminal state
    };

    if (res.status !== status) {
      const allowedNext = validTransitions[res.status] || [];
      if (!allowedNext.includes(status)) {
        throw new Error(
          `Cannot transition reservation from '${res.status}' to '${status}'. Allowed transitions: ${allowedNext.join(', ') || 'none (terminal state)'}`
        );
      }
    }

    res.status = status;
    res.updated_at = new Date().toISOString();
    this.save();
    return res;
  }

  // --- Admin Analytics & Aggregates ---
  public getAdminStats(): {
    totalRevenueKes: number;
    totalOrdersCount: number;
    pendingOrdersCount: number;
    completedOrdersCount: number;
    activeReservationsCount: number;
    totalMenuItemsCount: number;
    todayRevenueKes: number;
  } {
    const orders = this.data.orders;
    const todayStr = new Date().toISOString().split('T')[0];

    let totalRevenue = 0;
    let todayRevenue = 0;
    let pendingCount = 0;
    let completedCount = 0;

    for (const o of orders) {
      if (o.payment_status === 'paid') {
        totalRevenue += o.total_amount;
        if (o.created_at.startsWith(todayStr)) {
          todayRevenue += o.total_amount;
        }
      }
      if (o.order_status === 'pending') pendingCount++;
      if (o.order_status === 'completed') completedCount++;
    }

    const activeReservations = this.data.reservations.filter(
      (r) => r.status === 'pending' || r.status === 'confirmed'
    ).length;

    return {
      totalRevenueKes: totalRevenue,
      totalOrdersCount: orders.length,
      pendingOrdersCount: pendingCount,
      completedOrdersCount: completedCount,
      activeReservationsCount: activeReservations,
      totalMenuItemsCount: this.data.menu_items.length,
      todayRevenueKes: todayRevenue,
    };
  }
}

export const db = new DatabaseEngine();

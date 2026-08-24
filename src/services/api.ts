import { createClient } from '@supabase/supabase-js';
import {
  MenuCategory,
  MenuItem,
  Order,
  Reservation,
  UserProfile,
  CreateOrderPayload,
  CreateReservationPayload,
  AdminStats,
  PaymentRecord,
} from '../types';

const TOKEN_KEY = 'nmr_auth_token';
const USER_KEY = 'nmr_user_profile';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error('Missing Supabase frontend environment variables');
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const authStorage = {
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); },
  setToken(token: string) { localStorage.setItem(TOKEN_KEY, token); },
  removeToken() { localStorage.removeItem(TOKEN_KEY); },
  getProfile(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  setProfile(profile: UserProfile) { localStorage.setItem(USER_KEY, JSON.stringify(profile)); },
  removeProfile() { localStorage.removeItem(USER_KEY); },
  clear() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(endpoint, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.detail === 'string' && data.detail.trim()
      ? `${data.error || 'Request failed'} — ${data.detail}`
      : data.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  auth: {
    async register(data: { full_name: string; email: string; phone: string; password: string }): Promise<{ profile: UserProfile; token: string }> {
      const res = await apiRequest<{ profile: UserProfile; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
      authStorage.setToken(res.token); authStorage.setProfile(res.profile); return res;
    },
    async login(data: { email: string; password: string }): Promise<{ profile: UserProfile; token: string }> {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email: data.email.trim(), password: data.password });
      if (error) throw new Error(error.message);
      const authUser = authData.user;
      if (!authUser || !authData.session) throw new Error('Supabase did not return an authenticated session');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at, updated_at')
        .eq('id', authUser.id)
        .single();
      if (profileError || !profileData) { await supabase.auth.signOut(); throw new Error('Your account profile could not be loaded'); }
      const profile = profileData as UserProfile;
      authStorage.setToken(authData.session.access_token); authStorage.setProfile(profile);
      return { profile, token: authData.session.access_token };
    },
    async getMe(): Promise<UserProfile | null> {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        const { data, error } = await supabase.from('profiles').select('id, full_name, email, phone, role, created_at, updated_at').eq('id', user.id).single();
        if (error || !data) throw error || new Error('Profile not found');
        const profile = data as UserProfile; authStorage.setProfile(profile); return profile;
      } catch { authStorage.clear(); return null; }
    },
    logout() { void supabase.auth.signOut(); authStorage.clear(); },
  },
  menu: {
    async getCategories(): Promise<MenuCategory[]> { const res = await apiRequest<{ categories: MenuCategory[] }>('/api/menu/categories'); return res.categories; },
    async getItems(includeAll = false): Promise<MenuItem[]> { const res = await apiRequest<{ items: MenuItem[] }>(includeAll ? '/api/menu/items?all=true' : '/api/menu/items'); return res.items; },
    async updateItem(id: string, updates: Partial<Pick<MenuItem, 'is_available' | 'price_kes' | 'name' | 'description' | 'is_featured'>>): Promise<MenuItem> {
      const res = await apiRequest<{ item: MenuItem }>(`/api/admin/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }); return res.item;
    },
  },
  orders: {
    async create(payload: CreateOrderPayload): Promise<{ order: Order; pochiNumber: string; pochiName: string }> {
      return apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    },
    async track(orderNumber: string): Promise<Order> { const res = await apiRequest<{ order: Order }>(`/api/orders/track/${encodeURIComponent(orderNumber)}`); return res.order; },
    async getMyOrders(): Promise<Order[]> { const res = await apiRequest<{ orders: Order[] }>('/api/orders/my-orders'); return res.orders; },
    async getAdminOrders(filters?: { order_status?: string; payment_status?: string }): Promise<Order[]> {
      const params = new URLSearchParams(); if (filters?.order_status) params.append('order_status', filters.order_status); if (filters?.payment_status) params.append('payment_status', filters.payment_status);
      const res = await apiRequest<{ orders: Order[] }>(`/api/admin/orders?${params.toString()}`); return res.orders;
    },
    async updateStatus(orderId: string, order_status: Order['order_status']): Promise<Order> { const res = await apiRequest<{ order: Order }>(`/api/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ order_status }) }); return res.order; },
    async updatePayment(orderId: string, payment_status: Order['payment_status'], transaction_reference?: string): Promise<{ order: Order; payment?: PaymentRecord }> { return apiRequest(`/api/admin/orders/${orderId}/payment`, { method: 'PATCH', body: JSON.stringify({ payment_status, transaction_reference }) }); },
  },
  reservations: {
    async create(payload: CreateReservationPayload): Promise<{ reservation: Reservation; restaurantPhone: string; message: string }> { return apiRequest('/api/reservations', { method: 'POST', body: JSON.stringify(payload) }); },
    async getMyReservations(): Promise<Reservation[]> { const res = await apiRequest<{ reservations: Reservation[] }>('/api/reservations/my-reservations'); return res.reservations; },
    async getAdminReservations(status?: string): Promise<Reservation[]> { const res = await apiRequest<{ reservations: Reservation[] }>(status && status !== 'all' ? `/api/admin/reservations?status=${status}` : '/api/admin/reservations'); return res.reservations; },
    async updateStatus(id: string, status: Reservation['status']): Promise<Reservation> { const res = await apiRequest<{ reservation: Reservation }>(`/api/admin/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); return res.reservation; },
  },
  payments: {
    async submitMpesaCode(orderId: string, code: string): Promise<{ success: boolean; message: string }> { return apiRequest('/api/payments/mpesa-pochi/submit-reference', { method: 'POST', body: JSON.stringify({ order_id: orderId, transaction_reference: code }) }); },
    async initiatePayWave(orderId: string, phone?: string): Promise<{ status: string; configured: boolean; message: string; pochiNumber?: string; pochiName?: string }> { return apiRequest('/api/payments/paywave/initiate', { method: 'POST', body: JSON.stringify({ order_id: orderId, phone }) }); },
  },
  admin: {
    async getStats(): Promise<AdminStats> { const res = await apiRequest<{ stats: AdminStats }>('/api/admin/stats'); return res.stats; },
    async updateSettings(settings: { delivery_fee_kes?: number; phone?: string; address?: string }): Promise<any> { return apiRequest('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) }); },
  },
  settings: {
    async get(): Promise<{ settings: { delivery_fee_kes: number; currency: string; business_name: string; pochi_number: string; phone: string; address: string } }> { return apiRequest('/api/settings'); },
  },
  realtime: {
    // Vercel-safe realtime: the admin dashboard polls its authenticated APIs.
    // No EventSource/SSE connection is created here, preventing 300-second function timeouts.
    connect(_onMessage: (event: { type: string; data: any; timestamp: string }) => void): () => void {
      return () => {};
    },
  },
};

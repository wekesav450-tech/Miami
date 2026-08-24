import crypto from 'crypto';

function config() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing Supabase server key environment variable');
  const normalizedKey = key.trim();
  return { url: rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''), key: normalizedKey, isNewSecretKey: normalizedKey.startsWith('sb_secret_') };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key, isNewSecretKey } = config();
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers as Record<string, string> || {}) };
  if (!isNewSecretKey) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try { const parsed = JSON.parse(text); detail = parsed.message || parsed.error_description || parsed.error || parsed.hint || text; } catch {}
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }
  return text ? JSON.parse(text) : (null as T);
}

export async function createSupabaseReservation(payload: {
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  special_requests: string | null;
}) {
  const reservation = {
    id: crypto.randomUUID(),
    customer_id: payload.customer_id,
    customer_name: payload.customer_name.trim(),
    customer_phone: payload.customer_phone.trim(),
    customer_email: payload.customer_email?.trim().toLowerCase() || null,
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    number_of_guests: payload.number_of_guests,
    special_requests: payload.special_requests?.trim() || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const rows = await request<any[]>('reservations', { method: 'POST', body: JSON.stringify(reservation) });
  return rows[0] || reservation;
}

export async function getSupabaseReservations(status?: string) {
  const params = new URLSearchParams({ select: '*', order: 'created_at.desc' });
  if (status && status !== 'all') params.set('status', `eq.${status}`);
  return request<any[]>(`reservations?${params.toString()}`);
}

export async function updateSupabaseReservationStatus(id: string, status: string) {
  const rows = await request<any[]>(`reservations?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  return rows[0] || null;
}
